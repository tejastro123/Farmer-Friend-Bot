"""
backend/api/mandi.py
===================
API endpoints for the Digital Mandi simulated marketplace.
"""

from fastapi import APIRouter
from backend.services.trading import get_mandi_summary, get_deal_by_id, create_sale_listing, initiate_trade

router = APIRouter(tags=["Digital Mandi"])

@router.get("/mandi/summary")
def handle_get_mandi_summary(lat: float = None, lon: float = None):
    """Returns the current state of listings and alerts, localized if coordinates provided."""
    return get_mandi_summary(lat=lat, lon=lon)

@router.get("/mandi/deal/{deal_id}")
def handle_get_deal(deal_id: str):
    """Returns details for a single trade settlement."""
    return get_deal_by_id(deal_id)

@router.post("/mandi/listing")
def handle_create_listing(data: dict):
    """Creates a new sale listing for a crop."""
    return create_sale_listing(
        commodity=data.get("commodity"),
        weight_kg=data.get("weight_kg"),
        min_price_quintal=data.get("min_price_quintal")
    )

@router.post("/mandi/trade")
def handle_initiate_trade(data: dict):
    """Initiates a trade with a dealer."""
    return initiate_trade(
        dealer_id=data.get("dealer_id"),
        dealer_name=data.get("dealer_name"),
        commodity=data.get("commodity"),
        qty_quintals=data.get("qty_quintals"),
        price_per_quintal=data.get("price_per_quintal")
    )
