import os
import uuid
from typing import Optional

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


class TapeUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    isPublic: Optional[bool] = None


@app.put("/song/{song_id}")
async def update_song(song_id: str, updates: TapeUpdate):

    update_data = {k: v for k, v in updates.dict().items() if v is not None}

    songs_collection.update_one({"id": song_id}, {"$set": update_data})

    updated_song = songs_collection.find_one({"id": song_id}, {"_id": 0})

    return updated_song
