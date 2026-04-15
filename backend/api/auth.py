from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from datetime import datetime

from backend.db.db_utils import (
    get_user_by_email, get_user_by_id, create_user, 
    get_farmer_profile, update_farmer_profile
)
from backend.utils.auth_utils import get_password_hash, verify_password, create_access_token, decode_access_token
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

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

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
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
        
        # Raw SQL Lookup
        user = get_user_by_email(email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme_optional)):
    if not token:
        return None
    try:
        user = await get_current_user(token)
        return user
    except Exception:
        return None

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate):
    db_user = get_user_by_email(user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user_in.password)
    user_id = create_user(email=user_in.email, hashed_pw=hashed_pw, full_name=user_in.full_name)
    
    return {
        "id": user_id,
        "email": user_in.email,
        "full_name": user_in.full_name
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    profile = get_farmer_profile(current_user["id"])
    return profile

@router.put("/profile")
def update_profile(profile_in: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = profile_in.model_dump(exclude_unset=True)
    if "sowing_date" in update_data and update_data["sowing_date"]:
        try:
            update_data["sowing_date"] = datetime.fromisoformat(update_data["sowing_date"]).isoformat()
        except: pass
        
    update_farmer_profile(current_user["id"], update_data)
    return get_farmer_profile(current_user["id"])
