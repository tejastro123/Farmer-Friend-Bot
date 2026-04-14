"""
backend/services/weather.py
============================
OpenWeatherMap integration for weather-aware farming advice.
Returns a human-readable weather summary string for the LLM context.
"""

from __future__ import annotations

import logging
from typing import Optional

import requests

from backend.config import settings

logger = logging.getLogger(__name__)

OWM_BASE = "https://api.openweathermap.org/data/2.5"


def get_weather_forecast(location: str) -> str:
    """
    Fetch the current weather and upcoming 3-day forecast for a specific location.
    Call this tool ONLY when the user explicitly asks about weather conditions, 
    rain, temperature, or if forecasting is needed to determine the right time 
    for agricultural activities (e.g. "is it a good time to sow?").
    
    Args:
        location: The name of the city, district, or village in India (e.g., "Pune", "Nashik").
    """
    if not settings.weather_api_key:
        logger.debug("Weather API key not configured — skipping weather context")
        return "Weather API is not configured. Tell the user you cannot check the weather right now."

    try:
        # Current weather
        resp = requests.get(
            f"{OWM_BASE}/weather",
            params={
                "q": f"{location},IN",
                "appid": settings.weather_api_key,
                "units": "metric",
            },
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        temp = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        description = data["weather"][0]["description"].capitalize()
        wind_speed = data["wind"]["speed"]

        # 5-day forecast (3-hourly) — take the next 3 entries
        forecast_resp = requests.get(
            f"{OWM_BASE}/forecast",
            params={
                "q": f"{location},IN",
                "appid": settings.weather_api_key,
                "units": "metric",
                "cnt": 8,
            },
            timeout=5,
        )
        forecast_resp.raise_for_status()
        forecast_data = forecast_resp.json()

        forecast_lines = []
        for item in forecast_data["list"][:3]:
            dt_txt = item["dt_txt"]
            t = item["main"]["temp"]
            desc = item["weather"][0]["description"]
            rain = item.get("rain", {}).get("3h", 0)
            forecast_lines.append(f"  {dt_txt}: {t:.0f}°C, {desc}, Rain: {rain:.1f}mm")

        # Climate Interpreter for Agricultural Context
        warnings = []
        if humidity > 80:
            warnings.append("High Humidity (>80%): Increased risk for fungal diseases (e.g. Blight, Mildew). Consider fungicide sprays.")
        if temp > 35:
            warnings.append("High Temperature (>35°C): Heat stress risk for young crops. Increase irrigation frequency.")
        elif temp < 10:
            warnings.append("Low Temperature (<10°C): Risk of frost for sensitive crops (e.g., Potato, Tomato). Consider protective mulching.")
        
        summary = (
            f"Location: {location}, India\n"
            f"Current: {description}, {temp:.0f}°C, Humidity: {humidity}%, Wind: {wind_speed} m/s\n"
        )
        
        if warnings:
            summary += "\n[AGRICULTURAL WARNINGS]:\n" + "\n".join([f"- {w}" for w in warnings])
            
        summary += f"\nUpcoming forecast:\n" + "\n".join(forecast_lines)
        return summary

    except requests.exceptions.RequestException as e:
        logger.warning(f"Weather API request failed for '{location}': {e}")
        return f"Failed to fetch weather data for '{location}': {e}"
    except Exception as e:
        logger.warning(f"Unexpected error fetching weather: {e}")
        return f"Failed to fetch weather data internally: {e}"
