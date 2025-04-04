from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Schema for user registration input
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str 
    verify_password: str

    # Enforce custom validation for password
    @property
    def is_valid_password(self):
        if len(self.password) < 8:
            return False
        if not any(c.isupper() for c in self.password):
            return False
        return True  # Valid password

# Schema for user registration response
class BaseResponse(BaseModel):
    message: str  # Confirmation message
    user_id: int  # User ID

# Schema for user information output
class UserValues(BaseModel):
    user_id: int
    username: str
    email: str
    date_created: datetime


class FriendRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"

class FriendRequestCreate(BaseModel):
    requester_id: int
    receiver_id: int
    status: FriendRequestStatus
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True

class FriendRequestResponse(BaseModel):
    id: int
    requester_id: int
    requester_username: str
    receiver_id: int
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
        }

class FriendRequests(BaseModel):
    sent_requests: List[FriendRequestResponse]
    received_requests: List[FriendRequestResponse]


class ScoreResponse(BaseModel):
    score: int
    timestamp: datetime

    class Config:
        from_attributes = True


class FriendResponse(BaseModel):
    id: int
    username: str
    profile_picture: Optional[str]
    best_score: int

class UserValues(BaseModel):
    id: int
    username: str
    email: str
    best_score: int
    profile_picture: Optional[str] = None
    sent_friend_requests: List[dict] = []
    received_friend_requests: List[dict] = []
    friends: List[FriendResponse]
    sound_settings: List[dict] = []
    scores: List[ScoreResponse] = []
    is_friend: Optional[bool] = None

    class Config:
        from_attributes = True

class Data(BaseModel):
    message: str

class FriendRequestPayload(BaseModel):
    receiver_id: int

class ScoreData(BaseModel):
    user_id: int
    score: int

class LeaderboardUser(BaseModel):
    id: int
    username: str
    best_score: int
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

