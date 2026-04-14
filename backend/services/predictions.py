"""
backend/services/predictions.py
===============================
Exposes ML predictive capabilities as Gemini-callable functions.
"""
import logging
import datetime
from backend.ml.models import get_ml_predictors

logger = logging.getLogger(__name__)

def predict_crop_yield_tool(crop: str, soil_type: str, area_acres: float, avg_temp_c: float, rainfall_mm: float) -> str:
    """
    Predict the expected crop yield in metric tons using machine learning based on a farmer's profile.
    Call this tool ONLY when asked "What will my yield be?", "How much can I harvest?", etc.
    
    Args:
        crop: The name of the crop (e.g., "wheat", "rice", "tomato").
        soil_type: Type of soil (e.g., "black", "red", "alluvial").
        area_acres: Total farming area in acres (extracted from farmer profile).
        avg_temp_c: Average expected temperature in Celsius.
        rainfall_mm: Expected overall rainfall in mm.
    """
    logger.info(f"[Tool] predict_crop_yield_tool called for {crop} on {area_acres} acres.")
    try:
        engine = get_ml_predictors()
        pred = engine.predict_yield(crop, soil_type, area_acres, avg_temp_c, rainfall_mm)
        if pred < 0:
            return "Unable to predict yield. Ensure valid crop and soil values."
        return f"ML Yield Prediction for {crop.capitalize()} on {area_acres} acres of {soil_type} soil: {pred:.2f} Metric Tons."
    except Exception as e:
        return f"Prediction failed: {str(e)}"

def predict_disease_risk_tool(
    crop: str, 
    humidity_pct: float, 
    temp_c: float, 
    wind_speed_kph: float = 10.0, 
    soil_moisture: float = 40.0, 
    ndvi_index: float = 0.6, 
    historical_pressure: float = 0.2, 
    leaf_wetness_hrs: float = 4.0, 
    last_24h_rainfall: float = 5.0
) -> str:
    """
    Predict the probability of a pest or disease outbreak using historical weather mapping ML model.
    Call this tool when analyzing weather for risk, or if asked "Will pest attacks increase?"
    
    Args:
        crop: The name of the crop.
        humidity_pct: Current or forecasted relative humidity (%).
        temp_c: Current or forecasted temperature (°C).
        wind_speed_kph: Wind speed in km/h.
        soil_moisture: Soil moisture level (%).
        ndvi_index: Normalized Difference Vegetation Index (0.0 to 1.0).
        historical_pressure: Regional historical pest pressure (0.0 to 1.0).
        leaf_wetness_hrs: Hours per day of leaf wetness.
        last_24h_rainfall: Rainfall in the last 24 hours (mm).
    """
    logger.info(f"[Tool] predict_disease_risk_tool called for {crop} with multi-factor indicators.")
    try:
        engine = get_ml_predictors()
        prob = engine.predict_disease_risk(
            crop, humidity_pct, temp_c, wind_speed_kph, soil_moisture, 
            ndvi_index, historical_pressure, leaf_wetness_hrs, last_24h_rainfall
        )
        if prob < 0:
            return "Unable to predict disease risk."
            
        danger = "CRITICAL RISK" if prob > 75 else "HIGH RISK" if prob > 50 else "MODERATE RISK" if prob > 25 else "LOW RISK"
        return f"ML Disease Outbreak Forecast for {crop.capitalize()}: {prob:.1f}% ({danger}). Recommend preventive measures and scouting if risk is > 40%."
    except Exception as e:
        return f"Prediction failed: {str(e)}"

def forecast_market_price_tool(crop: str, forecast_months_ahead: int) -> str:
    """
    Forecast the future market price (INR per quintal) of a crop. 
    Call this when asked "Should I delay planting?", "What will prices be next month?", "Price trends".
    
    Args:
        crop: The name of the crop.
        forecast_months_ahead: How many months into the future to forecast (e.g., 0 for this month, 1 for next month).
    """
    logger.info(f"[Tool] forecast_market_price_tool called for {crop}.")
    try:
        engine = get_ml_predictors()
        
        current_month = datetime.datetime.now().month
        target_month = (current_month + forecast_months_ahead) % 12
        if target_month == 0: target_month = 12
        
        demand_index = 1.1 if forecast_months_ahead > 0 else 1.0 
        
        price = engine.forecast_price(crop, target_month, demand_index)
        if price < 0:
            return "Unable to forecast price."
            
        time_context = f"in {forecast_months_ahead} month(s)" if forecast_months_ahead > 0 else "currently"
        return f"ML Market Price Forecast for {crop.capitalize()} {time_context} (Month {target_month}): ₹{price:.2f} per Quintal."
    except Exception as e:
        return f"Prediction failed: {str(e)}"
