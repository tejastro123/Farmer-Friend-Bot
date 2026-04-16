"""
backend/api/geocoding.py
======================
Geocoding endpoints for reverse geocoding.
"""

from fastapi import APIRouter
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

from backend.services.geocoding import geocoding_service


class ReverseGeocodeRequest(BaseModel):
    lat: float
    lon: float


@router.post("/reverse")
async def reverse_geocode(request: ReverseGeocodeRequest):
    """Get address from coordinates."""
    try:
        result = await geocoding_service.reverse_geocode(request.lat, request.lon)
        if result:
            formatted = geocoding_service.format_address(result)
            return {
                "success": True,
                "data": {
                    "display_name": result.get("display_name", ""),
                    "formatted": formatted,
                    "address": result.get("address", {}),
                    "lat": result.get("lat"),
                    "lon": result.get("lon"),
                }
            }
        return {"success": False, "error": "Could not resolve address"}
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return {"success": False, "error": str(e)}