from pydantic import BaseModel

# what api sends
class InstructorCreate(BaseModel):
    name: str
    last_name: str



class InstructorUpdate(BaseModel):
    name: str | None = None
    last_name: str | None = None