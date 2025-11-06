from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import ChatFile, Chat, Subject, Classroom, Teacher
from .authUtils import get_current_teacher
from pydantic import BaseModel

router = APIRouter(prefix="/context", tags=["Context"])


class IndexedFileResponse(BaseModel):
    """Response model for indexed files"""
    file_id: str
    filename: str
    minio_path: str
    
    class Config:
        from_attributes = True


@router.get("/{chat_id}", response_model=List[IndexedFileResponse], status_code=status.HTTP_200_OK)
def get_indexed_files_by_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all indexed files for a specific chat.
    Returns filenames extracted from minio_path where indexed = true.
    Only the teacher who owns the classroom can access these files.
    """
    try:
        # Verify that the chat belongs to a subject in a classroom owned by the current teacher
        chat = db.query(Chat).join(
            Subject, Chat.subject_id == Subject.subject_id
        ).join(
            Classroom, Subject.classroom_id == Classroom.classroom_id
        ).filter(
            Chat.chat_id == chat_id,
            Classroom.teacher_id == current_teacher.teacher_id
        ).first()
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found or unauthorized"
            )
        
        # Query all indexed files for this chat
        indexed_files = db.query(ChatFile).filter(
            ChatFile.chat_id == chat_id,
            ChatFile.indexed == True
        ).all()
        
        # Extract filename from minio_path and format response
        result = []
        for chat_file in indexed_files:
            filename = chat_file.minio_path.split('/').pop() if chat_file.minio_path else "unknown"
            if filename != "unknown":
                result.append({
                    "file_id": str(chat_file.file_id),
                    "filename": filename,
                    "minio_path": chat_file.minio_path
                })
        
        return result
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except ValueError as e:
        # Handle invalid UUID or value errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    
    except Exception as e:
        # Handle any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching indexed files: {str(e)}"
        )
