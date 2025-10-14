from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .database import Base

class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    encrypted_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)

class Classroom(Base):
    __tablename__ = "classrooms"
    classroom_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.teacher_id"), nullable=False)
    classroom_name = Column(String(100), nullable=False)
    created_at = Column(DateTime)

class Student(Base):
    __tablename__ = "students"
    rollno = Column(String(10), primary_key=True)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.classroom_id"), nullable=False)
    student_name = Column(String(100), nullable=False)
    dob = Column(DateTime, nullable=False)
    grade = Column(Integer, nullable=False)
