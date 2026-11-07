from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey,Time






class ClassModel(Base):
    __tablename__ = 'class'
    id = Column(Integer, primary_key=True)
    class_name = Column(String(20), nullable=False)
    instructor_id = Column(Integer, ForeignKey('Instructor.id'), nullable=False)
    class_day = Column(String(20), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
