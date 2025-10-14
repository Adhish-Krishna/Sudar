from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .models import Users
from .database import get_db
from .authUtils import validate_password
import bcrypt

router = APIRouter()

@router.post("/forgot-password")
def forgot_password(email: str, new_password: str, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    validate_password(new_password)
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.encrypted_password = hashed_password
    db.commit()
    return {"message": "Password reset successful"}
