import bcrypt
from jose import jwt
from fastapi import HTTPException, status
import re

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"



def check_user_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def validate_password(password: str):
    
    if len(password) < 6 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters and contain a letter and a number."
        )

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
