from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import Performance, Activity, Student, Subject, Classroom, Teacher
from .schemas import PerformanceCreate, PerformanceUpdate, PerformanceResponse
from .authUtils import get_current_teacher

router = APIRouter(prefix="/performance", tags=["Performance"])


def verify_activity_ownership(
    activity_id: UUID,
    current_teacher: Teacher,
    db: Session
) -> Activity:
    """
    Verify that the activity exists and belongs to a classroom owned by the current teacher.
    """
    activity = db.query(Activity).join(
        Subject, Activity.subject_id == Subject.subject_id
    ).join(
        Classroom, Subject.classroom_id == Classroom.classroom_id
    ).filter(
        Activity.activity_id == activity_id,
        Classroom.teacher_id == current_teacher.teacher_id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found or unauthorized"
        )
    
    return activity


@router.post("", response_model=PerformanceResponse, status_code=status.HTTP_201_CREATED)
def create_performance(
    data: PerformanceCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new performance record (feedback) for a student on an activity.
    Only the teacher who owns the classroom can create performance records.
    """
    # Verify activity ownership
    activity = verify_activity_ownership(data.activity_id, current_teacher, db)
    
    # Verify student exists and belongs to the same classroom as the activity's subject
    student = db.query(Student).join(
        Classroom, Student.classroom_id == Classroom.classroom_id
    ).join(
        Subject, Classroom.classroom_id == Subject.classroom_id
    ).filter(
        Student.rollno == data.student_rollno,
        Subject.subject_id == activity.subject_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found in the classroom"
        )
    
    # Check if performance record already exists
    existing_performance = db.query(Performance).filter(
        Performance.student_rollno == data.student_rollno,
        Performance.activity_id == data.activity_id
    ).first()
    
    if existing_performance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Performance record already exists for this student and activity"
        )
    
    # Create new performance record
    performance = Performance(
        student_rollno=data.student_rollno,
        activity_id=data.activity_id,
        teacher_feedback=data.teacher_feedback,
        teacher_mark=data.teacher_mark
    )
    
    try:
        db.add(performance)
        db.commit()
        db.refresh(performance)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create performance record"
        )
    
    return performance


@router.get("/activity/{activity_id}", response_model=List[PerformanceResponse])
def get_performances_by_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all performance records for a specific activity.
    Only the teacher who owns the classroom can view performance records.
    """
    # Verify activity ownership
    verify_activity_ownership(activity_id, current_teacher, db)
    
    performances = db.query(Performance).filter(
        Performance.activity_id == activity_id
    ).all()
    
    return performances


@router.get("/student/{student_rollno}", response_model=List[PerformanceResponse])
def get_performances_by_student(
    student_rollno: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all performance records for a specific student.
    Only the teacher who owns the classroom can view performance records.
    """
    # Verify student belongs to a classroom owned by the current teacher
    student = db.query(Student).join(
        Classroom, Student.classroom_id == Classroom.classroom_id
    ).filter(
        Student.rollno == student_rollno,
        Classroom.teacher_id == current_teacher.teacher_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found or unauthorized"
        )
    
    performances = db.query(Performance).filter(
        Performance.student_rollno == student_rollno
    ).all()
    
    return performances


@router.get("/{student_rollno}/{activity_id}", response_model=PerformanceResponse)
def get_performance(
    student_rollno: str,
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific performance record by student and activity.
    Only the teacher who owns the classroom can view the performance record.
    """
    # Verify activity ownership
    verify_activity_ownership(activity_id, current_teacher, db)
    
    performance = db.query(Performance).filter(
        Performance.student_rollno == student_rollno,
        Performance.activity_id == activity_id
    ).first()
    
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performance record not found"
        )
    
    return performance


@router.put("/{student_rollno}/{activity_id}", response_model=PerformanceResponse)
def update_performance(
    student_rollno: str,
    activity_id: UUID,
    data: PerformanceUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update a performance record (feedback).
    Only the teacher who owns the classroom can update performance records.
    """
    # Verify activity ownership
    verify_activity_ownership(activity_id, current_teacher, db)
    
    performance = db.query(Performance).filter(
        Performance.student_rollno == student_rollno,
        Performance.activity_id == activity_id
    ).first()
    
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performance record not found"
        )
    
    # Update only provided fields
    if data.teacher_feedback is not None:
        performance.teacher_feedback = data.teacher_feedback
    if data.teacher_mark is not None:
        performance.teacher_mark = data.teacher_mark
    
    try:
        db.commit()
        db.refresh(performance)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update performance record"
        )
    
    return performance


@router.delete("/{student_rollno}/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_performance(
    student_rollno: str,
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a performance record.
    Only the teacher who owns the classroom can delete performance records.
    """
    # Verify activity ownership
    verify_activity_ownership(activity_id, current_teacher, db)
    
    performance = db.query(Performance).filter(
        Performance.student_rollno == student_rollno,
        Performance.activity_id == activity_id
    ).first()
    
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performance record not found"
        )
    
    try:
        db.delete(performance)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete performance record"
        )
    
    return None
