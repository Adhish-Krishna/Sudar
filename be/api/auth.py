from fastapi import Depends, HTTPException, status, APIRouter, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .models import Teacher, EmailVerificationCode
from .database import get_db
from .schemas import (
    SendVerificationCodeRequest,
    VerifyEmailRequest,
    TeacherSignUp, 
    TeacherLogin, 
    TokenResponse, 
    ForgotPasswordRequest, 
    ResetPasswordRequest,
    TeacherResponse
)
from .authUtils import (
    check_user_password, 
    validate_password, 
    create_access_token, 
    create_refresh_token,
    hash_password,
    generate_verification_code,
    send_email,
    get_current_teacher,
    set_auth_cookies,
    clear_auth_cookies
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-verification-code", status_code=status.HTTP_200_OK)
def send_verification_code(data: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """
    Send a 6-digit verification code to the email for signup.
    This must be called before signup to verify the email address.
    """
    # Check if email already exists
    existing_teacher = db.query(Teacher).filter(Teacher.email == data.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate 6-digit verification code
    verification_code = generate_verification_code()
    
    # Set expiry time (10 minutes from now)
    expiry_time = datetime.utcnow() + timedelta(minutes=10)
    
    # Check if there's an existing verification code for this email
    existing_code = db.query(EmailVerificationCode).filter(
        EmailVerificationCode.email == data.email
    ).first()
    
    if existing_code:
        # Update existing code
        existing_code.code = verification_code
        existing_code.expiry_time = expiry_time
    else:
        # Create new verification code entry
        new_code = EmailVerificationCode(
            email=data.email,
            code=verification_code,
            expiry_time=expiry_time
        )
        db.add(new_code)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate verification code"
        )
    
    # Send email with verification code
    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Hello {data.teacher_name},</p>
            <p>Thank you for signing up with Sudar AI!</p>
            <p>Your email verification code is:</p>
            <h1 style="background-color: #f0f0f0; padding: 15px; text-align: center; letter-spacing: 5px; color: #4CAF50;">{verification_code}</h1>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>Please enter this code to complete your registration.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">This is an automated message from Sudar AI. Please do not reply to this email.</p>
        </body>
    </html>
    """
    
    send_email(
        to_email=data.email,
        subject="Email Verification Code - Sudar AI",
        body=email_body,
        html=True
    )
    
    return {
        "message": "Verification code sent to your email",
        "email": data.email
    }


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: TeacherSignUp, response: Response, db: Session = Depends(get_db)):
    """
    Register a new teacher account.
    Requires email verification code sent via /send-verification-code endpoint.
    Sets authentication tokens as HTTP-only cookies.
    """
    # Verify the email verification code first
    verification_record = db.query(EmailVerificationCode).filter(
        EmailVerificationCode.email == data.email
    ).first()
    
    if not verification_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found. Please request a verification code first."
        )
    
    # Check if code matches
    if verification_record.code != data.verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Check if code has expired
    if verification_record.expiry_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
    
    # Check if email already exists (double-check for race conditions)
    existing_teacher = db.query(Teacher).filter(Teacher.email == data.email).first()
    if existing_teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    validate_password(data.password)
    
    # Hash the password
    hashed_pwd = hash_password(data.password)
    
    # Create new teacher
    new_teacher = Teacher(
        teacher_name=data.teacher_name,
        email=data.email,
        hashed_password=hashed_pwd
    )
    
    try:
        db.add(new_teacher)
        # Delete the used verification code
        db.delete(verification_record)
        db.commit()
        db.refresh(new_teacher)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create teacher account"
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_teacher.teacher_id)})
    refresh_token = create_refresh_token(data={"sub": str(new_teacher.teacher_id)})
    
    # Set tokens in HTTP-only cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    return TokenResponse(
        message="Account created successfully",
        teacher_id=new_teacher.teacher_id,
        teacher_name=new_teacher.teacher_name,
        email=new_teacher.email
    )


@router.post("/login", response_model=TokenResponse)
def login(data: TeacherLogin, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Sets authentication tokens as HTTP-only cookies.
    """
    # Find teacher by email
    teacher = db.query(Teacher).filter(Teacher.email == data.email).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not check_user_password(data.password, teacher.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(teacher.teacher_id)})
    refresh_token = create_refresh_token(data={"sub": str(teacher.teacher_id)})
    
    # Set tokens in HTTP-only cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    return TokenResponse(
        message="Login successful",
        teacher_id=teacher.teacher_id,
        teacher_name=teacher.teacher_name,
        email=teacher.email
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset code sent to email.
    """
    # Check if teacher exists
    teacher = db.query(Teacher).filter(Teacher.email == data.email).first()
    if not teacher:
        # Don't reveal that the email doesn't exist for security
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate 6-digit code
    reset_code = generate_verification_code()
    
    # Set expiry time (15 minutes from now)
    expiry_time = datetime.utcnow() + timedelta(minutes=15)
    
    # Update teacher with reset code
    teacher.reset_password_code = reset_code
    teacher.code_expiry_time = expiry_time
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate reset code"
        )
    
    # Send email with reset code
    email_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You have requested to reset your password for your Sudar AI account.</p>
            <p>Your password reset code is:</p>
            <h1 style="background-color: #f0f0f0; padding: 15px; text-align: center; letter-spacing: 5px; color: #4CAF50;">{reset_code}</h1>
            <p><strong>This code will expire in 15 minutes.</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">This is an automated message from Sudar AI. Please do not reply to this email.</p>
        </body>
    </html>
    """
    
    send_email(
        to_email=data.email,
        subject="Password Reset Code - Sudar AI",
        body=email_body,
        html=True
    )
    
    return {"message": "If the email exists, a reset code has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using the verification code.
    """
    # Find teacher by email
    teacher = db.query(Teacher).filter(Teacher.email == data.email).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or code"
        )
    
    # Check if code exists and matches
    if not teacher.reset_password_code or teacher.reset_password_code != data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or code"
        )
    
    # Check if code has expired
    if not teacher.code_expiry_time or teacher.code_expiry_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired"
        )
    
    # Validate new password
    validate_password(data.new_password)
    
    # Hash new password
    hashed_pwd = hash_password(data.new_password)
    
    # Update password and clear reset code
    teacher.hashed_password = hashed_pwd
    teacher.reset_password_code = None
    teacher.code_expiry_time = None
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
    
    return {"message": "Password reset successful"}


@router.get("/me", response_model=TeacherResponse)
def get_current_user(current_teacher: Teacher = Depends(get_current_teacher)):
    """
    Get the current authenticated teacher's information.
    """
    return current_teacher

@router.post("/logout")
def logout_teacher(
    response: Response,
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Logout the current authenticated teacher.
    Clears authentication cookies.
    """
    # Clear authentication cookies
    clear_auth_cookies(response)
    
    return {"message": "Logout successful"}