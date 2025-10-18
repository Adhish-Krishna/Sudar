from .main import app
from .database import get_db, Base
from .models import (
    Teacher, 
    EmailVerificationCode, 
    Classroom, 
    Student, 
    Subject, 
    Activity,
    File,
    Performance,
    ActivityType
)
from .schemas import (
    TeacherSignUp,
    TeacherLogin,
    TokenResponse,
    ClassroomCreate,
    StudentCreate,
    SubjectCreate,
    ActivityCreate,
    ActivityUpdate,
    FileCreate,
    PerformanceCreate,
    ActivityTypeEnum
)
from .authUtils import (
    check_user_password, 
    validate_password, 
    create_access_token, 
    create_refresh_token,
    get_current_teacher
)

__all__ = [
    "app",
    "get_db",
    "Base",
    "Teacher",
    "EmailVerificationCode",
    "Classroom",
    "Student",
    "Subject",
    "Worksheet",
    "Content",
    "Performance",
    "TeacherSignUp",
    "TeacherLogin",
    "TokenResponse",
    "ClassroomCreate",
    "StudentCreate",
    "SubjectCreate",
    "PerformanceCreate",
    "check_user_password",
    "validate_password",
    "create_access_token",
    "create_refresh_token",
    "get_current_teacher",
]

