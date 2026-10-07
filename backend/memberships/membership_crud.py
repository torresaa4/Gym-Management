from datetime import date, timedelta
from sqlalchemy.orm import Session
from backend.memberships.membership_models import membershipModel



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