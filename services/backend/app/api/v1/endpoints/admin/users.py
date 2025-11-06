from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, selectinload

from app.api.deps import (
    PaginationParams,
    get_db,
    get_pagination_params,
)
from app.core.permissions import require_permission
from app.core.security import get_password_hash
from app.models import Permission, Role, User
from app.schemas import (
    MessageResponse,
    PaginatedResponse,
    PermissionResponse,
    RoleCreate,
    RoleResponse,
    UserCreate,
    UserUpdate,
    UserWithRoles,
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def admin_list_user(
    pagination: PaginationParams = Depends(get_pagination_params),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    role_id: Optional[int] = Query(None),
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Admin: List all users with filtering"""

    query = db.query(User).options(selectinload(User.roles))

    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
            | User.full_name.ilike(f"%{search}%")
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if role_id:
        query = query.join(User.roles).filter(Role.id == role_id)

    total = query.count()
    users = query.offset(pagination.offset).limit(pagination.size).all()

    return PaginatedResponse(
        items=users,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


# User Management
@router.get("/users", response_model=PaginatedResponse)
async def admin_list_users(
    pagination: PaginationParams = Depends(get_pagination_params),
    is_active: Optional[bool] = Query(None),
    is_superuser: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("view_users")),
    db: Session = Depends(get_db),
):
    """Admin: List all users with filtering"""

    query = db.query(User).options(selectinload(User.roles))

    # Apply filters
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if is_superuser is not None:
        query = query.filter(User.is_superuser == is_superuser)

    if search:
        query = query.filter(
            or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )

    # Get total count
    total = query.count()

    # Apply pagination
    users = (
        query.order_by(desc(User.created_at))
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    pages = (total + pagination.size - 1) // pagination.size

    return PaginatedResponse(
        items=users,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=pages,
    )


@router.post("/users", response_model=UserWithRoles)
async def admin_create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Admin: Create a new user"""

    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
        )

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed_password

    user = User(**user_dict)
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get("/users/{user_id}", response_model=UserWithRoles)
async def admin_get_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("view_users")),
    db: Session = Depends(get_db),
):
    """Admin: Get user details"""

    user = (
        db.query(User)
        .options(selectinload(User.roles))
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


@router.put("/users/{user_id}", response_model=UserWithRoles)
async def admin_update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Admin: Update user"""

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check username uniqueness if being updated
    if user_data.username and user_data.username != user.username:
        existing = (
            db.query(User)
            .filter(User.username == user_data.username)
            .filter(User.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

    # Check email uniqueness if being updated
    if user_data.email and user_data.email != user.email:
        existing = (
            db.query(User)
            .filter(User.email == user_data.email)
            .filter(User.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
            )

    # Update user fields
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Admin: Delete user (soft delete)"""

    if str(user_id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Soft delete
    user.is_active = False
    db.commit()

    return MessageResponse(message="User deleted successfully")


# Role Management
@router.get("/roles", response_model=List[RoleResponse])
async def admin_list_roles(
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """List all roles with permissions"""

    roles = (
        db.query(Role)
        .options(selectinload(Role.permissions))
        .options(selectinload(Role.users))
        .all()
    )

    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "created_at": role.created_at,
            "permissions": [
                {"id": perm.id, "name": perm.name, "description": perm.description}
                for perm in role.permissions
            ],
            "user_count": len(role.users),
        }
        for role in roles
    ]


@router.post("/roles", response_model=RoleResponse)
async def admin_create_role(
    role_data: RoleCreate,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Create new role"""

    # Check if name already exists
    existing = db.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Role name already exists"
        )

    # Create role
    role = Role(name=role_data.name, description=role_data.description)
    db.add(role)
    db.flush()  # Get the role ID

    # Add permissions if provided
    if role_data.permission_ids:
        permissions = (
            db.query(Permission)
            .filter(Permission.id.in_(role_data.permission_ids))
            .all()
        )
        role.permissions = permissions

    db.commit()
    db.refresh(role)

    return role


@router.get("/permissions", response_model=List[PermissionResponse])
async def admin_list_permissions(
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """List all permissions"""

    permissions = db.query(Permission).all()

    return [
        {
            "id": perm.id,
            "name": perm.name,
            "description": perm.description,
            "created_at": perm.created_at,
        }
        for perm in permissions
    ]


@router.post("/users/{user_id}/roles/{role_id}")
async def assign_role_to_user(
    user_id: UUID,
    role_id: int,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Assign a role to a user"""

    user = (
        db.query(User)
        .options(selectinload(User.roles))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    if role not in user.roles:
        user.roles.append(role)
        db.commit()

    return MessageResponse(message=f"Role '{role.name}' assigned to user successfully")


@router.delete("/users/{user_id}/roles/{role_id}")
async def remove_role_from_user(
    user_id: UUID,
    role_id: int,
    current_user: User = Depends(require_permission("manage_users")),
    db: Session = Depends(get_db),
):
    """Remove a role from a user"""

    user = (
        db.query(User)
        .options(selectinload(User.roles))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    if role in user.roles:
        user.roles.remove(role)
        db.commit()

    return MessageResponse(message=f"Role '{role.name}' removed from user successfully")
