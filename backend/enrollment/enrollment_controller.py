from backend.enrollment.enrollment_model import Enrollment
from backend.classes.classes_model import ClassModel

from backend.enrollment.enrollement_schemas import EnrollmentCreate
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.user.user_models import UserModel
from backend.enrollment.enrollment_crud import sign_up_for_class, unenroll_class



def enroll_class(
        new_enrollment: EnrollmentCreate, 
        db: Session, 
        current_user: UserModel
    ):
    class_id = new_enrollment.class_id
    existing_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()

    if existing_class is None:
        raise HTTPException(status_code=400, detail="class not found")

    #check if you are already entrolled in the class
    already_enrolled = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.class_id == class_id
        ).first()

    # if already _enrolled contains data matching the parameters, not empty
    if already_enrolled is not None:
        raise HTTPException(status_code=400, detail="User already enrolled in this class")
    return sign_up_for_class(new_enrollment, db, current_user)



def class_unenroll(
        enrollent_id: int,
        current_user: UserModel,
        db: Session
):
    return unenroll_class(enrollent_id, current_user, db)