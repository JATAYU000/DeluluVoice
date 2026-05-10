# import os
# import shutil
# import uuid
# from urllib.parse import unquote

# from fastapi import FastAPI, File, Form, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# SONG_DIR = "songs"
# os.makedirs(SONG_DIR, exist_ok=True)

# songs_db = []


# @app.post("/upload")
# async def upload_song(
#     file: UploadFile = File(...),
#     name: str = Form(""),
#     color: str = Form(""),
#     isPublic: bool = Form(False),
# ):
#     song_id = str(uuid.uuid4())

#     filename = f"{song_id}_{file.filename}"
#     filepath = os.path.join(SONG_DIR, filename)

#     with open(filepath, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     song = {
#         "id": song_id,
#         "name": name or file.filename,
#         "color": color
#         if color
#         else "linear-gradient(to bottom right, #8b5cf6, #d946ef)",
#         "createdAt": "2026-05-10",
#         "audioUrl": f"http://localhost:8000/song/{filename}",
#         "duration": 15,
#         "isPublic": isPublic,
#     }

#     songs_db.append(song)

#     return song


# @app.get("/songs")
# async def get_songs():
#     return songs_db


# @app.get("/public")
# async def get_public():
#     return [s for s in songs_db if s["isPublic"]]


# @app.get("/song/{filename}")
# async def stream_song(filename: str):
#     return FileResponse(os.path.join(SONG_DIR, filename))


# @app.delete("/song/{song_id}")
# async def delete_song(song_id: str):
#     global songs_db

#     song_to_delete = None

#     for song in songs_db:
#         if song["id"] == song_id:
#             song_to_delete = song
#             break

#     if not song_to_delete:
#         return {"error": "Song not found"}

#     # Delete audio file
#     audio_url = song_to_delete["audioUrl"]
#     filename = unquote(audio_url.split("/")[-1])

#     filepath = os.path.join(SONG_DIR, filename)

#     if os.path.exists(filepath):
#         os.remove(filepath)

#     # Remove from DB
#     songs_db = [s for s in songs_db if s["id"] != song_id]

#     return {"message": "Deleted"}

import os
import uuid

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = MongoClient(os.getenv("MONGO_URI"))

db = client["deluluvoice"]
songs_collection = db["songs"]

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


@app.post("/upload")
async def upload_song(
    file: UploadFile = File(...),
    name: str = Form(""),
    color: str = Form(""),
    isPublic: bool = Form(False),
):
    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"

    with open(temp_filename, "wb") as f:
        f.write(await file.read())

    upload_result = cloudinary.uploader.upload(temp_filename, resource_type="video")

    os.remove(temp_filename)

    song = {
        "id": str(uuid.uuid4()),
        "name": name or file.filename,
        "color": color
        if color
        else "linear-gradient(to bottom right, #8b5cf6, #d946ef)",
        "createdAt": "2026-05-10",
        "audioUrl": upload_result["secure_url"],
        "duration": 15,
        "isPublic": isPublic,
    }

    songs_collection.insert_one(song)

    saved_song = songs_collection.find_one({"id": song["id"]}, {"_id": 0})

    return saved_song


@app.get("/songs")
async def get_songs():
    songs = list(songs_collection.find({}, {"_id": 0}))
    return songs


@app.get("/public")
async def get_public():
    songs = list(songs_collection.find({"isPublic": True}, {"_id": 0}))
    return songs


@app.delete("/song/{song_id}")
async def delete_song(song_id: str):
    songs_collection.delete_one({"id": song_id})

    return {"message": "Deleted"}
