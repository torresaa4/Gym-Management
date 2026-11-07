from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.enrollment.enrollement_schemas import EnrollmentCreate
from backend.user.user_models import UserModel
from backend.user.user_security import get_current_user
from backend.enrollment.enrollment_controller import enroll_class, class_unenroll

enroll_api = APIRouter(prefix="/enrollment")




@enroll_api.post("/", status_code=status.HTTP_201_CREATED)
def class_enroll(
        new_enrollment: EnrollmentCreate,
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(get_current_user)
):
    return enroll_class(new_enrollment, db, current_user)




@enroll_api.delete("/{enrollment_id}")
def un_enroll(
    enrollment_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return class_unenroll(enrollment_id, current_user, db)