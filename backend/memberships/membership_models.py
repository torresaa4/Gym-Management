from sqlalchemy import Column, Integer, String, Date, ForeignKey
from backend.db import Base



class membershipModel(Base):
    __tablename__ = 'Membership'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    membership_type = Column(String(20), nullable=False)
    price = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)