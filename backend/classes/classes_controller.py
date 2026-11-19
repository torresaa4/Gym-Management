from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.classes.classes_schemas import AddClass
from backend.classes.classes_crud import create_class, all_classes, delete_class



def add_class(new_class: AddClass, db: Session):

    if not new_class.class_name or not new_class.class_day or not new_class.start_time or not new_class.end_time:
        raise HTTPException(status_code=400, detail="class information cant be empty")
    return create_class(new_class, db)


def get_classes(db: Session):
    return all_classes(db)


def class_delete(class_id: int, db: Session):
    return delete_class(class_id, db)