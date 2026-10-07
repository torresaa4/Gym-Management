from pydantic import BaseModel



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
