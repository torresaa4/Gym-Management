from backend.memberships.membership_schema import UpdateMembership
from backend.user.user_models import UserModel
from backend.memberships.membership_crud import update_membership
from sqlalchemy.orm import Session
from fastapi import HTTPException



memberships = ["Basic", "Premium", "Vip"]



def get_membership_details(membership_type: str):
    if membership_type == "Basic":
        price = 30
        duration = 30

    elif membership_type == "Premium":
        price = 80
        duration = 90

    elif membership_type == "Vip":
        price = 300
        duration = 365

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid membership type"
        )

    return {
        "membership_type": membership_type,
        "price": price,
        "duration": duration
    }


def membership_updated(
    new_membership: UpdateMembership,
    current_user: UserModel,
    db: Session
):
    membership = new_membership.membership_type

    if membership not in memberships:
        raise HTTPException(
            status_code=400,
            detail="Membership must be Basic, Premium, or Vip"
        )

    membership_details = get_membership_details(membership)

    return update_membership(
        db,
        current_user.id,
        membership_details["membership_type"],
        membership_details["price"],
        membership_details["duration"]
    )