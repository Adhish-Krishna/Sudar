from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import Subject, Classroom, Teacher
from .schemas import SubjectCreate, SubjectUpdate, SubjectResponse
from .authUtils import get_current_teacher

router = APIRouter(prefix="/classrooms/{classroom_id}/subjects", tags=["Subjects"])


def verify_classroom_ownership(
    classroom_id: UUID,
    current_teacher: Teacher,
    db: Session
) -> Classroom:
    """
    Verify that the classroom exists and belongs to the current teacher.
    """
    classroom = db.query(Classroom).filter(
        Classroom.classroom_id == classroom_id,
        Classroom.teacher_id == current_teacher.teacher_id
    ).first()
    
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )
    
    return classroom


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    classroom_id: UUID,
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new subject in a classroom.
    Only the teacher who owns the classroom can create subjects.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    # Create new subject
    subject = Subject(
        classroom_id=classroom_id,
        subject_name=data.subject_name
    )
    
    try:
        db.add(subject)
        db.commit()
        db.refresh(subject)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subject"
        )
    
    return subject


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    classroom_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all subjects in a classroom.
    Only the teacher who owns the classroom can view subjects.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    subjects = db.query(Subject).filter(
        Subject.classroom_id == classroom_id
    ).all()
    
    return subjects


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    classroom_id: UUID,
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific subject by ID.
    Only the teacher who owns the classroom can view the subject.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    subject = db.query(Subject).filter(
        Subject.subject_id == subject_id,
        Subject.classroom_id == classroom_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    classroom_id: UUID,
    subject_id: UUID,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update a subject's information.
    Only the teacher who owns the classroom can update subjects.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    subject = db.query(Subject).filter(
        Subject.subject_id == subject_id,
        Subject.classroom_id == classroom_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Update subject name
    subject.subject_name = data.subject_name
    
    try:
        db.commit()
        db.refresh(subject)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update subject"
        )
    
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    classroom_id: UUID,
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a subject from a classroom.
    Only the teacher who owns the classroom can delete subjects.
    This will cascade delete all worksheets, content, and related data.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    subject = db.query(Subject).filter(
        Subject.subject_id == subject_id,
        Subject.classroom_id == classroom_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    try:
        db.delete(subject)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete subject"
        )
    
    return None
