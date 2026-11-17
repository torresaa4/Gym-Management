from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.user.user_models import UserModel
from backend.memberships.membership_controller import membership_updated
from backend.user.user_security import get_current_user
from backend.db import get_db
from backend.memberships.membership_schema import UpdateMembership


member_routes = APIRouter(prefix="/user")


@member_routes.patch("/update_membership", status_code=status.HTTP_200_OK)
def update_membership(
    new_membership: UpdateMembership,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    return membership_updated(new_membership, current_user, db)