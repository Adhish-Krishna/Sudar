"""
Database models for RAG Service.

This module defines SQLAlchemy models needed for authorization checks.
Only includes models required for verifying permissions.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base


class Teacher(Base):
    """Teacher model for verifying teacher identity and permissions."""
    __tablename__ = "teachers"
    
    teacher_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    
    # Relationships
    classrooms = relationship("Classroom", back_populates="teacher")


class Classroom(Base):
    """Classroom model for verifying teacher-classroom relationships."""
    __tablename__ = "classrooms"
    
    classroom_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.teacher_id", ondelete="CASCADE"), nullable=False)
    classroom_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="classrooms")
