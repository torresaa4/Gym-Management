from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.user.user_models import UserModel
from backend.user.user_schemas import UserCreate, LoginTokens, UserLogin, MyProfile, UpdateProfile
from backend.user import user_controller as controller
from backend.user.user_security import get_current_user
from backend.db import get_db


user_routes = APIRouter(prefix="/auth")

@user_routes.post("/register", status_code=status.HTTP_201_CREATED)
# json data gets sent, looks to see if it matched usercreate, if it does its assigned to new_user
def user_register(
    new_user: UserCreate,
    db: Session = Depends(get_db)
):
    return controller.register(new_user,db)



@user_routes.post("/login", response_model=LoginTokens)
def user_login(
    login: UserLogin,
    db: Session = Depends(get_db)
):
    return controller.login_user(login, db)


@user_routes.get("/my_profile", response_model=MyProfile)
def view_profile(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)):

    return controller.my_profile(current_user, db)


@user_routes.patch("/update_profile", status_code=status.HTTP_200_OK)
def update_profile(
    new_user_information: UpdateProfile,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return controller.profile_update(new_user_information, current_user, db)

