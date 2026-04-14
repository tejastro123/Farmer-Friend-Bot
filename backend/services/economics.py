"""
backend/services/economics.py
=============================
Service for calculating agricultural input costs, profits, and ROI based on Indian crop data.
Handles Variable (A2) and Comprehensive (C2) cost concepts with regional weightage.
"""

from typing import Dict, List, Optional

# Baseline costs per acre in INR (estimates based on CACP 2024-25 data)
BASE_CROP_COSTS = {
    "Rice": {
        "seeds": 1500,
        "fertilizer": 3500,
        "machinery": 4000,
        "pesticides": 2000,
        "labor_base": 12000,
        "irrigation_base": 2500,
        "land_rent_base": 15000, # Opportunity cost (C2)
        "msp": 2320 # per quintal
    },
    "Wheat": {
        "seeds": 2000,
        "fertilizer": 3000,
        "machinery": 3500,
        "pesticides": 1500,
        "labor_base": 10000,
        "irrigation_base": 3500,
        "land_rent_base": 18000,
        "msp": 2425
    },
    "Cotton": {
        "seeds": 1800,
        "fertilizer": 4000,
        "machinery": 3000,
        "pesticides": 5000,
        "labor_base": 15000,
        "irrigation_base": 2000,
        "land_rent_base": 12000,
        "msp": 7121
    },
    "Sugarcane": {
        "seeds": 6000,
        "fertilizer": 8000,
        "machinery": 5000,
        "pesticides": 2000,
        "labor_base": 25000,
        "irrigation_base": 10000,
        "land_rent_base": 20000,
        "msp": 340 # FRP per quintal
    }
}

# Zone multipliers for Labor and Irrigation (weightage factors)
ZONE_WEIGHTS = {
    "North": {"labor": 1.2, "irrigation": 0.8},  # Pan-India high labor costs, better canal systems
    "South": {"labor": 1.1, "irrigation": 1.2},  # Tank/Well irrigation costs
    "East":  {"labor": 0.8, "irrigation": 0.5},  # Abundant water, lower wage rates
    "West":  {"labor": 1.0, "irrigation": 1.3},  # Arid zone, expensive water
    "Central": {"labor": 0.9, "irrigation": 1.1}
}

def get_cost_analysis(crop: str, area_acres: float, zone: str = "Central") -> Dict:
    """
    Calculates detailed cost breakdown (A2 and C2) for a given crop and area.
    """
    if crop not in BASE_CROP_COSTS:
        return {"error": f"Economics data for '{crop}' not found."}
    
    base = BASE_CROP_COSTS[crop]
    z_mult = ZONE_WEIGHTS.get(zone, ZONE_WEIGHTS["Central"])
    
    # Calculate specific costs with weightage
    weighted_labor = base["labor_base"] * z_mult["labor"]
    weighted_irrigation = base["irrigation_base"] * z_mult["irrigation"]
    
    # Variable Costs (A2)
    a2_per_acre = (base["seeds"] + base["fertilizer"] + 
                   base["machinery"] + base["pesticides"] + 
                   weighted_labor + weighted_irrigation)
    
    # Comprehensive Costs (C2)
    c2_per_acre = a2_per_acre + base["land_rent_base"]
    
    return {
        "crop": crop,
        "area": area_acres,
        "zone": zone,
        "breakdown": {
            "seeds": base["seeds"] * area_acres,
            "fertilizer": base["fertilizer"] * area_acres,
            "pesticides": base["pesticides"] * area_acres,
            "machinery": base["machinery"] * area_acres,
            "labor": weighted_labor * area_acres,
            "irrigation": weighted_irrigation * area_acres,
            "land_rent": base["land_rent_base"] * area_acres
        },
        "total_variable_cost_a2": a2_per_acre * area_acres,
        "total_comprehensive_cost_c2": c2_per_acre * area_acres,
        "msp_per_quintal": base["msp"]
    }

def estimate_profit_and_roi(area: float, msp_per_quintal: float, total_variable_cost: float, total_comprehensive_cost: float, yield_per_acre: float) -> Dict:
    """
    Estimates profit and ROI based on input costs and expected yield.
    Args:
        area: Size of the farm in acres.
        msp_per_quintal: Market or Minimum Support Price per quintal.
        total_variable_cost: Total variable (A2) cost for the entire area.
        total_comprehensive_cost: Total comprehensive (C2) cost for the entire area.
        yield_per_acre: Expected yield in quintals per acre.
    """
    total_yield = yield_per_acre * area
    revenue = total_yield * msp_per_quintal
    
    profit_a2 = revenue - total_variable_cost
    profit_c2 = revenue - total_comprehensive_cost
    
    roi_a2 = (profit_a2 / total_variable_cost) * 100 if total_variable_cost > 0 else 0
    roi_c2 = (profit_c2 / total_comprehensive_cost) * 100 if total_comprehensive_cost > 0 else 0
    
    return {
        "expected_revenue": revenue,
        "profit_variable_a2": profit_a2,
        "profit_comprehensive_c2": profit_c2,
        "roi_a2_percent": round(roi_a2, 2),
        "roi_c2_percent": round(roi_c2, 2),
        "break_even_yield_per_acre": total_variable_cost / (area * msp_per_quintal) if area > 0 and msp_per_quintal > 0 else 0
    }
