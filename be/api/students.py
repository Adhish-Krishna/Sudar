from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .database import get_db
from .models import Student, Classroom, Teacher
from .schemas import StudentCreate, StudentUpdate, StudentResponse
from .authUtils import get_current_teacher

router = APIRouter(prefix="/classrooms/{classroom_id}/students", tags=["Students"])


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


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    classroom_id: UUID,
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Add a new student to a classroom.
    Only the teacher who owns the classroom can add students.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    # Check if student with same rollno already exists
    existing_student = db.query(Student).filter(Student.rollno == data.rollno).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this roll number already exists"
        )
    
    # Create new student
    student = Student(
        rollno=data.rollno,
        classroom_id=classroom_id,
        student_name=data.student_name,
        dob=data.dob,
        grade=data.grade
    )
    
    try:
        db.add(student)
        db.commit()
        db.refresh(student)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student"
        )
    
    return student


@router.get("", response_model=List[StudentResponse])
def get_students(
    classroom_id: UUID,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get all students in a classroom.
    Only the teacher who owns the classroom can view students.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    students = db.query(Student).filter(
        Student.classroom_id == classroom_id
    ).all()
    
    return students


@router.get("/{rollno}", response_model=StudentResponse)
def get_student(
    classroom_id: UUID,
    rollno: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific student by roll number.
    Only the teacher who owns the classroom can view the student.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    student = db.query(Student).filter(
        Student.rollno == rollno,
        Student.classroom_id == classroom_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return student


@router.put("/{rollno}", response_model=StudentResponse)
def update_student(
    classroom_id: UUID,
    rollno: str,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update a student's information.
    Only the teacher who owns the classroom can update students.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    student = db.query(Student).filter(
        Student.rollno == rollno,
        Student.classroom_id == classroom_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update only provided fields
    if data.student_name is not None:
        student.student_name = data.student_name
    if data.dob is not None:
        student.dob = data.dob
    if data.grade is not None:
        student.grade = data.grade
    
    try:
        db.commit()
        db.refresh(student)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update student"
        )
    
    return student


@router.delete("/{rollno}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    classroom_id: UUID,
    rollno: str,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a student from a classroom.
    Only the teacher who owns the classroom can delete students.
    This will cascade delete all performance records for this student.
    """
    # Verify classroom ownership
    verify_classroom_ownership(classroom_id, current_teacher, db)
    
    student = db.query(Student).filter(
        Student.rollno == rollno,
        Student.classroom_id == classroom_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    try:
        db.delete(student)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete student"
        )
    
    return None
