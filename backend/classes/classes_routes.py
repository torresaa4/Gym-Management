from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.user.user_models import UserModel
from backend.user.user_security import require_admin
from backend.classes.classes_schemas import AddClass, ClassResponse
from backend.classes.classes_controller import add_class, get_classes






class_router = APIRouter(prefix="/class")



@class_router.post("/post_class", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    new_class: AddClass,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    return add_class(new_class, db)


@class_router.get("/get_classes", status_code=status.HTTP_200_OK)
def get_class(db: Session = Depends(get_db)):
    return get_classes(db)




