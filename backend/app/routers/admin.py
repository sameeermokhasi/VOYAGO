from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import User, Ride, DriverProfile, UserRole, RideStatus
from app.schemas import AdminStats, UserResponse
from app.auth import get_current_active_user

router = APIRouter()

async def verify_admin(current_user: User = Depends(get_current_active_user)):
    """Verify user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    total_users = db.query(User).count()
    total_drivers = db.query(User).filter(User.role == UserRole.DRIVER).count()
    total_riders = db.query(User).filter(User.role == UserRole.RIDER).count()
    total_rides = db.query(Ride).count()
    active_rides = db.query(Ride).filter(
        Ride.status.in_([RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
    ).count()
    completed_rides = db.query(Ride).filter(Ride.status == RideStatus.COMPLETED).count()
    
    # Calculate Platform Revenue (Admin Wallet Balance or Sum of Platform Fees)
    # Method 1: Get Admin User Wallet Balance (Most Accurate based on new rides.py logic)
    admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
    total_revenue = float(admin_user.wallet_balance) if admin_user and admin_user.wallet_balance else 0.0
    
    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "total_riders": total_riders,
        "total_rides": total_rides,
        "active_rides": active_rides,
        "completed_rides": completed_rides,
        "total_revenue": float(total_revenue)
    }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db),
    role: str = None
):
    """Get all users"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    return users

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "user_id": user.id,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
