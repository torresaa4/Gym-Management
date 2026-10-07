from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime






class ClassModel(Base):
    __tablename__ = 'class'
    id = Column(Integer, primary_key=True)
    class_name = Column(String(20), nullable=False)
    instructor_id = Column(Integer, ForeignKey('Instructor.id'), nullable=False)
    class_date = Column(DateTime, nullable=False)
