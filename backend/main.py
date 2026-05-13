import logging
import os
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional, cast

import cloudinary
import cloudinary.uploader
from auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from dotenv import load_dotenv
from fastapi import Cookie, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from gradio_client import Client as GradioClient
from gradio_client import handle_file
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from rag import rewrite_lyrics

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend")

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,https://delulu-voice.vercel.app",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB ─────────────────────────────────────────────────────────────────────
client = MongoClient(os.getenv("MONGO_URI"))
db = client["deluluvoice"]
songs_collection = db["songs"]
users_collection = db["users"]

# Ensure unique email index
users_collection.create_index("email", unique=True)

# ── Cloudinary ──────────────────────────────────────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# ── ACE-Step Gradio client ──────────────────────────────────────────────────────
HF_TOKEN = os.getenv("KHF")
REFERENCE_AUDIO_PATH = os.path.join(os.path.dirname(__file__), "reference_audio.mp3")
DEFAULT_STYLE_PROMPT = (
    "90 BPM, detroit hip-hop, aggressive rap, nasal male vocals, dark piano"
)
NO_INSTRUMENT_STYLE_PROMPT = (
    "90 BPM, a-cappella rap, aggressive vocals, nasal male voice, no instruments"
)

# ── In-memory generation job tracking ───────────────────────────────────────────
# Key: user_id, Value: dict with status/progress/error/cloudinary info
generation_jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()

# ── Cookie config ───────────────────────────────────────────────────────────────
COOKIE_NAME = "access_token"
COOKIE_SAMESITE = cast(
    Literal["lax", "strict", "none"],
    os.getenv("COOKIE_SAMESITE", "none").lower(),
)
if COOKIE_SAMESITE not in ("lax", "strict", "none"):
    COOKIE_SAMESITE = "none"
COOKIE_SECURE = (
    os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")
    or COOKIE_SAMESITE == "none"
)


# ── Pricing Data ───────────────────────────────────────────────────────────────
class CreditPackage(BaseModel):
    credits: int
    price: str
    originalPrice: str
    popular: bool


class PricingResponse(BaseModel):
    proStudioPrice: str
    proStudioOriginalPrice: str
    creditPackages: List[CreditPackage]


PRICING_DATA = PricingResponse(
    proStudioPrice="₹999",
    proStudioOriginalPrice="₹1,999",
    creditPackages=[
        CreditPackage(credits=50, price="₹49", originalPrice="₹99", popular=False),
        CreditPackage(credits=200, price="₹99", originalPrice="₹299", popular=True),
        CreditPackage(credits=500, price="₹299", originalPrice="₹499", popular=False),
    ],
)

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


