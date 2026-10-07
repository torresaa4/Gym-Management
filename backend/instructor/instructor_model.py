from sqlalchemy import Column, String, Integer, ForeignKey
from backend.db import Base



class InstructorModel(Base):
    __tablename__ = 'Instructor'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False)
    last_name = Column(String(20), nullable=False)
    #class_id = Column(Integer, nullable=False)
    

