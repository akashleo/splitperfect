from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    google_id: str
    avatar: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Room Schemas
class RoomCreate(BaseModel):
    name: str


class RoomJoin(BaseModel):
    secret: str


class RoomResponse(BaseModel):
    id: int
    name: str
    secret: str
    created_by: int
    created_at: datetime
    member_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class RoomWithMembers(RoomResponse):
    members: List[UserResponse]


# Bill Schemas
class BillItemCreate(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float
    amount: float
    shared_by: List[int]  # List of user IDs


class BillItemResponse(BillItemCreate):
    id: int
    bill_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class BillCreate(BaseModel):
    room_id: int
    image_url: str
    total_amount: float


class BillResponse(BaseModel):
    id: int
    room_id: int
    uploaded_by: int
    image_url: str
    total_amount: float
    created_at: datetime
    items: List[BillItemResponse] = []
    
    class Config:
        from_attributes = True


# Auth Schemas
class GoogleAuthRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Bill Parsing Schemas
class ParsedBillItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float


class ParsedBillResponse(BaseModel):
    items: List[ParsedBillItem]
    total_amount: float
    merchant_name: Optional[str] = None
    date: Optional[str] = None


# Report Schemas
class DebtTransaction(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: float


class UserBalance(BaseModel):
    user_id: int
    user_name: str
    total_paid: float
    total_owed: float
    net_balance: float


class RoomSummary(BaseModel):
    room_id: int
    room_name: str
    total_expenses: float
    transactions: List[DebtTransaction]
    balances: List[UserBalance]


class CategoryExpense(BaseModel):
    category: str
    amount: float


class RoomReport(RoomSummary):
    category_breakdown: List[CategoryExpense]
