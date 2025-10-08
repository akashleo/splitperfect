from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import secrets


class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    secret = Column(String, unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_rooms", foreign_keys=[created_by])
    memberships = relationship("Membership", back_populates="room", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="room", cascade="all, delete-orphan")
    
    @staticmethod
    def generate_secret():
        """Generate a unique room secret"""
        return secrets.token_urlsafe(16)


class Membership(Base):
    __tablename__ = "memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="memberships")
    room = relationship("Room", back_populates="memberships")
