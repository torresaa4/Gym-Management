from pydantic import BaseModel



class EnrollmentCreate(BaseModel):
    class_id:int