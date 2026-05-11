import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import Cookie, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient

from auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# ── Cookie config ───────────────────────────────────────────────────────────────
COOKIE_NAME = "access_token"
COOKIE_SECURE = False  # Set True in production (HTTPS only)
COOKIE_SAMESITE = "lax"


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
    if not user or "password_hash" not in user or not verify_password(body.password, user["password_hash"]):
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
            # Private song – delete from Cloudinary + DB
            audio_url = song.get("audioUrl", "")
            if audio_url:
                # Extract public_id from Cloudinary URL for deletion
                try:
                    # URL like https://res.cloudinary.com/.../video/upload/v123/abcdef.mp3
                    parts = audio_url.split("/upload/")
                    if len(parts) == 2:
                        public_id = parts[1].rsplit(".", 1)[0]  # strip extension
                        # Remove version prefix (v1234567/)
                        if "/" in public_id:
                            public_id = "/".join(public_id.split("/")[1:])
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
                parts = audio_url.split("/upload/")
                if len(parts) == 2:
                    public_id = parts[1].rsplit(".", 1)[0]
                    if "/" in public_id:
                        public_id = "/".join(public_id.split("/")[1:])
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
        songs_collection.update_one({"id": song_id}, {"$set": update_data})

    updated_song = songs_collection.find_one({"id": song_id}, {"_id": 0})
    return updated_song


# ═══════════════════════════════════════════════════════════════════════════════
# INVENTORY ENDPOINT – add a public song to user's personal inventory
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/inventory/{song_id}")
async def add_to_inventory(
    song_id: str, access_token: Optional[str] = Cookie(None)
):
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
