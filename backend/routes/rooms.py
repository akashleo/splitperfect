from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.room import Room, Membership
from schemas import (
    RoomCreate, RoomJoin, RoomResponse, RoomWithMembers,
    UserResponse, RoomSummary, DebtTransaction, UserBalance
)
from core.security import get_current_user
from services.simplify_service import simplify_service

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new room and add creator as first member"""
    # Generate unique secret
    secret = Room.generate_secret()
    
    # Create room
    room = Room(
        name=room_data.name,
        secret=secret,
        created_by=current_user.id
    )
    db.add(room)
    db.flush()
    
    # Add creator as member
    membership = Membership(user_id=current_user.id, room_id=room.id)
    db.add(membership)
    
    db.commit()
    db.refresh(room)
    
    response = RoomResponse.model_validate(room)
    response.member_count = 1
    return response


@router.post("/join", response_model=RoomResponse)
async def join_room(
    join_data: RoomJoin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an existing room using secret code"""
    # Find room by secret
    room = db.query(Room).filter(Room.secret == join_data.secret).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found with this secret"
        )
    
    # Check if already a member
    existing = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.room_id == room.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this room"
        )
    
    # Add membership
    membership = Membership(user_id=current_user.id, room_id=room.id)
    db.add(membership)
    db.commit()
    
    # Get member count
    member_count = db.query(Membership).filter(Membership.room_id == room.id).count()
    
    response = RoomResponse.model_validate(room)
    response.member_count = member_count
    return response


@router.get("", response_model=List[RoomResponse])
async def get_my_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all rooms the current user is a member of"""
    memberships = db.query(Membership).filter(
        Membership.user_id == current_user.id
    ).all()
    
    rooms = []
    for membership in memberships:
        room = membership.room
        member_count = db.query(Membership).filter(
            Membership.room_id == room.id
        ).count()
        
        room_response = RoomResponse.model_validate(room)
        room_response.member_count = member_count
        rooms.append(room_response)
    
    return rooms


@router.get("/{room_id}", response_model=RoomWithMembers)
async def get_room_details(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get room details with member list"""
    # Check if user is member
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.room_id == room_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this room"
        )
    
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Get all members
    memberships = db.query(Membership).filter(Membership.room_id == room_id).all()
    members = [UserResponse.model_validate(m.user) for m in memberships]
    
    response = RoomWithMembers.model_validate(room)
    response.members = members
    response.member_count = len(members)
    return response


@router.get("/{room_id}/summary", response_model=RoomSummary)
async def get_room_summary(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get simplified debt summary for a room"""
    # Verify membership
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.room_id == room_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this room"
        )
    
    room = db.query(Room).filter(Room.id == room_id).first()
    
    # Calculate balances
    balances = simplify_service.calculate_balances(room_id, db)
    
    # Simplify debts
    transactions = simplify_service.simplify_debts(balances)
    
    # Get user names
    users = db.query(User).filter(User.id.in_(balances.keys())).all()
    user_map = {u.id: u.name for u in users}
    
    # Format transactions
    debt_transactions = [
        DebtTransaction(
            from_user_id=from_id,
            from_user_name=user_map.get(from_id, "Unknown"),
            to_user_id=to_id,
            to_user_name=user_map.get(to_id, "Unknown"),
            amount=amount
        )
        for from_id, to_id, amount in transactions
    ]
    
    # Calculate total expenses
    from models.bill import Bill
    bills = db.query(Bill).filter(Bill.room_id == room_id).all()
    total_expenses = sum(bill.total_amount for bill in bills)
    
    # Format balances
    user_balances = []
    for user_id, net_balance in balances.items():
        # Calculate total paid and owed
        total_paid = sum(bill.total_amount for bill in bills if bill.uploaded_by == user_id)
        total_owed = total_paid - net_balance
        
        user_balances.append(UserBalance(
            user_id=user_id,
            user_name=user_map.get(user_id, "Unknown"),
            total_paid=total_paid,
            total_owed=total_owed,
            net_balance=net_balance
        ))
    
    return RoomSummary(
        room_id=room.id,
        room_name=room.name,
        total_expenses=total_expenses,
        transactions=debt_transactions,
        balances=user_balances
    )


@router.delete("/{room_id}")
async def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a room (only creator can delete)"""
    room = db.query(Room).filter(Room.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if room.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only room creator can delete the room"
        )
    
    db.delete(room)
    db.commit()
    
    return {"message": "Room deleted successfully"}
