from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import Classroom, Student
from .schemas_classroom import CreateClassroomRequest, EnrollStudentRequest

router = APIRouter()

@router.post("/classroom/create")
def create_classroom(data: CreateClassroomRequest, db: Session = Depends(get_db)):
    classroom = Classroom(
        teacher_id=data.teacher_id,
        classroom_name=data.classroom_name
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return {"classroom_id": classroom.classroom_id, "classroom_name": classroom.classroom_name}

@router.post("/classroom/enroll")
def enroll_student(data: EnrollStudentRequest, db: Session = Depends(get_db)):
    
    classroom = db.query(Classroom).filter(Classroom.classroom_id == data.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    student = Student(
        rollno=data.rollno,
        classroom_id=data.classroom_id,
        student_name=data.student_name,
        dob=data.dob,
        grade=data.grade
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return {"message": "Student enrolled successfully", "rollno": student.rollno}
