from pydantic import BaseModel
from datetime import date



# what the client sends
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    membership_type: str

# what the API sends back
class UserResponse(BaseModel):
    id: int
    email: str
    username: str

# what client sends
class UserLogin(BaseModel):
    username: str
    password: str

# what api sends back
class LoginTokens(BaseModel):
    access_token: str
    token_type: str



class BookingResponse(BaseModel):
    class_id: int
    enrollment_id: int

class MyProfile(BaseModel):
    id: int
    username: str
    email: str
    role: str
    membership: str | None = None
    startedOn: date | None = None
    expiresOn: date | None = None
    classes: list[str]
    bookings: list[BookingResponse]
    joined: date | None = None


class UpdateProfile(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None

