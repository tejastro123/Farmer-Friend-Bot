"""
backend/services/geocoding.py
=====================
Reverse geocoding service using Nominatim (OpenStreetMap).
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class GeocodingService:
    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org"
        self.user_agent = "KrishiMitra/1.0"
    
    async def reverse_geocode(self, lat: float, lon: float) -> Optional[dict]:
        """Get address from coordinates using Nominatim."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/reverse",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "format": "json",
                        "addressdetails": 1,
                    },
                    headers={"User-Agent": self.user_agent}
                )
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        return {
                            "display_name": data.get("display_name", ""),
                            "address": data.get("address", {}),
                            "lat": lat,
                            "lon": lon,
                        }
        except Exception as e:
            logger.warning(f"Reverse geocode error: {e}")
        return None
    
    def format_address(self, address_data: dict) -> str:
        """Format address for display."""
        if not address_data:
            return ""
        
        addr = address_data.get("address", {})
        parts = []
        
        if addr.get("village"):
            parts.append(addr.get("village"))
        elif addr.get("town"):
            parts.append(addr.get("town"))
        elif addr.get("city"):
            parts.append(addr.get("city"))
        
        if addr.get("county"):
            parts.append(addr.get("county"))
        
        if addr.get("state"):
            parts.append(addr.get("state"))
        
        if parts:
            return ", ".join(parts)
        
        if address_data.get("display_name"):
            return address_data["display_name"].split(",")[0]
        
        return ""


geocoding_service = GeocodingService()