from sqlalchemy.orm import Session

from backend.user.user_models import UserModel
from backend.user.user_schemas import UserCreate
from backend.enrollment.enrollment_model import Enrollment
from backend.classes.classes_model import ClassModel

# user register crud
# recieves values from router using 
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
        UserModel.username,
        UserModel.email,
        ClassModel.class_name
    
    ).join(
        Enrollment,
        UserModel.id == Enrollment.user_id,
    ).join(
        ClassModel,
        ClassModel.id == Enrollment.class_id
    ).filter(
        UserModel.id == current_user.id
    ).all()   


    return {
        "username": current_user.username,
        "email": current_user.email,
        "classes": [row.class_name for row in my_info]
    }


