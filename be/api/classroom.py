from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import Classroom, Teacher
from .schemas import ClassroomCreate, ClassroomUpdate, ClassroomResponse
from .authUtils import get_current_teacher

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(
    data: ClassroomCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new classroom for the authenticated teacher.
    """
    classroom = Classroom(
        teacher_id=current_teacher.teacher_id,
        classroom_name=data.classroom_name
    )
    
    try:
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create classroom"
        )
    
    return classroom


@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all classrooms for the authenticated teacher.
    """
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_teacher.teacher_id
    ).all()
    
    return classrooms


@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom(
    classroom_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific classroom by ID.
    Only the teacher who owns the classroom can access it.
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


@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(
    classroom_id: UUID,
    data: ClassroomUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update a classroom's information.
    Only the teacher who owns the classroom can update it.
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
    
    # Update classroom name
    classroom.classroom_name = data.classroom_name
    
    try:
        db.commit()
        db.refresh(classroom)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update classroom"
        )
    
    return classroom


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(
    classroom_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a classroom.
    Only the teacher who owns the classroom can delete it.
    This will cascade delete all students, subjects, and related data.
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
    
    try:
        db.delete(classroom)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete classroom"
        )
    
    return None
