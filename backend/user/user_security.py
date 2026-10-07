from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi import Depends, status, HTTPException
from backend.db import get_db
import jwt
from backend.user.user_models import UserModel
from backend.settings import settings


from datetime import datetime, timezone

# OAuth2PasswordBearer extracts the Bearer token from the HTTP request.
# "/user/login" tells FastAPI where the client gets a token.
security = OAuth2PasswordBearer(tokenUrl="/user/login")
password_hash = PasswordHash.recommended()



def get_password_hash(password):
    return password_hash.hash(password)


def verify_password(password, hashed_password):
    return password_hash.verify(password, hashed_password)

# # Depends(security) gets the Bearer token from the HTTP request
# Depends(get_db) provides the database session.
def get_current_user(
        token: str = Depends(security),
        db: Session = Depends(get_db)):

    # verifies jwt and decodes token
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    # user_id is going to be assigned the value of sub from token
    user_id = decoded_token.get("sub")

    # if the user provided the wrong token
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    # use int since user_id is given str "sub"
    # find user who matches user_id
    user = db.query(UserModel).filter(
        UserModel.id == int(user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user



def require_admin(
        current_user: UserModel = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user