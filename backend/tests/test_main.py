import os
import sys
import time
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.append(str(Path(__file__).resolve().parent.parent))


os.environ["MONGO_URI"] = "mongodb://localhost:27017"
os.environ["CLOUDINARY_CLOUD_NAME"] = "fake_cloud"
os.environ["CLOUDINARY_API_KEY"] = "fake_key"
os.environ["CLOUDINARY_API_SECRET"] = "fake_secret"
os.environ["HF"] = "fake_hf_token"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_at_least_32_chars_long"


mock_mongo = patch("pymongo.MongoClient").start()
mock_client_instance = mock_mongo.return_value

mock_db = MagicMock()
mock_client_instance.__getitem__.return_value = mock_db

# This is a white box test
mock_users_collection = MagicMock()
mock_songs_collection = MagicMock()


def db_getitem(name):
    if name == "users":
        return mock_users_collection
    elif name == "songs":
        return mock_songs_collection
    return MagicMock()


mock_db.__getitem__.side_effect = db_getitem


import main
from fastapi.testclient import TestClient
from main import app, get_password_hash

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset mocks and clear the in-memory job state before each test."""
    mock_users_collection.reset_mock()
    mock_songs_collection.reset_mock()
    with main.jobs_lock:
        main.generation_jobs.clear()


def test_signup_successful():
    mock_users_collection.find_one.return_value = None
    response = client.post(
        "/auth/signup",
        json={"name": "Arjun", "email": "arjun@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "arjun@example.com"
    mock_users_collection.insert_one.assert_called_once()
    assert response.cookies.get("access_token") is not None


def test_login_successful():
    mock_users_collection.find_one.return_value = {
        "id": "user_123",
        "email": "test@test.com",
        "password_hash": get_password_hash("password123"),
    }
    response = client.post(
        "/auth/login", json={"email": "test@test.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert response.cookies.get("access_token") is not None


@patch("main._get_current_user")
def test_inventory_limits_free_user(mock_get_user):
    mock_get_user.return_value = {
        "id": "free_user",
        "is_pro": False,
        "song_ids": [f"song_{i}" for i in range(26)],
    }
    mock_songs_collection.find_one.return_value = {"id": "new_song", "isPublic": True}

    response = client.post("/inventory/new_song")
    assert response.status_code == 403
    assert "Inventory full" in response.json()["detail"]


@patch("main._get_current_user")
def test_inventory_limits_pro_user(mock_get_user):
    mock_get_user.return_value = {
        "id": "pro_user",
        "is_pro": True,
        "song_ids": [f"song_{i}" for i in range(26)],
    }
    mock_songs_collection.find_one.return_value = {"id": "new_song", "isPublic": True}

    response = client.post("/inventory/new_song")
    assert response.status_code == 200
    assert "Added" in response.json()["message"]


@patch("main._get_current_user")
@patch("main.cloudinary.uploader.upload")
def test_file_upload_logic(mock_upload, mock_get_user):
    mock_get_user.return_value = {"id": "user1", "song_ids": []}
    mock_upload.return_value = {"secure_url": "https://res.cloudinary.com/fake.mp3"}

    file_content = b"fake audio data"
    response = client.post(
        "/upload",
        data={"name": "Test Song", "isPublic": "true"},
        files={"file": ("song.mp3", file_content, "audio/mpeg")},
    )

    assert response.status_code == 200
    assert mock_upload.called
    assert mock_songs_collection.insert_one.called


@patch("main._get_current_user")
def test_generation_concurrency_lock(mock_get_user):
    user_id = "user_lock_test"
    mock_get_user.return_value = {"id": user_id, "credits": 20}

    with patch("main._run_generation") as mock_run:

        def slow_run(*args):
            time.sleep(0.2)

        mock_run.side_effect = slow_run
        res1 = client.post("/generate", json={"lyrics": "test lyrics"})
        assert res1.status_code == 200
        res2 = client.post("/generate", json={"lyrics": "more lyrics"})
        assert res2.status_code == 409
        assert "already in progress" in res2.json()["detail"]


@patch("main._get_current_user")
@patch("main.GradioClient")
def test_ai_failure_credit_refund(mock_gradio, mock_get_user):
    user_id = "user_refund"
    mock_get_user.return_value = {"id": user_id, "credits": 10}

    mock_instance = MagicMock()
    mock_instance.predict.side_effect = Exception("AI Offline")
    mock_gradio.return_value = mock_instance

    response = client.post("/generate", json={"lyrics": "refund me"})
    assert response.status_code == 200

    time.sleep(0.5)

    calls = [call.args[1] for call in mock_users_collection.update_one.call_args_list]
    assert {"$inc": {"credits": 10}} in calls
