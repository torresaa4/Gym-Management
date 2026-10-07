from backend.db import Base
from sqlalchemy import Column, ForeignKey, Integer, Date



class Enrollment(Base):
    __tablename__ = "enrollment"
    id = Column(Integer, primary_key=True)
    enrollment_date = Column(Date, unique=False, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    class_id = Column(Integer, ForeignKey('class.id'), nullable=False)
