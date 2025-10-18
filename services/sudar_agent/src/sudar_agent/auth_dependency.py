"""
Authentication and Authorization utilities for Sudar Agent Service.

This module provides JWT token validation to secure API endpoints.
Tokens are validated using the same SECRET_KEY as the backend service.
"""

import logging
from typing import Optional

from fastapi import HTTPException, status, Depends, Cookie
from sqlalchemy.orm import Session

from jose import jwt, JWTError

from .config.config import config
from .database import get_db
from .models import Classroom

logger = logging.getLogger(__name__)

# Security settings - must match backend
ALGORITHM = "HS256"


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        dict: Decoded token payload containing user_id and other claims
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, 
            config.SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        
        # Validate token type
        token_type = payload.get("type")
        if token_type not in ["access", "refresh"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    access_token: Optional[str] = Cookie(None)
) -> dict:
    """
    Dependency to get the current authenticated user from cookie token.
    
    Args:
        access_token: JWT token from cookie
        
    Returns:
        dict: User information from token payload including:
            - user_id: User identifier
            - email: User email
            - exp: Token expiration timestamp
            
    Raises:
        HTTPException: If authentication fails
        
    Example:
        @app.post("/api/endpoint")
        async def endpoint(current_user: dict = Depends(get_current_user)):
            user_id = current_user["user_id"]
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(access_token)
    
    # Extract user_id from token
    user_id: str = payload.get("sub")
    if user_id is None:
        logger.warning("Token missing 'sub' (user_id) claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Authenticated user: {user_id}")
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "exp": payload.get("exp"),
        "type": payload.get("type")
    }


def verify_user_access(
    request_user_id: str,
    token_user_id: str
) -> None:
    """
    Verify that the user_id in the request matches the authenticated user.
    
    This prevents users from accessing or modifying data for other users.
    
    Args:
        request_user_id: User ID from the request body/params
        token_user_id: User ID extracted from the JWT token
        
    Raises:
        HTTPException: If user IDs don't match (403 Forbidden)
        
    Example:
        verify_user_access(
            request_user_id=request.user_id,
            token_user_id=current_user["user_id"]
        )
    """
    if request_user_id != token_user_id:
        logger.warning(
            f"Access denied: request user_id '{request_user_id}' "
            f"doesn't match token user_id '{token_user_id}'"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this resource"
        )


def verify_classroom_access(
    user_id: str,
    classroom_id: str,
    db: Session
) -> None:
    """
    Verify that the user (teacher) has access to the specified classroom.
    
    This function queries the database to ensure the teacher owns the classroom.
    
    Args:
        user_id: Teacher ID (UUID string)
        classroom_id: Classroom ID (UUID string) 
        db: Database session
        
    Raises:
        HTTPException: If classroom doesn't exist or teacher doesn't own it
        
    Example:
        verify_classroom_access(
            user_id=current_user["user_id"],
            classroom_id=request.classroom_id,
            db=db
        )
    """
    if not classroom_id:
        logger.warning(f"No classroom_id provided for user {user_id}")
        return
    
    try:
        # Query database to check if teacher owns this classroom
        classroom = db.query(Classroom).filter(
            Classroom.classroom_id == classroom_id,
            Classroom.teacher_id == user_id
        ).first()
        
        if not classroom:
            logger.warning(
                f"Access denied: Teacher {user_id} does not have access to classroom {classroom_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this classroom"
            )
        
        logger.info(f"Teacher {user_id} verified for classroom {classroom_id}: {classroom.classroom_name}")
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Database error during classroom verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying classroom access"
        )
