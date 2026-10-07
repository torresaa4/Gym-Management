from backend.enrollment.enrollment_model import Enrollment
from backend.enrollment.enrollement_schemas import EnrollmentCreate
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.user.user_models import UserModel



def enroll_class(
        new_enrollment: EnrollmentCreate, 
        db: Session, 
        current_user: UserModel
):
    class_id = new_enrollment.class_id

    # check if class actually exist



    #check if you are already entrolled in the class
    already_enrolled = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.class_id == class_id
        ).first()

    # if already _enrolled contains data matching the parameters, not empty
    if already_enrolled is  not None:
        raise HTTPException(status_code=400, detail="User already enrolled in this class")