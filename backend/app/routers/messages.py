from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app import models
from app.auth import get_current_user
from app.websocket import manager

router = APIRouter()

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    ride_id: Optional[int] = None

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    ride_id: Optional[int]
    is_read: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class ConversationSummary(BaseModel):
    user_id: int
    name: str # Name of the other person
    last_message: str
    timestamp: datetime
    unread_count: int

@router.post("/send", response_model=MessageOut)
async def send_message(
    msg: MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify receiver exists
    receiver = db.query(models.User).filter(models.User.id == msg.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    new_message = models.Message(
        sender_id=current_user.id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        ride_id=msg.ride_id
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Prepare real-time notification
    notification = {
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "sender_name": current_user.name,
            "content": new_message.content,
            "ride_id": new_message.ride_id,
            "created_at": new_message.created_at.isoformat()
        }
    }
    
    # Send to receiver via WebSocket
    await manager.send_personal_message(notification, msg.receiver_id)

    return new_message

@router.get("/conversation/{other_user_id}", response_model=List[MessageOut])
def get_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == other_user_id),
            and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == current_user.id)
        )
    ).order_by(models.Message.created_at.asc()).all()
    
    # Mark received messages as read
    unread = [m for m in messages if m.receiver_id == current_user.id and not m.is_read]
    for m in unread:
        m.is_read = True
    if unread:
        db.commit()
        
    return messages

@router.get("/recent", response_model=List[ConversationSummary])
def get_recent_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # This query is a bit complex. We want the latest message per conversation.
    # We'll fetch all messages involving the user, then group by the other person in python for simplicity 
    # (SQL optimization can be done later if needed)
    
    all_messages = db.query(models.Message).filter(
        or_(models.Message.sender_id == current_user.id, models.Message.receiver_id == current_user.id)
    ).order_by(models.Message.created_at.desc()).all()
    
    conversations = {}
    
    for msg in all_messages:
        other_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        
        if other_id not in conversations:
            # Fetch other user name
            other_user = db.query(models.User).filter(models.User.id == other_id).first()
            name = other_user.name if other_user else "Unknown"
            
            conversations[other_id] = {
                "user_id": other_id,
                "name": name,
                "last_message": msg.content,
                "timestamp": msg.created_at,
                "unread_count": 0
            }
        
        # Count unread
        if msg.receiver_id == current_user.id and not msg.is_read:
             conversations[other_id]["unread_count"] += 1
             
    return list(conversations.values())
