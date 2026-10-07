from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.classes.classes_schemas import AddClass
from backend.classes.classes_crud import create_class, all_classes



def add_class(new_class: AddClass, db: Session):

    if not new_class.class_name or not new_class.class_date:
        raise HTTPException(status_code=400, detail="class name and class date cant be empty")
    return create_class(new_class, db)


def get_classes(db: Session):
    return all_classes(db)