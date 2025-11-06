from .main import app
from .database import get_db, Base
from .models import (
    Teacher, 
    EmailVerificationCode, 
    Classroom, 
    Student, 
    Subject, 
    Activity,
    ActivityFile,
    Chat,
    ChatFile,
    Performance,
    ActivityType,
    ChatType
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
    ActivityCreate,
    PerformanceCreate,
    ActivityTypeEnum,
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
    "Activity",
    "ActivityFile",
    "Chat",
    "ChatFile",
    "Performance",
    "ActivityType",
    "ChatType",
    "TeacherSignUp",
    "TeacherLogin",
    "TokenResponse",
    "ClassroomCreate",
    "StudentCreate",
    "SubjectCreate",
    "ActivityCreate",
    "ActivityUpdate",
    "ActivityFileCreate",
    "ChatCreate",
    "ChatFileCreate",
    "PerformanceCreate",
    "ActivityTypeEnum",
    "ChatTypeEnum",
    "check_user_password",
    "validate_password",
    "create_access_token",
    "create_refresh_token",
    "get_current_teacher",
]

