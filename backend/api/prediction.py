import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from backend.config import settings
from backend.ml.models import get_ml_predictors

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prediction"])

class YieldPredictionRequest(BaseModel):
    crop: str
    soil_type: str
    area_acres: float
    avg_temp_c: float
    rainfall_mm: float

class YieldPredictionResponse(BaseModel):
    predict_tonnage: float
    explanation: str

class PestPredictionRequest(BaseModel):
    crop: str
    humidity_pct: float
    temp_c: float
    wind_speed_kph: float
    soil_moisture: float
    ndvi_index: float
    historical_pressure: float
    leaf_wetness_hrs: float
    last_24h_rainfall: float

class PestPredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    advisory: str

class IrrigationPredictionRequest(BaseModel):
    crop: str
    soil_moisture: float
    temp_c: float
    humidity_pct: float
    wind_speed_kph: float
    solar_intensity: float
    water_availability: float
    crop_age_days: int
    rainfall_forecast_mm: float
    soil_type_drying_const: float
    leaf_area_index: float
    water_source: str

class IrrigationPredictionResponse(BaseModel):
    irrigation_probability: float
    status: str
    recommendation: str

@router.post("/predict/yield", response_model=YieldPredictionResponse)
def handle_predict_yield(req: YieldPredictionRequest):
    logger.info(f"Received yield prediction request for crop: {req.crop}, area: {req.area_acres}")
    try:
        engine = get_ml_predictors()
        pred = engine.predict_yield(req.crop, req.soil_type, req.area_acres, req.avg_temp_c, req.rainfall_mm)
        
        if pred < 0:
            raise HTTPException(status_code=400, detail="Unable to predict yield. Ensure valid crop and soil values.")
            
        # Formulate prompt for the LLM to explain the yield
        explanation_prompt = f"""
You are an expert agricultural AI. An XGBoost model has predicted the expected crop yield based on the following input parameters:
- Crop: {req.crop}
- Soil Type: {req.soil_type}
- Area: {req.area_acres} acres
- Expected Avg Temperature: {req.avg_temp_c} °C
- Expected Rainfall: {req.rainfall_mm} mm

The predicted yield is {pred:.2f} Metric Tons.

Provide a short, direct, 1-2 sentence explanation of WHY this yield is expected. Point out if the temperature or rainfall is particularly good, or relatively harsh, for this crop type.
Do NOT output any markdown formatting, headers, or lists. Just the plain text explanation.
"""
        # Call the LLM
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(model="gemini-flash-latest", contents=explanation_prompt)
        explanation = response.text.strip()
        
        return YieldPredictionResponse(
            predict_tonnage=pred,
            explanation=explanation
        )
    except Exception as e:
        logger.error(f"Yield prediction API failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/pest", response_model=PestPredictionResponse)
def handle_predict_pest(req: PestPredictionRequest):
    logger.info(f"Received pest forecasting request for crop: {req.crop}")
    try:
        engine = get_ml_predictors()
        prob = engine.predict_disease_risk(
            req.crop, req.humidity_pct, req.temp_c, req.wind_speed_kph,
            req.soil_moisture, req.ndvi_index, req.historical_pressure,
            req.leaf_wetness_hrs, req.last_24h_rainfall
        )
        
        if prob < 0:
            raise HTTPException(status_code=400, detail="Unable to predict pest risk.")
            
        danger = "CRITICAL" if prob > 75 else "HIGH" if prob > 50 else "MODERATE" if prob > 25 else "LOW"

        # Formulate advisory prompt
        advisory_prompt = f"""
You are an expert plant pathologist AI. A Random Forest model has predicted a {prob:.1f}% ({danger} RISK) of a pest/disease outbreak based on:
- Crop: {req.crop}
- Humidity: {req.humidity_pct}%
- Temp: {req.temp_c}°C
- Wind: {req.wind_speed_kph} km/h
- Soil Moisture: {req.soil_moisture}%
- NDVI (Health): {req.ndvi_index}
- Regional Pressure: {req.historical_pressure}
- Leaf Wetness: {req.leaf_wetness_hrs} hrs/day
- Last 24h Rain: {req.last_24h_rainfall} mm

Provide a 2-sentence expert advisory. 
Sentence 1: Explain the primary driver of this risk (e.g., fungal trigger or pest dispersal).
Sentence 2: Give one immediate action for the farmer.
Do NOT output markdown. Just plain text.
"""
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(model="gemini-flash-latest", contents=advisory_prompt)
        advisory = response.text.strip()
        
        return PestPredictionResponse(
            risk_score=prob,
            risk_level=danger,
            advisory=advisory
        )
    except Exception as e:
        logger.error(f"Pest prediction API failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/irrigation", response_model=IrrigationPredictionResponse)
def handle_predict_irrigation(req: IrrigationPredictionRequest):
    logger.info(f"Received irrigation optimization request for crop: {req.crop}")
    try:
        engine = get_ml_predictors()
        prob = engine.predict_irrigation_need(
            req.crop, req.soil_moisture, req.temp_c, req.humidity_pct,
            req.wind_speed_kph, req.solar_intensity, req.water_availability,
            req.crop_age_days, req.rainfall_forecast_mm, req.soil_type_drying_const,
            req.leaf_area_index, req.water_source
        )
        
        if prob < 0:
            raise HTTPException(status_code=400, detail="Unable to predict irrigation need.")
            
        status = "CRITICAL" if prob > 75 else "URGENT" if prob > 50 else "MODERATE" if prob > 25 else "OPTIMAL"

        # Formulate recommendation prompt
        rec_prompt = f"""
You are an expert Smart Irrigation AI. A Random Forest model has predicted a {prob:.1f}% ({status}) probability that the field needs irrigation based on:
- Crop: {req.crop} (Age: {req.crop_age_days} days)
- Soil Moisture: {req.soil_moisture}%
- Weather: Temp {req.temp_c}°C, Humidity {req.humidity_pct}%, Wind {req.wind_speed_kph} km/h
- Water Stock: {(req.water_availability*100):.0f}% capacity
- Rainfall Forecast: {req.rainfall_forecast_mm} mm
- Water Source: {req.water_source.upper()}

Provide a precise irrigation recommendation.
Sentence 1: Tell the farmer exactly WHEN to irrigate (e.g. "Irrigate tomorrow evening" or "No irrigation needed").
Sentence 2: Explain the reasoning based on the environmental data AND the source type constraints (Canal has latency, Tubewell has high electricity cost, Pond has limited quantity).
Do NOT output markdown. Just plain text.
"""
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(model="gemini-flash-latest", contents=rec_prompt)
        recommendation = response.text.strip()
        
        return IrrigationPredictionResponse(
            irrigation_probability=prob,
            status=status,
            recommendation=recommendation
        )
    except Exception as e:
        logger.error(f"Irrigation prediction API failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