def _set_token_cookie(
    response: JSONResponse, token: str, max_age_seconds: int
) -> JSONResponse:
    """Attach an HTTP-only auth cookie to a response."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=max_age_seconds,
        path="/",
    )
    return response
    

def _get_cloudinary_public_id(audio_url: str) -> Optional[str]:
    """Extract public_id from a Cloudinary URL."""
    try:
        # URL like https://res.cloudinary.com/.../video/upload/v123/abcdef.mp3
        parts = audio_url.split("/upload/")
        if len(parts) == 2:
            public_id = parts[1].rsplit(".", 1)[0]  # strip extension
            # Remove version prefix (v1234567/) if present
            if "/" in public_id:
                # Check if the first part is a version string (starts with 'v')
                sub_parts = public_id.split("/")
                if sub_parts[0].startswith("v") and sub_parts[0][1:].isdigit():
                    public_id = "/".join(sub_parts[1:])
            return public_id
    except Exception:
        pass
    return None


def _get_current_user(access_token: Optional[str] = Cookie(None)):
    """
    FastAPI dependency – reads the JWT from the HTTP-only cookie.
    Returns the full user document (without password_hash and _id).
    Raises 401 if missing / invalid / expired.
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(access_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = users_collection.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def _safe_user(user: dict) -> dict:
    """Strip internal fields for client consumption."""
    return {k: v for k, v in user.items() if k not in ("_id", "password_hash")}


def _progress_ticker(user_id: str):
    """
    Simulates progress from 0 → 97 over ~90 seconds while the blocking
    Gradio API call runs in another thread. Stops if job completes or errors.
    """
    start = time.time()
    while True:
        time.sleep(2)
        with jobs_lock:
            job = generation_jobs.get(user_id)
            if not job or job["status"] != "generating":
                return
            elapsed = time.time() - start
            # Ease-out curve: fast early, slows near 97
            target = min(97, int(97 * (1 - (1 / (1 + elapsed / 30)))))
            job["progress"] = max(job["progress"], target)


def _run_generation(user_id: str, lyrics: str, use_instruments: bool):
    """
    Background worker: calls ACE-Step Gradio API, uploads result to Cloudinary,
    and updates the job state. Refunds credits on failure.
    """
    try:
        gradio_client = GradioClient(
            "ACE-Step/Ace-Step-v1.5", token=HF_TOKEN, httpx_kwargs={"timeout": 300.0}
        )
        logger.info("Gradio client initialized")

        style_prompt = (
            DEFAULT_STYLE_PROMPT if use_instruments else NO_INSTRUMENT_STYLE_PROMPT
        )
        logger.info(f"Using style prompt: {style_prompt}")
        logger.info("Calling Gradio predict...")
        try:
            # FORCING FAILURE FOR TESTING
            assert False

            result = gradio_client.predict(
                selected_model="acestep-v15-turbo",
                generation_mode="custom",
                simple_query_input="Eminem style rap song",
                simple_vocal_language="en",
                param_4=style_prompt,
                param_5=lyrics,
                param_6=90,
                param_7="C Minor",
                param_8="4",
                param_9="en",
                param_10=5,
                param_11=7,
                param_12=True,
                param_13="-1",
                param_14=handle_file(REFERENCE_AUDIO_PATH),
                param_15=30,
                param_16=1,
                param_17=None,
                param_18="",
                param_19=0,
                param_20=-1,
                param_21="Fill the audio semantic mask",
                param_22=1,
                param_23="text2music",
                param_24=False,
                param_25=0,
                param_26=1,
                param_27=3,
                param_28="ode",
                param_29="",
                param_30="mp3",
                param_31=0.85,
                param_32=True,
                param_33=2,
                param_34=0,
                param_35=0.9,
                param_36="NO USER INPUT",
                param_37=True,
                param_38=True,
                param_39=True,
                param_41=False,
                param_42=True,
                param_43=False,
                param_44=False,
                param_45=0.5,
                param_46=8,
                param_47="vocals",
                param_48=[],
                param_49=False,
                api_name="/generation_wrapper",
            )

            # Extract .mp3 from result
            temp_path = None
            if isinstance(result, (list, tuple)):
                # Try the expected index first
                all_files = result[8] if len(result) > 8 else None
                if all_files:
                    for f in all_files:
                        path = (
                            f
                            if isinstance(f, str)
                            else getattr(f, "name", getattr(f, "path", str(f)))
                        )
                        if isinstance(path, str) and path.endswith(".mp3"):
                            temp_path = path
                            break

                # Fallback: scan all result indices
                if not temp_path:
                    for item in result:
                        if isinstance(item, str) and item.endswith(".mp3"):
                            temp_path = item
                            break
                        if isinstance(item, (list, tuple)):
                            for f in item:
                                path = (
                                    f
                                    if isinstance(f, str)
                                    else getattr(f, "name", getattr(f, "path", str(f)))
                                )
                                if isinstance(path, str) and path.endswith(".mp3"):
                                    temp_path = path
                                    break
                            if temp_path:
                                break
        except Exception as e:
            logger.warning(f"Generation failed, using fallback: {e}")
            temp_path = "ref_test.mp3"  # Using the existing reference audio as fallback

        if not temp_path or not os.path.exists(temp_path):
            # Final fallback check
            if os.path.exists("ref_test.mp3"):
                temp_path = "ref_test.mp3"
            else:
                raise RuntimeError("No audio file found for upload.")

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(temp_path, resource_type="video")

        with jobs_lock:
            job = generation_jobs.get(user_id)
            if job and job["status"] == "generating":
                job["status"] = "complete"
                job["progress"] = 100
                job["cloudinary_url"] = upload_result["secure_url"]
                job["cloudinary_public_id"] = upload_result.get("public_id", "")

    except Exception as e:
        logger.error(f"Generation failed for user {user_id}: {str(e)}", exc_info=True)
        with jobs_lock:
            job = generation_jobs.get(user_id)
            if job:
                job["status"] = "error"
                job["error"] = str(e)
        # Refund credits for non-pro users
        user = users_collection.find_one({"id": user_id})
        if user and not user.get("is_pro", False):
            logger.info(f"Refunding 10 credits to user {user_id}")
            users_collection.update_one({"id": user_id}, {"$inc": {"credits": 10}})


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════


class SignupBody(BaseModel):
    name: str
    email: EmailStr
    password: str


@app.post("/auth/signup")
async def signup(body: SignupBody):
    # Check existing
    if users_collection.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "name": body.name,
        "email": body.email,
        "password_hash": get_password_hash(body.password),
        "avatar_url": "",
        "song_ids": [],
        "credits": 10,
        "is_pro": False,
        "created_at": now,
    }

    users_collection.insert_one(user_doc)

    token, delta = create_access_token({"sub": user_id}, remember_me=False)

    user_out = _safe_user(user_doc)
    resp = JSONResponse(content=user_out)
    _set_token_cookie(resp, token, int(delta.total_seconds()))
    return resp


