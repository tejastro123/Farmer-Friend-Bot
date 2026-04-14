"""
backend/services/hyperlocal.py
==============================
Contains structured agricultural logic for Indian soil types and regional patterns.
Used by agents to provide hyperlocal-specific advice based on pH, NPK, and agricultural zones.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Core Indian Soil Characteristics (Refined with pH and NPK)
SOIL_DATA = {
    "black": {
        "name": "Black Soil (Regur)",
        "ph_range": "7.2 - 8.5 (Alkaline)",
        "npk": {"N": "Low", "P": "Low", "K": "High"},
        "characteristics": "High clay content, extremely high moisture retention, rich in iron/calcium.",
        "irrigation_need": "Low to Moderate.",
        "fertilizer_focus": "Requires Nitrogen and Phosphorus supplements; naturally rich in Potash (K).",
        "best_crops": ["Cotton", "Sugarcane", "Soybean", "Gram"]
    },
    "red": {
        "name": "Red Soil",
        "ph_range": "5.5 - 7.5 (Neutral to Acidic)",
        "npk": {"N": "Low", "P": "Low", "K": "Medium"},
        "characteristics": "Porous, low moisture retention, acidic, rich in iron.",
        "irrigation_need": "High (water drains quickly).",
        "fertilizer_focus": "Needs lime to reduce acidity; needs NPK supplements.",
        "best_crops": ["Groundnut", "Millets", "Pulses", "Tobacco"]
    },
    "alluvial": {
        "name": "Alluvial Soil",
        "ph_range": "6.5 - 8.4 (Neutral to Slightly Alkaline)",
        "npk": {"N": "Low", "P": "Medium", "K": "High"},
        "characteristics": "Extremely fertile, light texture, rich in potash and lime.",
        "irrigation_need": "Moderate.",
        "fertilizer_focus": "Highly responsive to Nitrogen (Urea) and Phosphorus.",
        "best_crops": ["Rice", "Wheat", "Sugarcane", "Maize", "Oilseeds"]
    },
    "laterite": {
        "name": "Laterite Soil",
        "ph_range": "4.8 - 5.5 (Acidic)",
        "npk": {"N": "Low", "P": "Low", "K": "Low"},
        "characteristics": "Heavily leached, acidic, poor fertility without manuring.",
        "irrigation_need": "High.",
        "fertilizer_focus": "Requires heavy organice manure and balanced NPK application.",
        "best_crops": ["Tea", "Coffee", "Cashew", "Rubber", "Coconut"]
    },
    "arid": {
        "name": "Arid/Desert Soil",
        "ph_range": "7.8 - 9.0 (High Saline/Alkaline)",
        "npk": {"N": "Low", "P": "Medium", "K": "High"},
        "characteristics": "High salt content, very low humus and moisture.",
        "irrigation_need": "Extremely High (requires drip irrigation).",
        "fertilizer_focus": "Requires organic matter (humus) to balance salinity.",
        "best_crops": ["Bajra", "Pulses", "Guar"]
    }
}

# Regional Agricultural Zones (5 Zones)
REGIONAL_DATA = {
    "north": {
        "states": ["Punjab", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Uttarakhand"],
        "patterns": "Rice-Wheat cycle is dominant. High reliance on canal irrigation.",
        "sowing_window": "May-June (Kharif), Oct-Nov (Rabi)."
    },
    "west": {
        "states": ["Maharashtra", "Gujarat", "Rajasthan", "Goa"],
        "patterns": "Cotton, Sugarcane, and Oilseed focus. Reliance on monsoon and borewells.",
        "sowing_window": "June-July (monsoon onset)."
    },
    "south": {
        "states": ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala"],
        "patterns": "Rice, Spices, and Plantation crops. Multi-cropping is common.",
        "sowing_window": "Year-round due to tropical climate."
    },
    "east": {
        "states": ["West Bengal", "Bihar", "Odisha", "Jharkhand", "Assam"],
        "patterns": "Jute, Rice, and Tea. High rainfall and flood-prone reasoning.",
        "sowing_window": "April-May (Jute), June-July (Rice)."
    },
    "central": {
        "states": ["Madhya Pradesh", "Chhattisgarh"],
        "patterns": "Soybean and Pulse hub. Rainfed agriculture.",
        "sowing_window": "Late June onwards."
    }
}

def get_soil_context(soil_type: str) -> str:
    """Returns a structured description of soil properties for agent reasoning."""
    st = soil_type.lower().strip()
    data = SOIL_DATA.get(st)
    if not data:
        return f"Soil Type: {soil_type} (General Advice). Use standard NPK ratios."
    
    return (
        f"Soil Type Instance: {data['name']}\n"
        f"- pH Level: {data['ph_range']}\n"
        f"- Natural NPK Levels: N={data['npk']['N']}, P={data['npk']['P']}, K={data['npk']['K']}\n"
        f"- Properties: {data['characteristics']}\n"
        f"- Irrigation: {data['irrigation_need']}\n"
        f"- Fertilizer Strategy: {data['fertilizer_focus']}"
    )

def get_regional_context_by_state(state_name: str) -> str:
    """Maps a state to its agricultural zone logic for regional tailoring."""
    s = state_name.title().strip()
    for zone, data in REGIONAL_DATA.items():
        if s in data["states"]:
            return (
                f"Agricultural Zone: {zone.upper()} India\n"
                f"- Primary State: {s}\n"
                f"- Regional Pattern: {data['patterns']}\n"
                f"- Typical Sowing Times: {data['sowing_window']}"
            )
    return f"Regional Context: {state_name}. Provide general advice based on India-wide patterns."
