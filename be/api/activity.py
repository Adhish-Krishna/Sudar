from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import Activity, ActivityFile, Subject, Classroom, Teacher
from .schemas import ActivityCreate, ActivityUpdate, ActivityResponse
from .authUtils import get_current_teacher

router = APIRouter(prefix="/activities", tags=["Activities"])


def verify_subject_ownership(
    subject_id: UUID,
    current_teacher: Teacher,
    db: Session
) -> Subject:
    """
    Verify that the subject exists and belongs to a classroom owned by the current teacher.
    """
    subject = db.query(Subject).join(
        Classroom, Subject.classroom_id == Classroom.classroom_id
    ).filter(
        Subject.subject_id == subject_id,
        Classroom.teacher_id == current_teacher.teacher_id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or unauthorized"
        )
    
    return subject


@router.post("/subject/{subject_id}", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    subject_id: UUID,
    data: ActivityCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new activity (worksheet or content) with associated files.
    Only the teacher who owns the classroom can create activities.
    """
    # Verify subject ownership
    verify_subject_ownership(subject_id, current_teacher, db)
    
    # Create new activity
    activity = Activity(
        subject_id=subject_id,
        title=data.title,
        type=data.type
    )
    
    try:
        db.add(activity)
        db.flush()  # Flush to get the activity_id
        
        # Add files if provided
        if data.files:
            for file_data in data.files:
                file = ActivityFile(
                    minio_path=file_data.minio_path,
                    activity_id=activity.activity_id
                )
                db.add(file)
        
        db.commit()
        db.refresh(activity)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create activity: {str(e)}"
        )
    
    return activity


@router.get("/subject/{subject_id}", response_model=List[ActivityResponse])
def get_activities_by_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all activities for a specific subject.
    Only the teacher who owns the classroom can view activities.
    """
    # Verify subject ownership
    verify_subject_ownership(subject_id, current_teacher, db)
    
    activities = db.query(Activity).filter(
        Activity.subject_id == subject_id
    ).all()
    
    return activities


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific activity by ID.
    Only the teacher who owns the classroom can view the activity.
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


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: UUID,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update an activity's title.
    Only the teacher who owns the classroom can update the activity.
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
    
    # Update fields
    if data.title is not None:
        activity.title = data.title
    
    try:
        db.commit()
        db.refresh(activity)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update activity"
        )
    
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete an activity and its associated files.
    Only the teacher who owns the classroom can delete the activity.
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
    
    try:
        db.delete(activity)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete activity"
        )
    
    return None
