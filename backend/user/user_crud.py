from sqlalchemy.orm import Session
from backend.user.user_models import UserModel
from backend.user.user_schemas import UserCreate, UpdateProfile
from backend.enrollment.enrollment_model import Enrollment
from backend.classes.classes_model import ClassModel
from backend.memberships.membership_models import membershipModel
from fastapi import HTTPException
from backend.user import user_security

# user register crud 
def create_user(db: Session, new_user: UserCreate, hashed_password: str):

    user = UserModel(
        username = new_user.username,
        email = new_user.email,
        password = hashed_password
    )
    db.add(user)
    db.flush()

    return user



# user login crud
def get_username(db: Session, username: str):
    return db.query(UserModel).filter_by(
        username=username
    ).first()



def view_profile(current_user: UserModel, db: Session):

    my_info = db.query(
        ClassModel.id.label("class_id"),
        ClassModel.class_name,
        Enrollment.id.label("enrollment_id")
    ).join(
        Enrollment,
        ClassModel.id == Enrollment.class_id,
    ).filter(
        Enrollment.user_id == current_user.id
    ).all()

    membership = db.query(membershipModel).filter(
        membershipModel.user_id == current_user.id
    ).first()

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "membership": membership.membership_type if membership else None,
        "startedOn": membership.start_date if membership else None,
        "expiresOn": membership.end_date if membership else None,
        "joined": current_user.joined,
        "classes": [row.class_name for row in my_info],
        "bookings": [
            {
                "class_id": row.class_id,
                "enrollment_id": row.enrollment_id
            }
            for row in my_info
        ]
    }


def update_profile(new_user_information: UpdateProfile, current_user: UserModel, db: Session):
    old_user = db.query(UserModel).filter(
        UserModel.id == current_user.id
    ).first()
    if old_user is None:
        raise HTTPException(status_code=404, detail="User is not found")

    # updates if any
    if new_user_information.username is not None:
        old_user.username = new_user_information.username

    if new_user_information.email is not None:
        old_user.email = new_user_information.email

    if new_user_information.password is not None:
        new_password = user_security.get_password_hash(new_user_information.password)
        old_user.password = new_password

    db.commit()
    db.refresh(old_user)
    return {"message": "User updated"}