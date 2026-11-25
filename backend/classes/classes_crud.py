from sqlalchemy.orm import Session
from backend.classes.classes_schemas import AddClass
from backend.classes.classes_model import ClassModel
from backend.instructor.instructor_model import InstructorModel
from backend. enrollment.enrollment_model import Enrollment
from fastapi import HTTPException
from sqlalchemy import func


def create_class(new_class: AddClass, db: Session):

    isnstructor = db.query(InstructorModel).filter(
        InstructorModel.id == new_class.instructor_id
    ).first()

    if isnstructor is None:
        raise HTTPException(status_code=404, detail="Instructor not found")

    new_class = ClassModel(
        class_name = new_class.class_name,
        instructor_id =  new_class.instructor_id,
        class_day = new_class.class_day,
        start_time = new_class.start_time,
        end_time = new_class.end_time
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return{
        "id": new_class.id,
        "class_name": new_class.class_name,
        "class_day": new_class.class_day,
        "start_time": new_class.start_time,
        "end_time": new_class.end_time,
        "instructor_name": isnstructor.name,
        "instructor_last_name": isnstructor.last_name
    }




def all_classes(db: Session):

    classes = db.query(
        ClassModel.id,
        ClassModel.class_name,
        ClassModel.class_day,
        ClassModel.start_time,
        ClassModel.end_time,
        InstructorModel.name,
        InstructorModel.last_name,
        func.count(Enrollment.id).label("enrollment_count")
    ).join(
        InstructorModel,
        ClassModel.instructor_id == InstructorModel.id
    ).outerjoin(
        Enrollment,
        ClassModel.id == Enrollment.class_id
    ).group_by(
        ClassModel.id,
        ClassModel.class_name,
        ClassModel.class_day,
        ClassModel.start_time,
        ClassModel.end_time,
        InstructorModel.name,
        InstructorModel.last_name
    ).all()

    return [
        {
            "id": c.id,
            "class_name": c.class_name,
            "class_day": c.class_day,
            "start_time": c.start_time.isoformat(),
            "end_time": c.end_time.isoformat(),
            "name": c.name,
            "last_name": c.last_name,
            "enrollment_count": c.enrollment_count
        }
        for c in classes
    ]



def delete_class(class_id: int, db: Session):
    
    current_class = db.query(ClassModel).filter(
        ClassModel.id == class_id
    ).first()

    if current_class is None:
        raise HTTPException(status_code=404, detail="Class is not found")

    # delete enrollments from class
    db.query(Enrollment).filter(
        Enrollment.class_id == class_id
    ).delete()

    db.delete(current_class)
    db.commit()