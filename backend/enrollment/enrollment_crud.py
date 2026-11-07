from sqlalchemy.orm import Session
from backend.enrollment.enrollment_model import Enrollment
from backend.enrollment.enrollement_schemas import EnrollmentCreate
from backend.user.user_models import UserModel
from datetime import date
from fastapi import HTTPException





def sign_up_for_class(
        new_enrollment: EnrollmentCreate,
        db: Session,
        current_user: UserModel
):
    new_class  = Enrollment(
        enrollment_date = date.today(),
        user_id = current_user.id,
        class_id = new_enrollment.class_id
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class



def unenroll_class(
        enrollment_id: int,
        current_user: UserModel,
        db: Session
):
    enrolled = db.query(Enrollment).filter(
        Enrollment.id == enrollment_id,
        Enrollment.user_id == current_user.id
        ).first()
    
    if enrolled is None:
        raise HTTPException(status_code=400, detail="enrollemnt was not found")

    db.delete(enrolled)
    db.commit()
    return {"message": "Successfully unenrolled"}