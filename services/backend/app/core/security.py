"""
Security utilities for authentication and password management.

This module provides JWT token creation/verification and password hashing
using industry-standard libraries (jose for JWT, passlib with bcrypt for hashing).
"""
from datetime import datetime, timedelta
from typing import Any, Optional, Union

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for authentication.

    Args:
        subject: The subject (usually user ID or username) to encode in the token
        expires_delta: Optional custom expiration time. If None, uses default from settings

    Returns:
        Encoded JWT token string

    Example:
        >>> token = create_access_token(subject="user123")
        >>> token = create_access_token(subject="user123", expires_delta=timedelta(hours=1))
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """
    Create a JWT refresh token for obtaining new access tokens.

    Refresh tokens have longer expiration than access tokens and include
    a 'type' field to distinguish them from access tokens.

    Args:
        subject: The subject (usually user ID or username) to encode in the token

    Returns:
        Encoded JWT refresh token string

    Example:
        >>> refresh_token = create_refresh_token(subject="user123")
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.

    Uses bcrypt for secure password verification with constant-time comparison
    to prevent timing attacks.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to verify against

    Returns:
        True if password matches, False otherwise

    Example:
        >>> is_valid = verify_password("user_password", stored_hash)
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plain text password using bcrypt.

    Creates a secure hash with automatic salt generation.
    Each call produces a different hash even for the same password.

    Args:
        password: The plain text password to hash

    Returns:
        Hashed password string

    Example:
        >>> hashed = get_password_hash("user_password")
    """
    return pwd_context.hash(password)


def verify_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT token.

    Validates token signature, expiration, and structure.

    Args:
        token: The JWT token to verify

    Returns:
        The subject (user ID) from the token if valid, None otherwise

    Example:
        >>> user_id = verify_token(token)
        >>> if user_id:
        >>>     # Token is valid, proceed with user_id
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None