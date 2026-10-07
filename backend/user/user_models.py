from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from backend.db import Base



class UserModel(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(20), nullable=False, unique=True)
    password = Column(String(255), nullable=False, unique=False)
    email = Column(String(20), nullable=False, unique=True)
    role  = Column(String(20), default="member", nullable=False)




