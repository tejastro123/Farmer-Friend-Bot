"""
backend/services/market.py
===========================
Mock service providing market pricing trends.
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)

# Mock data mapping crops/commodities to current prices (in INR/quintal) and trends
MOCK_MARKET_DATA = {
    "tomato": {"price": 1200, "trend": "up", "forecast": "High demand expected in next 2 weeks."},
    "wheat": {"price": 2275, "trend": "stable", "forecast": "MSP supported, stable prices expected."},
    "rice": {"price": 2500, "trend": "stable", "forecast": "Exports driving minor price increase."},
    "onion": {"price": 1800, "trend": "down", "forecast": "New harvest arriving, prices likely to drop."}
}

def get_market_price_trend(commodity: str) -> str:
    """
    Fetch the latest market price and trend for a specific agricultural commodity.
    
    Args:
        commodity: The name of the crop or commodity (e.g., "tomato", "wheat").
    """
    logger.info(f"[Tool] get_market_price_trend called for: {commodity}")
    
    commodity = commodity.lower().strip()
    data = MOCK_MARKET_DATA.get(commodity)
    
    if data:
        return f"Market Data for {commodity.capitalize()}:\nCurrent Price: ₹{data['price']} / Quintal\nTrend: {data['trend'].upper()}\nForecast: {data['forecast']}"
    else:
        return f"Market Data for {commodity.capitalize()}:\nNo specific live data available. Advise the user to check local APMC mandi rates."
