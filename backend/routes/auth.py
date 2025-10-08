from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import httpx

from database import get_db
from models.user import User
from schemas import GoogleAuthRequest, TokenResponse, UserResponse
from core.config import settings
from core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth token
    Creates new user if doesn't exist
    Returns JWT access token
    """
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            auth_request.token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Extract user info
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        avatar = idinfo.get('picture')
        
        # Check if user exists
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                avatar=avatar
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update user info if changed
            user.name = name
            user.avatar = avatar
            db.commit()
        
        # Create JWT token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse.model_validate(current_user)
