from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from .models import Users
from .database import get_db
from .schemas import SignUpUser
from .authUtils import check_user_password, validate_password, create_access_token, create_refresh_token
import bcrypt

router = APIRouter()

@router.post("/signup")
def signUp(data: SignUpUser, db: Session = Depends(get_db)):
    userid: str = data.userid
    password: str = data.password
    email: str = data.email

    existing_user = db.query(Users).filter(Users.user_id == userid).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    validate_password(password)
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    hashed_password_str = hashed_password.decode('utf-8')
    new_user = Users(
        user_id=userid,
        encrypted_password=hashed_password_str,
        email=email
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    access_token = create_access_token(data={"sub": userid})
    refresh_token = create_refresh_token(data={"sub":userid})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login")
def loginUser(data: SignUpUser, db: Session = Depends(get_db)):
    userid: str = data.userid
    password: str = data.password
    user = db.query(Users).filter(Users.user_id == userid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not check_user_password(password, user.encrypted_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.user_id})
    refresh_token = create_refresh_token(data={"sub":userid})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
