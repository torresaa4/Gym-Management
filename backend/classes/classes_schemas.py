from datetime import date, time
from pydantic import BaseModel



class AddClass(BaseModel):
    class_name: str
    instructor_id: int
    class_day: str
    start_time: time
    end_time: time


class ClassResponse(BaseModel):
    id: int
    class_name: str
    class_day: str
    start_time: time
    end_time: time
    instructor_name: str
    instructor_last_name: str
    