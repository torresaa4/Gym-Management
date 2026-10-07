from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.instructor.instructor_schema import InstructorCreate
from backend.instructor.instructor_controller import create_instructor, all_instructor, update_instructor, delete_instructor
from backend.db import get_db
from backend.user.user_models import UserModel
from backend.user.user_security import require_admin
from fastapi import Depends

instructor_routes = APIRouter(prefix="/instructor")

@instructor_routes.post("/add_instructor", status_code=status.HTTP_201_CREATED)
# current user isnt used in body just to check who is making the reuest
# it is used to check who is making the request.
# Depends tells FastAPI to run require_admin and provide
# whatever dependencies require_admin needs.
def add_instructor(
    new_instructor: InstructorCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
    ):
    return create_instructor(new_instructor, db)



@instructor_routes.get("/all_instructor", status_code=status.HTTP_200_OK)
def get_instructors(
    db: Session = Depends(get_db)
):
    return all_instructor(db)


@instructor_routes.patch("/update_instructor/{instructor_id}", status_code=status.HTTP_200_OK)
def update_instructors(
    instructor_id: int,
    new_instructor: InstructorCreate, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_admin)
):
    return update_instructor(instructor_id, new_instructor, db)

@instructor_routes.delete("/delete_instructor/{instructor_id}", status_code=status.HTTP_200_OK)
def delete_instructors(
    instructor_id: int,
    current_user: UserModel = Depends(require_admin),
     db : Session = Depends(get_db)
):
    return delete_instructor(instructor_id, current_user, db)