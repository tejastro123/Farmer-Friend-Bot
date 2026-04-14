from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from backend.db.session import get_db
from backend.models.models import User, FarmerProfile
from backend.utils.auth_utils import get_password_hash, verify_password, create_access_token, decode_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter(tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# ── Schemas ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProfileUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_role: Optional[str] = None
    farm_size: Optional[float] = None
    primary_crop: Optional[str] = None
    sowing_date: Optional[str] = None # ISO format
    location_name: Optional[str] = None
    
    # Govt Data
    phone_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    kcc_number: Optional[str] = None
    survey_number: Optional[str] = None
    khata_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

# ── Dependencies ─────────────────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_optional_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        user = await get_current_user(token, db)
        return user
    except Exception:
        return None

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_pw, full_name=user_in.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-create empty profile
    profile = FarmerProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    return profile

@router.put("/profile")
def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    
    update_data = profile_in.model_dump(exclude_unset=True)
    if "sowing_date" in update_data and update_data["sowing_date"]:
        update_data["sowing_date"] = datetime.fromisoformat(update_data["sowing_date"])
        
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile
