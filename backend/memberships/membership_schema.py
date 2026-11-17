from pydantic import BaseModel



class UpdateMembership(BaseModel):
    membership_type: str