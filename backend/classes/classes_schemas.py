from datetime import date
from pydantic import BaseModel



class AddClass(BaseModel):
    class_name: str
    instructor_id: int
    class_date: date


class ClassResponse(BaseModel):
    class_name: str
    class_date: date
    instructor_name: str
    instructor_last_name: str
    