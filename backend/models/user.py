from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    avatar = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    created_rooms = relationship("Room", back_populates="creator", foreign_keys="Room.created_by")
    uploaded_bills = relationship("Bill", back_populates="uploader")
