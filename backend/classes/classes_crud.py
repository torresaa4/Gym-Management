from sqlalchemy.orm import Session
from backend.classes.classes_schemas import AddClass
from backend.classes.classes_model import ClassModel
from backend.instructor.instructor_model import InstructorModel


def create_class(new_class: AddClass, db: Session):
    new_class = ClassModel(
        class_name = new_class.class_name,
        instructor_id =  new_class.instructor_id,
        class_date = new_class.class_date
    )

    db.add(new_class)
    db.commit()
    db.refresh()


def all_classes(db: Session):

    # SELECT CNAME, CDATE, NAME, LASTNAME 
    # FROM CLASS
    # JOIN INSTRUCTOR
    # ON ClassModel.instructor_id == InstructorModel.id
    
    classes = db.query(
        ClassModel.class_name,
        ClassModel.class_date,
        InstructorModel.name,
        InstructorModel.last_name
        ).join(
            InstructorModel,
            ClassModel.instructor_id == InstructorModel.id
        ).all()



    return classes