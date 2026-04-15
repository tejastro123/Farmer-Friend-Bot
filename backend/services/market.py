"""
backend/services/market.py
===========================
Agmarknet (data.gov.in) integration and fallback pricing services.
"""

import logging
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from backend.config import settings
from backend.db.db_utils import get_recent_prices

logger = logging.getLogger(__name__)

# Major agricultural states for national-scale sync
MAJOR_AGRI_STATES = [
    "Rajasthan", "Uttar Pradesh", "Maharashtra", "Madhya Pradesh", 
    "Gujarat", "Tamil Nadu", "Haryana", "Punjab", "Karnataka"
]

# Fallback simulation data
MOCK_MARKET_DATA = {
    "tomato": {"price": 1200, "trend": "up", "forecast": "High demand expected in next 2 weeks."},
    "wheat": {"price": 2275, "trend": "stable", "forecast": "MSP supported, stable prices expected."},
    "rice": {"price": 2500, "trend": "stable", "forecast": "Exports driving minor price increase."},
    "onion": {"price": 1800, "trend": "down", "forecast": "New harvest arriving, prices likely to drop."}
}

class AgmarknetClient:
    """Official OGD Data Portal (Agmarknet) API Client."""
    
    BASE_URL = "https://api.data.gov.in/resource"
    
    def __init__(self, api_key: str, resource_id: str):
        self.api_key = api_key
        self.resource_id = resource_id

    def get_latest_prices(self, commodity: str = None, state: str = None, limit: int = 10, offset: int = 0) -> List[Dict]:
        """
        Fetch the latest Mandi prices with optional filtering and pagination.
        """
        if not self.api_key:
            logger.debug("Mandi API key missing - skipping live fetch")
            return []

        params = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "offset": offset
        }
        
        # OGD uses filters[Field]=Value syntax
        if commodity:
            params["filters[commodity]"] = commodity.capitalize()
        if state:
            params["filters[state]"] = state.capitalize()

        try:
            url = f"{self.BASE_URL}/{self.resource_id}"
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("records", [])
        except Exception as e:
            logger.error(f"Agmarknet API Error: {e}")
            return []

    def fetch_national_records(self, commodity: str, limit_per_state: int = 50) -> List[Dict]:
        """
        Orchestrates an all-India fetch by iterating through major agricultural states.
        """
        all_records = []
        for state in MAJOR_AGRI_STATES:
            logger.info(f"Market Service: Fetching national records for {commodity} in {state}")
            records = self.get_latest_prices(commodity=commodity, state=state, limit=limit_per_state)
            all_records.extend(records)
        return all_records

def get_market_price_trend(commodity: str, state: Optional[str] = None) -> str:
    """
    Fetch the latest market price and trend for a specific agricultural commodity.
    Tries real Agmarknet data first, then falls back to hi-fi simulation.
    """
    commodity_clean = commodity.lower().strip()
    
    # 1. Attempt Live Fetch
    if settings.mandi_api_key:
        client = AgmarknetClient(settings.mandi_api_key, settings.mandi_resource_id)
        records = client.get_latest_prices(commodity=commodity_clean, state=state)
        
        if records:
            # Aggregate modal prices from records
            prices = [float(r['modal_price']) for r in records if r.get('modal_price') and r.get('modal_price') != "0"]
            if prices:
                avg_price = sum(prices) / len(prices)
                latest_mandi = records[0].get('market', 'Regional Mandi')
                return (
                    f"Live Mandi Data for {commodity.capitalize()}:\n"
                    f"Current Average: ₹{avg_price:.2f} / Quintal\n"
                    f"Latest Entry ({latest_mandi}): ₹{records[0].get('modal_price')} (as of {records[0].get('arrival_date')})\n"
                    f"Source: Agmarknet (Verified)"
                )

    # 2. Fallback to Simulation
    data = MOCK_MARKET_DATA.get(commodity_clean)
    if data:
        return (
            f"Market Intelligence for {commodity.capitalize()}:\n"
            f"Current Price: ₹{data['price']} / Quintal\n"
            f"Trend: {data['trend'].upper()}\n"
            f"Forecast: {data['forecast']}\n"
            f"Note: This is simulated logic based on regional trends."
        )
    
    return f"Insights for {commodity.capitalize()} are currently limited. Check localized APMC notifications."

def get_historical_prices_v2(commodity: str, market: str, limit: int = 7) -> List[Dict]:
    """
    Retrieves historical prices for a specific market/commodity from the SQL database.
    Uses raw SQL to bypass SQLAlchemy compatibility issues.
    """
    return get_recent_prices(commodity, market, limit)
