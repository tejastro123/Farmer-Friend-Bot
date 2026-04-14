"""
backend/api/mandi.py
====================
API endpoints for the Digital Mandi simulated marketplace.
"""

from fastapi import APIRouter
from backend.services.trading import get_mandi_summary, get_deal_by_id

router = APIRouter(tags=["Digital Mandi"])

@router.get("/mandi/summary")
def handle_get_mandi_summary(lat: float = None, lon: float = None):
    """Returns the current state of listings and alerts, localized if coordinates provided."""
    return get_mandi_summary(lat=lat, lon=lon)

@router.get("/mandi/deal/{deal_id}")
def handle_get_deal(deal_id: str):
    """Returns details for a single trade settlement."""
    return get_deal_by_id(deal_id)
