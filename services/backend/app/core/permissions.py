"""
Permission management and access control decorators.
"""
from functools import lru_cache
from typing import List

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.constants import DEFAULT_PERMISSIONS
from app.models import User

__all__ = [
    "get_user_permissions",
    "require_permission",
    "require_permissions",
    "require_any_permission",
    "DEFAULT_PERMISSIONS",
]


@lru_cache(maxsize=128)
def get_user_permissions(user_id: str, db: Session) -> List[str]:
    """Get user permissions with caching"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    permissions = set()
    for role in user.roles:
        for permission in role.permissions:
            permissions.add(permission.name)

    return list(permissions)


def require_permission(permission_name: str):
    """Decorator to require specific permission"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        if permission_name not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission_name}' required",
            )

        return current_user

    return permission_dependency


def require_permissions(*permission_names: str):
    """Decorator to require multiple permissions (ALL required)"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        missing_permissions = []
        for perm in permission_names:
            if perm not in user_permissions:
                missing_permissions.append(perm)

        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join(missing_permissions)}",
            )

        return current_user

    return permission_dependency


def require_any_permission(*permission_names: str):
    """Decorator to require any one of the specified permissions"""

    def permission_dependency(
        current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
    ):
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        if current_user.is_superuser:
            return current_user

        user_permissions = get_user_permissions(str(current_user.id), db)

        for perm in permission_names:
            if perm in user_permissions:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these permissions required: {', '.join(permission_names)}",
        )

    return permission_dependency
