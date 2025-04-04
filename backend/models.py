import enum
from sqlalchemy import Boolean, Column, Enum, Integer, LargeBinary, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class FriendRequestStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    best_score = Column(Integer, default=0)
    profile_picture = Column(LargeBinary, nullable=True)
    sound_settings = relationship("SoundSetting", back_populates="user")
    scores = relationship("Score", back_populates="user")
    sent_friend_requests = relationship(
        "FriendRequest", 
        back_populates="requester", 
        foreign_keys="FriendRequest.requester_id"
    )
    received_friend_requests = relationship(
        "FriendRequest", 
        back_populates="receiver", 
        foreign_keys="FriendRequest.receiver_id"
    )

class Score(Base):
    __tablename__ = 'scores'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    score = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="scores")

class Sound(Base):
    __tablename__ = 'sounds'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  
    sound_settings = relationship("SoundSetting", back_populates="sound")

class SoundSetting(Base):
    __tablename__ = 'sound_settings'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    sound_id = Column(Integer, ForeignKey('sounds.id'), nullable=False)
    volume = Column(Float, nullable=False, default=75)  
    user = relationship("User", back_populates="sound_settings")
    sound = relationship("Sound", back_populates="sound_settings")

class FriendRequest(Base):
    __tablename__ = 'friend_requests'
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    status = Column(Enum(FriendRequestStatus), default=FriendRequestStatus.pending, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    requester = relationship("User", back_populates="sent_friend_requests", foreign_keys=[requester_id])
    receiver = relationship("User", back_populates="received_friend_requests", foreign_keys=[receiver_id])