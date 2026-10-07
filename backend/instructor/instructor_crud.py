from sqlalchemy.orm import Session
from backend.instructor.instructor_model import InstructorModel
from backend.instructor.instructor_schema import InstructorCreate, InstructorUpdate
from fastapi import HTTPException


def add_instructor(new_user: InstructorCreate, db: Session):

    instructor = InstructorModel(
        name = new_user.name,
        last_name = new_user.last_name
    
    )
    db.add(instructor)
    db.commit()
    db.refresh(instructor)

    return instructor



def get_instructors(db: Session):
    return db.query(InstructorModel).all()


def updated_instructor(instructor_id: int, new_instructor: InstructorUpdate, db: Session):

    old_instructor = db.query(InstructorModel).filter(InstructorModel.id == instructor_id).first()

    if old_instructor is None:
        raise HTTPException(status_code=404, detail="Instructor is not found")
    
    # if name needs an update
    if new_instructor.name is not None:
        old_instructor.name = new_instructor.name

    # if last name needs an update
    if new_instructor.last_name is not None:
        old_instructor.last_name = new_instructor.last_name

    
    db.commit()
    db.refresh(new_instructor)
    return new_instructor


def delete_instructors(instructor_id: int, db: Session):

    instructor = db.query(InstructorModel).filter(InstructorModel.id == instructor_id).first()


    if instructor is None:
        raise HTTPException(
            status_code=404,
            detail="Instructor not found")

    db.delete(instructor)
    db.commit()
    

    return instructor

