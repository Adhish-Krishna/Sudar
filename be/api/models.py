from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, CHAR, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base
import enum


class ActivityType(enum.Enum):
    """Enum for activity types"""
    Worksheet = "Worksheet"
    Content = "Content"


class Teacher(Base):
    __tablename__ = "teachers"
    
    teacher_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    reset_password_code = Column("resetpasswordcode", CHAR(6), nullable=True)
    code_expiry_time = Column("codeexpirytime", DateTime, nullable=True)
    hashed_password = Column(Text, nullable=False)
    
    # Relationships
    classrooms = relationship("Classroom", back_populates="teacher", cascade="all, delete-orphan")


class EmailVerificationCode(Base):
    __tablename__ = "emailverificationcode"
    
    email = Column(String(100), primary_key=True)
    code = Column(CHAR(6), nullable=False)
    expiry_time = Column("expirytime", DateTime, nullable=False)


class Classroom(Base):
    __tablename__ = "classrooms"
    
    classroom_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.teacher_id", ondelete="CASCADE"), nullable=False)
    classroom_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="classrooms")
    students = relationship("Student", back_populates="classroom", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="classroom", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"
    
    rollno = Column(String(10), primary_key=True)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.classroom_id", ondelete="CASCADE"), nullable=False)
    student_name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=False)
    grade = Column(Integer, nullable=False)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="students")
    performances = relationship("Performance", back_populates="student", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"
    
    subject_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.classroom_id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="subjects")
    activities = relationship("Activity", back_populates="subject", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activity"
    
    activity_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.subject_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    type = Column(SQLEnum(ActivityType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subject = relationship("Subject", back_populates="activities")
    files = relationship("File", back_populates="activity", cascade="all, delete-orphan")
    performances = relationship("Performance", back_populates="activity", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"
    
    file_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    minio_path = Column(Text, nullable=False)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activity.activity_id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    activity = relationship("Activity", back_populates="files")


class Performance(Base):
    __tablename__ = "performance"
    
    student_rollno = Column(String(10), ForeignKey("students.rollno", ondelete="CASCADE"), primary_key=True)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activity.activity_id", ondelete="CASCADE"), primary_key=True)
    teacher_feedback = Column(Text, nullable=True)
    teacher_mark = Column(Integer, nullable=False)
    
    # Relationships
    student = relationship("Student", back_populates="performances")
    activity = relationship("Activity", back_populates="performances")
