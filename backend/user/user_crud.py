from sqlalchemy.orm import Session

from backend.user.user_models import UserModel
from backend.user.user_schemas import UserCreate, UserLogin

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

    # retunr current user stored info from routes depends(get_current_user)
    # query enrollment databses to get classes enrolled 
    # display for now name, lastname, email, classes


    pass


