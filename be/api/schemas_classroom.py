from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class CreateClassroomRequest(BaseModel):
    teacher_id: UUID
    classroom_name: str

class EnrollStudentRequest(BaseModel):
    rollno: str
    classroom_id: UUID
    student_name: str
    dob: datetime
    grade: int
