from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import tempfile
import os

from database import get_db
from models.user import User
from models.room import Membership
from models.bill import Bill, BillItem
from schemas import (
    BillResponse, BillItemCreate, BillItemResponse,
    ParsedBillResponse, ParsedBillItem
)
from core.security import get_current_user
from services.storage_service import storage_service
from services.ocr_service import ocr_service
from services.llm_service import llm_service

router = APIRouter(prefix="/bills", tags=["Bills"])


@router.post("/upload")
async def upload_bill(
    room_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a bill image to S3"""
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
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to S3
        image_url = await storage_service.upload_bill_image(file_content, file.filename)
        
        return {
            "image_url": image_url,
            "message": "Image uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/parse", response_model=ParsedBillResponse)
async def parse_bill(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Parse bill image using OCR + LLM
    Returns structured bill data
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Extract text using OCR
            ocr_text = await ocr_service.extract_text_from_image(tmp_path)
            
            if not ocr_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not extract text from image"
                )
            
            # Parse with LLM
            parsed_data = await llm_service.parse_bill_text(ocr_text)
            
            # Format response
            items = [
                ParsedBillItem(
                    description=item['description'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    total=item['total']
                )
                for item in parsed_data.get('items', [])
            ]
            
            return ParsedBillResponse(
                items=items,
                total_amount=parsed_data.get('total_amount', 0.0),
                merchant_name=parsed_data.get('merchant_name'),
                date=parsed_data.get('date')
            )
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse bill: {str(e)}"
        )


@router.post("/items", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def save_bill_items(
    room_id: int,
    image_url: str,
    items: List[BillItemCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save parsed bill items to database"""
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
    
    # Calculate total
    total_amount = sum(item.amount for item in items)
    
    # Create bill
    bill = Bill(
        room_id=room_id,
        uploaded_by=current_user.id,
        image_url=image_url,
        total_amount=total_amount
    )
    db.add(bill)
    db.flush()
    
    # Create bill items
    for item_data in items:
        bill_item = BillItem(
            bill_id=bill.id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            amount=item_data.amount,
            shared_by=item_data.shared_by
        )
        db.add(bill_item)
    
    db.commit()
    db.refresh(bill)
    
    return BillResponse.model_validate(bill)


@router.get("/room/{room_id}", response_model=List[BillResponse])
async def get_room_bills(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bills for a room"""
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
    
    bills = db.query(Bill).filter(Bill.room_id == room_id).order_by(Bill.created_at.desc()).all()
    return [BillResponse.model_validate(bill) for bill in bills]


@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill_details(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get bill details with items"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    # Verify membership
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.room_id == bill.room_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this room"
        )
    
    return BillResponse.model_validate(bill)


@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a bill (only uploader can delete)"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found"
        )
    
    if bill.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the uploader can delete this bill"
        )
    
    # Delete from S3
    await storage_service.delete_bill_image(bill.image_url)
    
    # Delete from database
    db.delete(bill)
    db.commit()
    
    return {"message": "Bill deleted successfully"}
