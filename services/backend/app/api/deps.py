import logging
from typing import Generator, Optional

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session, load_only, selectinload

from app.core.config import get_settings
from app.database import SessionLocal
from app.models import Role, User

settings = get_settings()
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


def get_db() -> Generator:
    """Database dependency"""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current authenticated user"""
    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user = (
            db.query(User)
            .options(selectinload(User.roles))
            .filter(User.id == user_id)
            .first()
        )
        if user and user.is_active:
            return user
    except JWTError:
        pass

    return None


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.size = min(size, settings.MAX_PAGE_SIZE)
        self.offset = (page - 1) * size


def get_pagination_params(
    page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)
) -> PaginationParams:
    """pagination with validation"""
    return PaginationParams(page=page, size=size)


def paginate_query(query, pagination: PaginationParams):
    """Helper to paginate any SQLAlchemy query"""
    total = query.count()
    items = query.offset(pagination.offset).limit(pagination.size).all()

    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
        "pages": (total + pagination.size - 1) // pagination.size,
        "has_next": pagination.page * pagination.size < total,
        "has_prev": pagination.page > 1,
    }


class SearchParams:
    def __init__(
        self,
        q: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        sort_by: str = "relevance",
        sort_order: str = "desc",
    ):
        self.q = q
        self.category = category
        self.brand = brand
        self.min_price = min_price
        self.max_price = max_price
        self.in_stock = in_stock
        self.sort_by = sort_by
        self.sort_order = sort_order


def get_search_params(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = "relevance",
    sort_order: str = "desc",
) -> SearchParams:
    return SearchParams(
        q, category, brand, min_price, max_price, in_stock, sort_by, sort_order
    )


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> User:
    """Get current active user"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current superuser"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user doesn't have enough privileges",
        )
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.is_active:
        from datetime import datetime

        user.last_active = datetime.utcnow()
        db.commit()
        return user

    return None
