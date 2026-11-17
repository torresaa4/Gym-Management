from datetime import date, timedelta
from sqlalchemy.orm import Session
from backend.memberships.membership_models import membershipModel
from fastapi import HTTPException



def create_membership(db: Session, user_id: int, membership_type: str, price: int, duration: int):

    start_date = date.today()
    end_date = start_date + timedelta(days=duration)

    
    membership = membershipModel(
        user_id = user_id,
        membership_type = membership_type,
        price = price,
        duration = duration,
        start_date = start_date,
        end_date = end_date
    )
    db.add(membership)
    db.flush()
    return membership



def update_membership(
    db: Session,
    user_id: int,
    membership_type: str,
    price: int,
    duration: int
):
    membership = db.query(membershipModel).filter(
        membershipModel.user_id == user_id
    ).first()

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Membership not found"
        )

    today = date.today()

    # Renew the same active plan
    if (
        membership.membership_type == membership_type
        and membership.end_date >= today
    ):
        membership.end_date += timedelta(days=duration)

    # Switch plans or renew an expired plan
    else:
        membership.start_date = today
        membership.end_date = today + timedelta(days=duration)

    membership.membership_type = membership_type
    membership.price = price
    membership.duration = duration

    db.commit()
    db.refresh(membership)

    return membership