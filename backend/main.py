from fastapi import FastAPI
from backend.db import Base, engine
from backend.user.user_routes import user_routes
from backend.enrollment.enrollment_routes import enroll_api
from backend.instructor.instructor_routes import instructor_routes
from backend.user.user_models import UserModel
from backend.instructor.instructor_model import InstructorModel
from backend.user.user_models import UserModel
from backend.enrollment.enrollment_model import Enrollment
from backend.instructor.instructor_model import InstructorModel
from backend.classes.classes_routes import class_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes)
app.include_router(instructor_routes)
app.include_router(enroll_api)
app.include_router(class_router)

@app.get('/')
def root():
    return{"Hello": "World from aws!"}   