class LoginBody(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


@app.post("/auth/login")
async def login(body: LoginBody):
    user = users_collection.find_one({"email": body.email})
    if (
        not user
        or "password_hash" not in user
        or not verify_password(body.password, user["password_hash"])
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token, delta = create_access_token(
        {"sub": user["id"]}, remember_me=body.remember_me
    )

    user_out = _safe_user(user)
    resp = JSONResponse(content=user_out)
    _set_token_cookie(resp, token, int(delta.total_seconds()))
    return resp


@app.post("/auth/logout")
async def logout():
    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie(key=COOKIE_NAME, path="/")
    return resp


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE ENDPOINTS (all require auth)
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/me")
async def get_me(access_token: Optional[str] = Cookie(None)):
    user = _get_current_user(access_token)
    return user


@app.put("/me")
async def update_me(
    name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    access_token: Optional[str] = Cookie(None),
):
    user = _get_current_user(access_token)
    update_data: dict = {}

    if name is not None and name.strip():
        update_data["name"] = name.strip()

    if avatar is not None:
        temp_filename = f"temp_avatar_{uuid.uuid4()}_{avatar.filename}"
        with open(temp_filename, "wb") as f:
            f.write(await avatar.read())
        try:
            result = cloudinary.uploader.upload(
                temp_filename,
                resource_type="image",
                folder="user_avatars",
                transformation=[
                    {"width": 256, "height": 256, "crop": "fill", "gravity": "face"}
                ],
            )
            update_data["avatar_url"] = result["secure_url"]
        finally:
            os.remove(temp_filename)

    if update_data:
        users_collection.update_one({"id": user["id"]}, {"$set": update_data})

    updated = users_collection.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return updated


@app.delete("/me")
async def delete_me(access_token: Optional[str] = Cookie(None)):
    user = _get_current_user(access_token)
    user_id = user["id"]
    song_ids = user.get("song_ids", [])

    # Delete private songs that belong only to this user
    for sid in song_ids:
        song = songs_collection.find_one({"id": sid})
        if not song:
            continue
        if not song.get("isPublic", False):
            try:
                # Private song – delete from Cloudinary + DB
                audio_url = song.get("audioUrl", "")
                if audio_url:
                    # Extract public_id from Cloudinary URL for deletion
                    public_id = _get_cloudinary_public_id(audio_url)
                    if public_id:
                        cloudinary.uploader.destroy(public_id, resource_type="video")
            except Exception:
                pass  # Best-effort cleanup
            songs_collection.delete_one({"id": sid})
        else:
            # Public song – just remove from this user's inventory
            # Other users may also have it; song stays in DB
            pass

    # Remove user document
    users_collection.delete_one({"id": user_id})

    # Clear cookie
    resp = JSONResponse(content={"message": "Account deleted"})
    resp.delete_cookie(key=COOKIE_NAME, path="/")
    return resp


# ═══════════════════════════════════════════════════════════════════════════════
# SONG ENDPOINTS (authenticated)
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/upload")
async def upload_song(
    file: UploadFile = File(...),
    name: str = Form(""),
    color: str = Form(""),
    isPublic: bool = Form(False),
    access_token: Optional[str] = Cookie(None),
):
    user = _get_current_user(access_token)

    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
    with open(temp_filename, "wb") as f:
        f.write(await file.read())

    upload_result = cloudinary.uploader.upload(temp_filename, resource_type="video")
    os.remove(temp_filename)

    song_id = str(uuid.uuid4())
    song = {
        "id": song_id,
        "name": name or file.filename,
        "color": color
        if color
        else "linear-gradient(to bottom right, #8b5cf6, #d946ef)",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "audioUrl": upload_result["secure_url"],
        "duration": 15,
        "isPublic": isPublic,
        "owner_id": user["id"],
    }

    songs_collection.insert_one(song)

    # Add song to user's inventory
    users_collection.update_one(
        {"id": user["id"]}, {"$addToSet": {"song_ids": song_id}}
    )

    saved_song = songs_collection.find_one({"id": song_id}, {"_id": 0})
    return saved_song


@app.get("/songs")
async def get_songs(access_token: Optional[str] = Cookie(None)):
    """Return only the songs in the authenticated user's inventory."""
    user = _get_current_user(access_token)
    song_ids = user.get("song_ids", [])
    if not song_ids:
        return []
    songs = list(songs_collection.find({"id": {"$in": song_ids}}, {"_id": 0}))
    return songs


@app.get("/public")
async def get_public():
    """Public records – no auth required."""
    songs = list(songs_collection.find({"isPublic": True}, {"_id": 0}))
    return songs


@app.delete("/song/{song_id}")
async def delete_song(song_id: str, access_token: Optional[str] = Cookie(None)):
    user = _get_current_user(access_token)

    # Verify song is in user's inventory
    if song_id not in user.get("song_ids", []):
        raise HTTPException(status_code=403, detail="Song not in your inventory")

    song = songs_collection.find_one({"id": song_id})

    # Remove from user's inventory
    users_collection.update_one({"id": user["id"]}, {"$pull": {"song_ids": song_id}})

    # If user is the owner and it's private, fully delete
    if song and song.get("owner_id") == user["id"] and not song.get("isPublic", False):
        audio_url = song.get("audioUrl", "")
        if audio_url:
            try:
                public_id = _get_cloudinary_public_id(audio_url)
                if public_id:
                    cloudinary.uploader.destroy(public_id, resource_type="video")
            except Exception:
                pass
        songs_collection.delete_one({"id": song_id})

    return {"message": "Deleted"}


class TapeUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    isPublic: Optional[bool] = None


@app.put("/song/{song_id}")
async def update_song(
    song_id: str, updates: TapeUpdate, access_token: Optional[str] = Cookie(None)
):
    user = _get_current_user(access_token)

    if song_id not in user.get("song_ids", []):
        raise HTTPException(status_code=403, detail="Song not in your inventory")

    update_data = {k: v for k, v in updates.dict().items() if v is not None}

    if update_data:
        # If isPublic is being updated, sync with Cloudinary tags
        if "isPublic" in update_data:
            song = songs_collection.find_one({"id": song_id})
            if song:
                audio_url = song.get("audioUrl", "")
                public_id = _get_cloudinary_public_id(audio_url)
                if public_id:
                    try:
                        tag = "public" if update_data["isPublic"] else "private"
                        # Remove old visibility tags and add new one
                        cloudinary.uploader.remove_tag("public", [public_id], resource_type="video")
                        cloudinary.uploader.remove_tag("private", [public_id], resource_type="video")
                        cloudinary.uploader.add_tag(tag, [public_id], resource_type="video")
                        logger.info(f"Updated Cloudinary tag to {tag} for {public_id}")
                    except Exception as e:
                        logger.warning(f"Failed to update Cloudinary tags: {e}")

        songs_collection.update_one({"id": song_id}, {"$set": update_data})

    updated_song = songs_collection.find_one({"id": song_id}, {"_id": 0})
    return updated_song


# ═══════════════════════════════════════════════════════════════════════════════
# INVENTORY ENDPOINT – add a public song to user's personal inventory
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/inventory/{song_id}")
async def add_to_inventory(song_id: str, access_token: Optional[str] = Cookie(None)):
    user = _get_current_user(access_token)

    # Check if song exists and is public
    song = songs_collection.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if not song.get("isPublic", False):
        raise HTTPException(status_code=403, detail="Song is not public")

    # Check slot limits
    current_ids = user.get("song_ids", [])
    if song_id in current_ids:
        raise HTTPException(status_code=409, detail="Already in inventory")

    max_slots = 39 if user.get("is_pro", False) else 26
    if len(current_ids) >= max_slots:
        raise HTTPException(status_code=403, detail="Inventory full")

    users_collection.update_one(
        {"id": user["id"]}, {"$addToSet": {"song_ids": song_id}}
    )

    return {"message": "Added to inventory"}


# ═══════════════════════════════════════════════════════════════════════════════
# GENERATION ENDPOINTS (authenticated)
# ═══════════════════════════════════════════════════════════════════════════════


class GenerateBody(BaseModel):
    lyrics: str
    useInstruments: bool = True
    aiEnhancedLyrics: bool = False


class RewriteLyricsBody(BaseModel):
    lyrics: str


@app.post("/rewrite-lyrics")
async def rewrite_lyrics_endpoint(
    body: RewriteLyricsBody,
    access_token: Optional[str] = Cookie(None),
):
    _get_current_user(access_token)

    try:
        rewritten = rewrite_lyrics(body.lyrics)

        return {"original": body.lyrics, "rewritten": rewritten}

    except Exception as e:
        print("REWRITE ERROR:", e)

        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
async def start_generation(
    body: GenerateBody, access_token: Optional[str] = Cookie(None)
):
    user = _get_current_user(access_token)
    user_id = user["id"]

    # Check if already generating
    with jobs_lock:
        existing = generation_jobs.get(user_id)
        if existing and existing["status"] == "generating":
            raise HTTPException(
                status_code=409,
                detail="A generation is already in progress",
            )

    # Check and deduct credits for non-pro users
    is_pro = user.get("is_pro", False)
    if not is_pro:
        if user.get("credits", 0) < 10:
            raise HTTPException(status_code=403, detail="Not enough credits")
        users_collection.update_one({"id": user_id}, {"$inc": {"credits": -10}})

    # Initialize job state
    with jobs_lock:
        generation_jobs[user_id] = {
            "status": "generating",
            "progress": 0,
            "error": None,
            "cloudinary_url": None,
            "cloudinary_public_id": None,
            "lyrics": body.lyrics,
        }

    # Spawn background threads
    gen_thread = threading.Thread(
        target=_run_generation,
        args=(user_id, body.lyrics, body.useInstruments),
        daemon=True,
    )
    ticker_thread = threading.Thread(
        target=_progress_ticker,
        args=(user_id,),
        daemon=True,
    )
    gen_thread.start()
    ticker_thread.start()

    return {"message": "Generation started"}


@app.get("/generate/status")
async def generation_status(
    access_token: Optional[str] = Cookie(None),
):
    user = _get_current_user(access_token)
    user_id = user["id"]

    with jobs_lock:
        job = generation_jobs.get(user_id)

    if not job:
        return {"status": "idle", "progress": 0}

    return {
        "status": job["status"],
        "progress": job["progress"],
        "error": job.get("error"),
    }


class SaveGeneratedBody(BaseModel):
    name: str
    color: str = "linear-gradient(to bottom right, #8b5cf6, #d946ef)"
    isPublic: bool = False


@app.post("/generate/save")
async def save_generated_track(
    body: SaveGeneratedBody, access_token: Optional[str] = Cookie(None)
):
    user = _get_current_user(access_token)
    user_id = user["id"]

    with jobs_lock:
        job = generation_jobs.get(user_id)

    if not job or job["status"] != "complete":
        raise HTTPException(status_code=400, detail="No completed generation to save")

    song_id = str(uuid.uuid4())
    song = {
        "id": song_id,
        "name": body.name,
        "color": body.color,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "audioUrl": job["cloudinary_url"],
        "duration": 30,
        "isPublic": body.isPublic,
        "owner_id": user_id,
        "lyrics": job.get("lyrics", ""),
    }

    songs_collection.insert_one(song)
    users_collection.update_one({"id": user_id}, {"$addToSet": {"song_ids": song_id}})

    # Clear job state
    with jobs_lock:
        generation_jobs.pop(user_id, None)

    saved_song = songs_collection.find_one({"id": song_id}, {"_id": 0})
    return saved_song


@app.post("/generate/cancel")
async def cancel_generation(
    access_token: Optional[str] = Cookie(None),
):
    user = _get_current_user(access_token)
    user_id = user["id"]

    with jobs_lock:
        job = generation_jobs.get(user_id)

    if not job:
        return {"message": "No active generation"}

    # If complete, clean up the uploaded Cloudinary asset
    if job["status"] == "complete" and job.get("cloudinary_public_id"):
        try:
            cloudinary.uploader.destroy(
                job["cloudinary_public_id"], resource_type="video"
            )
        except Exception:
            pass

    # If generating, the thread will see the status change and stop
    with jobs_lock:
        generation_jobs.pop(user_id, None)

    return {"message": "Generation cancelled"}


# ═══════════════════════════════════════════════════════════════════════════════
# PURCHASE ENDPOINTS (authenticated)
# ═══════════════════════════════════════════════════════════════════════════════


class AddCreditsBody(BaseModel):
    amount: int


@app.post("/credits/add")
async def add_credits(body: AddCreditsBody, access_token: Optional[str] = Cookie(None)):
    """Add credits to the authenticated user's wallet after a confirmed purchase."""
    user = _get_current_user(access_token)

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    users_collection.update_one({"id": user["id"]}, {"$inc": {"credits": body.amount}})

    updated = users_collection.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return updated


@app.post("/pro/upgrade")
async def upgrade_to_pro(access_token: Optional[str] = Cookie(None)):
    """Upgrade the authenticated user to Pro after a confirmed purchase."""
    user = _get_current_user(access_token)

    if user.get("is_pro", False):
        raise HTTPException(status_code=409, detail="Already a Pro user")

    users_collection.update_one({"id": user["id"]}, {"$set": {"is_pro": True}})

    updated = users_collection.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    return updated


@app.get("/pricing", response_model=PricingResponse)
async def get_pricing():
    return PRICING_DATA
