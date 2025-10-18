from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# ============= Enums =============
class ActivityTypeEnum(str, Enum):
    """Enum for activity types"""
    WORKSHEET = "Worksheet"
    CONTENT = "Content"


# ============= Authentication Schemas =============
class TeacherSignUp(BaseModel):
    teacher_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


# ============= Teacher Schemas =============
class TeacherResponse(BaseModel):
    teacher_id: UUID
    teacher_name: str
    email: str
    
    class Config:
        from_attributes = True


# ============= Classroom Schemas =============
class ClassroomCreate(BaseModel):
    classroom_name: str = Field(..., min_length=1, max_length=100)


class ClassroomUpdate(BaseModel):
    classroom_name: str = Field(..., min_length=1, max_length=100)


class ClassroomResponse(BaseModel):
    classroom_id: UUID
    teacher_id: UUID
    classroom_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Student Schemas =============
class StudentCreate(BaseModel):
    rollno: str = Field(..., min_length=1, max_length=10)
    student_name: str = Field(..., min_length=1, max_length=100)
    dob: date
    grade: int = Field(..., ge=1, le=12)


class StudentUpdate(BaseModel):
    student_name: Optional[str] = Field(None, min_length=1, max_length=100)
    dob: Optional[date] = None
    grade: Optional[int] = Field(None, ge=1, le=12)


class StudentResponse(BaseModel):
    rollno: str
    classroom_id: UUID
    student_name: str
    dob: date
    grade: int
    
    class Config:
        from_attributes = True


# ============= Subject Schemas =============
class SubjectCreate(BaseModel):
    subject_name: str = Field(..., min_length=1, max_length=100)


class SubjectUpdate(BaseModel):
    subject_name: str = Field(..., min_length=1, max_length=100)


class SubjectResponse(BaseModel):
    subject_id: UUID
    classroom_id: UUID
    subject_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Activity Schemas =============
class FileCreate(BaseModel):
    minio_path: str = Field(..., min_length=1)


class FileResponse(BaseModel):
    file_id: UUID
    minio_path: str
    activity_id: UUID
    
    class Config:
        from_attributes = True


class ActivityCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: ActivityTypeEnum
    files: Optional[List[FileCreate]] = []


class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)


class ActivityResponse(BaseModel):
    activity_id: UUID
    subject_id: UUID
    title: str
    type: ActivityTypeEnum
    created_at: datetime
    files: List[FileResponse] = []
    
    class Config:
        from_attributes = True


# ============= Performance Schemas =============
class PerformanceCreate(BaseModel):
    student_rollno: str = Field(..., min_length=1, max_length=10)
    activity_id: UUID
    teacher_feedback: Optional[str] = None
    teacher_mark: int = Field(..., ge=0, le=100)


class PerformanceUpdate(BaseModel):
    teacher_feedback: Optional[str] = None
    teacher_mark: Optional[int] = Field(None, ge=0, le=100)


class PerformanceResponse(BaseModel):
    student_rollno: str
    activity_id: UUID
    teacher_feedback: Optional[str]
    teacher_mark: int
    
    class Config:
        from_attributes = True
