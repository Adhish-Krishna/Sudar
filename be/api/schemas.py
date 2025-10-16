from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime, date
from uuid import UUID


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


# ============= Worksheet Schemas =============
class WorksheetCreate(BaseModel):
    chat_id: UUID
    saved_worksheet: Optional[Any] = None


class WorksheetUpdate(BaseModel):
    saved_worksheet: Optional[Any] = None


class WorksheetResponse(BaseModel):
    worksheet_id: UUID
    subject_id: UUID
    chat_id: UUID
    saved_worksheet: Optional[Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Content Schemas =============
class ContentCreate(BaseModel):
    chat_id: UUID
    title: str = Field(..., min_length=1, max_length=255)
    saved_content: Optional[Any] = None


class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    saved_content: Optional[Any] = None


class ContentResponse(BaseModel):
    content_id: UUID
    subject_id: UUID
    chat_id: UUID
    title: str
    saved_content: Optional[Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============= Performance Schemas =============
class PerformanceCreate(BaseModel):
    student_rollno: str = Field(..., min_length=1, max_length=10)
    worksheet_id: UUID
    teacher_feedback: Optional[str] = None
    teacher_mark: int = Field(..., ge=0, le=100)


class PerformanceUpdate(BaseModel):
    teacher_feedback: Optional[str] = None
    teacher_mark: Optional[int] = Field(None, ge=0, le=100)


class PerformanceResponse(BaseModel):
    student_rollno: str
    worksheet_id: UUID
    teacher_feedback: Optional[str]
    teacher_mark: int
    
    class Config:
        from_attributes = True
