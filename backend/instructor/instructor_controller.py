from sqlalchemy.orm import Session
from backend.instructor.instructor_schema import InstructorCreate
from backend.instructor.instructor_model import InstructorModel
from backend.instructor.instructor_crud import add_instructor, get_instructors, updated_instructor
from fastapi import HTTPException



# deosnt need admin required since it was checked in routes
def create_instructor(
        new_instructor: InstructorCreate, 
        db: Session
        ):

    # name and lastname isnt empty
    # strip() removes whitespace from beg. and end
    # if not == if empty
    if not new_instructor.name.strip() or not new_instructor.last_name.strip():
        raise HTTPException(status_code=400, detail="name and lastname cannot be empty")

    return add_instructor(new_instructor, db)


def all_instructor(
        db: Session
        ):
    
    return get_instructors(db)




def update_instructor(instructor_id: int, new_instructor: InstructorCreate, db: Session):

    return updated_instructor(instructor_id, new_instructor, db)



def delete_instructor(instructor_id: int, db: Session):

    return crud(instructor_id, db)