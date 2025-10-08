from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Bill(Base):
    __tablename__ = "bills"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String, nullable=False)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("Room", back_populates="bills")
    uploader = relationship("User", back_populates="uploaded_bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")


class BillItem(Base):
    __tablename__ = "bill_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    shared_by = Column(JSON, nullable=False)  # List of user_ids
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bill = relationship("Bill", back_populates="items")
