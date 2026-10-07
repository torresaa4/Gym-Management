from fastapi import HTTPException
from backend.user.user_schemas import UserCreate, UserLogin, LoginTokens
from backend.user import user_crud as crud 
from sqlalchemy.orm import Session
from backend.user.user_models import UserModel
from backend.user import user_security
import jwt
from backend.settings import settings
from datetime import datetime, timedelta, timezone
from backend.memberships.membership_controller import get_membership_details
from backend.memberships.membership_crud import create_membership



memberships = ["Basic", "Premium", "Vip"]
# body contains data from the router new_user and so on
def register(new_user: UserCreate, db: Session):
    
    # query the usermodel.find rows where the tables username matches the username submitted by user.return the first match
    user_username = db.query(UserModel).filter(UserModel.username == new_user.username).first()

    # if username is found
    if user_username:
        raise HTTPException(400, detail="username already exist")

    user_email = db.query(UserModel).filter(UserModel.email == new_user.email).first()

    if user_email:
        raise HTTPException(400, detail="email already exist")

    # from userschema(what user sends)
    membership = new_user.membership_type


    if membership not in memberships:
        raise HTTPException(400, detail="membership must be Basic, Premium, or Vip")

    membership_details = get_membership_details(membership)

    hashed_password = user_security.get_password_hash(new_user.password)
    
    try:
        user = crud.create_user(db, new_user, hashed_password)

        create_membership(

            db, 
            user.id, 
            membership_details["membership_type"], 
            membership_details["price"], 
            membership_details["duration"])
        db.commit()

        return {"message": "User created"}

    except Exception:
        db.rollback()
        raise
    

   

    

def login_user(login: UserLogin, db: Session):

    user = crud.get_username(db, login.username)

    # if username/password is not found
    if not user or not user_security.verify_password(login.password, user.password):
        raise HTTPException(status_code=401, detail="invalid username or password")

    exp_time = datetime.now(timezone.utc) + timedelta(minutes=settings.EXP_TIME)
    # sub: this token belongs to user.id
    # exp: expires in this time
    # settings.secret_key is used to stamp the token
    # algorithm: 

    print("Token expiration:", exp_time)
    print("Expiration duration:", settings.EXP_TIME, "minutes")
    token = jwt.encode({"sub":str(user.id), "exp":exp_time}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}



def my_profile(current_user: UserModel, db: Session):
    return crudfunction(current_user, db)