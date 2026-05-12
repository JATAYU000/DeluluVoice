import bcrypt
from datetime import datetime, timedelta, timezone
import jwt
from typing import Optional
import os

# Password Hashing
def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        plain_password = plain_password.encode("utf-8")
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    if isinstance(password, str):
        password = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode("utf-8")


# JWT Auth
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-me")
ALGORITHM = "HS256"

# Token durations
SHORT_TOKEN_EXPIRE = timedelta(hours=24)
LONG_TOKEN_EXPIRE = timedelta(days=30)


def create_access_token(
    data: dict,
    remember_me: bool = False,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, timedelta]:
    """
    Returns (encoded_jwt, actual_expiry_delta) so the caller can set
    the cookie max_age to match.
    """
    to_encode = data.copy()
    if expires_delta:
        delta = expires_delta
    elif remember_me:
        delta = LONG_TOKEN_EXPIRE
    else:
        delta = SHORT_TOKEN_EXPIRE

    expire = datetime.now(timezone.utc) + delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, delta


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
