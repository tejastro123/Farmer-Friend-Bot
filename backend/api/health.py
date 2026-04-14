from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])

class HealthResponse(BaseModel):
    status: str
    message: str

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Basic health check endpoint."""
    return HealthResponse(status="ok", message="Farmer Helper Backend is running")
