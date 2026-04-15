"""
backend/services/trading.py
===========================
Simulated marketplace service for matching farmers with aggregators and buyers.
Tracks "Virtual Listings" and "Price Alerts".
"""

import logging
import random
from typing import List, Dict, Optional
import time
from datetime import datetime

logger = logging.getLogger(__name__)

# Real-world Indian Aggregators / Buyers (Simulated with Regional Context)
SIMULATED_DEALERS = [
    {
        "id": "itc", 
        "name": "ITC e-Choupal (Pune)", 
        "location": "Pune Industrial Hub",
        "lat": 18.5204, "lon": 73.8567,
        "focus": ["Wheat", "Soybean", "Rice"], 
        "premium": 1.05,
        "rating": 4.8,
        "verified": True
    },
    {
        "id": "bb", 
        "name": "BigBasket Nashik", 
        "location": "Nashik Agri-Cluster",
        "lat": 19.9975, "lon": 73.7898,
        "focus": ["Tomato", "Onion", "Grapes"], 
        "premium": 1.15,
        "rating": 4.9,
        "verified": True
    },
    {
        "id": "rel", 
        "name": "Reliance Fresh Hub", 
        "location": "Mumbai Logistics Park",
        "lat": 19.0760, "lon": 72.8777,
        "focus": ["Rice", "Wheat", "Vegetables"], 
        "premium": 1.12,
        "rating": 4.7,
        "verified": True
    },
    {
        "id": "ninja", 
        "name": "Ninjacart (Nagpur)", 
        "location": "Nagpur Mandi Square",
        "lat": 21.1458, "lon": 79.0882,
        "focus": ["Orange", "Onion", "Potato"], 
        "premium": 1.10,
        "rating": 4.6,
        "verified": True
    },
    {
        "id": "vashi", 
        "name": "Vashi APMC Dealer", 
        "location": "Navi Mumbai Mandi",
        "lat": 19.0760, "lon": 73.0000,
        "focus": ["All Crops"], 
        "premium": 1.0,
        "rating": 4.5,
        "verified": True
    }
]

# In-memory storage for this session (Simulated persistence)
_state = {
    "listings": [
        {
            "id": "L-1712958400",
            "commodity": "Wheat",
            "weight": 1200,
            "price": 2350,
            "status": "Active",
            "timestamp": "Mon Apr 13 08:30:00 2026"
        }
    ],
    "alerts": [],
    "deals": [
        {
            "id": "DEAL-8892",
            "dealer": "ITC e-Choupal (Pune)",
            "dealer_id": "itc",
            "commodity": "Wheat",
            "qty_quintals": 45,
            "price_per_quintal": 2410,
            "total": 108450,
            "date": "2026-04-10",
            "status": "Pending",
            "bill_no": "KM-TRS-9901",
            "payment_status": "unpaid",
            "farmer_name": "Farmer",
            "created_at": "2026-04-10T10:00:00",
            "confirmed_at": None,
            "paid_at": None,
            "completed_at": None
        },
        {
            "id": "DEAL-8841",
            "dealer": "BigBasket Nashik",
            "dealer_id": "bb",
            "commodity": "Tomato",
            "qty_quintals": 12,
            "price_per_quintal": 1450,
            "total": 17400,
            "date": "2026-04-05",
            "status": "Completed",
            "bill_no": "KM-TRS-9752",
            "payment_status": "paid",
            "farmer_name": "Farmer",
            "created_at": "2026-04-05T10:00:00",
            "confirmed_at": "2026-04-05T10:30:00",
            "paid_at": "2026-04-05T11:00:00",
            "completed_at": "2026-04-05T14:00:00"
        }
    ]
}

def create_sale_listing(commodity: str, weight_kg: float, min_price_quintal: float) -> Dict:
    """Creates a virtual listing for a crop."""
    listing = {
        "id": f"L-{int(time.time())}",
        "commodity": commodity.capitalize(),
        "weight": weight_kg,
        "price": min_price_quintal,
        "status": "Active",
        "timestamp": time.ctime()
    }
    _state["listings"].append(listing)
    return listing

