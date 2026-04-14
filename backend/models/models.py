from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("FarmerProfile", back_populates="user", uselist=False)
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    soil_role = Column(String, default="Standard") 
    farm_size = Column(Float, nullable=True) 
    primary_crop = Column(String, nullable=True)
    sowing_date = Column(DateTime, nullable=True)
    location_name = Column(String, nullable=True) 
    
    # Government-Affiliated Data
    phone_number = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    kcc_number = Column(String, nullable=True)
    survey_number = Column(String, nullable=True)
    khata_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, default="New Consultation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    messages = relationship("ChatHistory", back_populates="session", cascade="all, delete-orphan")

class ChatHistory(Base):
    """Acts as ChatMessage in a session context"""
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True) # Temporarily nullable for migration
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(String)
    answer = Column(String)
    agents_used = Column(JSON, default=[])
    sources = Column(JSON, default=[])
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User", back_populates="history") # Keep legacy backref for now

User.history = relationship("ChatHistory", back_populates="user")
