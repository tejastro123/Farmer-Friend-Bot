"""
backend/api/mandi.py
===================
API endpoints for the Digital Mandi simulated marketplace.
"""

from fastapi import APIRouter, HTTPException
from backend.services.trading import (
    get_mandi_summary, get_deal_by_id, create_sale_listing, 
    initiate_trade, confirm_trade, record_payment, complete_trade, get_all_deals
)

router = APIRouter(tags=["Digital Mandi"])

@router.get("/mandi/summary")
def handle_get_mandi_summary(lat: float = None, lon: float = None):
    """Returns the current state of listings and alerts, localized if coordinates provided."""
    return get_mandi_summary(lat=lat, lon=lon)

@router.get("/mandi/deal/{deal_id}")
def handle_get_deal(deal_id: str):
    """Returns details for a single trade settlement."""
    deal = get_deal_by_id(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.get("/mandi/deals")
def handle_get_all_deals():
    """Returns all deals from the ledger."""
    return get_all_deals()

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
    """Initiates a trade with a dealer - starts the trade workflow."""
    deal = initiate_trade(
        dealer_id=data.get("dealer_id"),
        dealer_name=data.get("dealer_name"),
        commodity=data.get("commodity"),
        qty_quintals=data.get("qty_quintals"),
        price_per_quintal=data.get("price_per_quintal")
    )
    return {"deal": deal, "next_step": "confirm"}

@router.post("/mandi/trade/{deal_id}/confirm")
def handle_confirm_trade(deal_id: str):
    """Confirms a pending trade - moves from Pending to Confirmed status."""
    deal = confirm_trade(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"deal": deal, "next_step": "payment"}

@router.post("/mandi/trade/{deal_id}/payment")
def handle_record_payment(deal_id: str, data: dict = None):
    """Records payment for a trade - moves from Confirmed to Paid status."""
    payment_method = data.get("payment_method") if data else "UPI"
    transaction_id = data.get("transaction_id") if data else None
    deal = record_payment(deal_id, payment_method, transaction_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"deal": deal, "next_step": "complete"}

@router.post("/mandi/trade/{deal_id}/complete")
def handle_complete_trade(deal_id: str):
    """Completes a paid trade - moves from Paid to Completed status."""
    deal = complete_trade(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"deal": deal, "bill_url": f"/market/bill/{deal_id}"}