def get_mandi_summary(lat: Optional[float] = None, lon: Optional[float] = None) -> Dict:
    """Returns a full summary of listings, alerts, deals, prices, and dealers (proximity aware)."""
    from backend.services.market import MOCK_MARKET_DATA
    import math

    dealers = SIMULATED_DEALERS.copy()
    
    if lat is not None and lon is not None:
        # Calculate simulated distance and adjust premiums
        for d in dealers:
            dist = math.sqrt((d["lat"] - lat)**2 + (d["lon"] - lon)**2)
            d["distance_km"] = round(dist * 111, 1) # ~111km per deg
            # Slightly decrease premium based on distance (simulated logistics cost)
            d["premium"] = round(max(1.0, d.get("premium", 1.0) - (dist * 0.05)), 2)
        
        # Sort by distance
        dealers = sorted(dealers, key=lambda x: x.get("distance_km", 0))

    return {
        "prices": MOCK_MARKET_DATA,
        "dealers": dealers,
        "active_listings": _state["listings"],
        "active_alerts": _state["alerts"],
        "deals": _state["deals"],
        "location_context": {"lat": lat, "lon": lon} if lat else None
    }

def match_buyers_for_crop(commodity: str, weight_kg: float) -> List[Dict]:
    """Matches a specific crop quantity with simulated buyers and their premiums."""
    from backend.services.market import MOCK_MARKET_DATA
    base_price = MOCK_MARKET_DATA.get(commodity.lower(), {}).get("price", 2000)
    
    matches = []
    for dealer in SIMULATED_DEALERS:
        if commodity.capitalize() in dealer["focus"] or "All Crops" in dealer["focus"]:
            offer_price = int(base_price * dealer["premium"])
            matches.append({
                "dealer": dealer["name"],
                "offer_price_per_quintal": offer_price,
                "total_valuation": int((weight_kg / 100) * offer_price),
                "rating": dealer["rating"],
                "location": dealer["location"]
            })
    return sorted(matches, key=lambda x: x["offer_price_per_quintal"], reverse=True)

def set_market_alert(commodity: str, target_price: float, phone: str) -> Dict:
    """Sets a price alert for a specific crop."""
    alert = {
        "id": f"A-{int(time.time())}",
        "commodity": commodity.capitalize(),
        "target_price": target_price,
        "phone": phone,
        "timestamp": time.ctime()
    }
    _state["alerts"].append(alert)
    return alert

def get_deal_by_id(deal_id: str) -> Optional[Dict]:
    """Retrieves a single deal from the ledger by its ID."""
    for deal in _state["deals"]:
        if deal["id"] == deal_id:
            return deal
    return None

def initiate_trade(dealer_id: str, dealer_name: str, commodity: str, qty_quintals: int, price_per_quintal: float) -> Dict:
    """Creates a new trade/deal as Pending, ready for confirmation."""
    import random
    deal_id = f"DEAL-{random.randint(1000, 9999)}"
    now = datetime.now().isoformat()
    
    deal = {
        "id": deal_id,
        "dealer": dealer_name,
        "dealer_id": dealer_id,
        "commodity": commodity,
        "qty_quintals": qty_quintals,
        "price_per_quintal": price_per_quintal,
        "total": qty_quintals * price_per_quintal,
        "date": str(datetime.now().date()),
        "status": "Pending",
        "bill_no": f"KM-TRS-{random.randint(1000, 9999)}",
        "payment_status": "unpaid",
        "farmer_name": "Farmer",
        "created_at": now,
        "confirmed_at": None,
        "paid_at": None,
        "completed_at": None
    }
    
    _state["deals"].insert(0, deal)
    return deal

def confirm_trade(deal_id: str) -> Optional[Dict]:
    """Confirms a pending trade, marking it as ready for payment."""
    deal = get_deal_by_id(deal_id)
    if deal:
        deal["status"] = "Confirmed"
        deal["confirmed_at"] = datetime.now().isoformat()
    return deal

def record_payment(deal_id: str, payment_method: str = "UPI", transaction_id: str = None) -> Optional[Dict]:
    """Records payment for a trade and marks it as Paid."""
    deal = get_deal_by_id(deal_id)
    if deal and deal["status"] == "Confirmed":
        deal["payment_status"] = "paid"
        deal["status"] = "Paid"
        deal["paid_at"] = datetime.now().isoformat()
        deal["payment_method"] = payment_method
        deal["transaction_id"] = transaction_id or f"TXN-{random.randint(100000, 999999)}"
    return deal

def complete_trade(deal_id: str) -> Optional[Dict]:
    """Completes a paid trade, generating final bill."""
    deal = get_deal_by_id(deal_id)
    if deal and deal["payment_status"] == "paid":
        deal["status"] = "Completed"
        deal["completed_at"] = datetime.now().isoformat()
    return deal

def get_all_deals() -> List[Dict]:
    """Returns all deals from the ledger."""
    return _state["deals"]
