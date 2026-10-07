from fastapi import HTTPException


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