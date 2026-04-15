import random
import logging
from prefect import flow, task

logger = logging.getLogger(__name__)

@task
def fetch_imd_forecast():
    """Simulates fetching regional IMD weather advisories."""
    return [
        {"area": "North-West India", "alert": "Intense Heatwave next 48h", "impact": "Increase irrigation for wheat maturity."},
        {"area": "Konkan", "alert": "Early pre-monsoon showers", "impact": "Prepare pomegranate fields for drainage."}
    ]

@task
def fetch_apeda_notifications():
    """Simulates APEDA export duty and opportunity updates."""
    return [
        {"item": "Basmati Rice", "status": "Duty-Free", "destination": "EU"},
        {"item": "Mangoes", "status": "New protocol approved", "destination": "USA"}
    ]

@task
def fetch_sowing_progress():
    """Simulates national-level sowing acreage statistics."""
    return {"Kharif Rice": "+5% YoY", "Cotton": "-2.3% YoY", "Pulses": "+12% YoY"}

@task
def fetch_agri_news():
    """Scrapes/Fetches agricultural news for the ticker."""
    return [
        "Government extends subsidy on Solar Pumps.",
        "New high-yielding Mustard variety released by ICAR.",
        "Monsoon expected to hit Kerala coast by June 1st."
    ]

@flow(name="Aggregated Agri Feed")
def aggregated_feed_flow():
    weather = fetch_imd_forecast()
    exports = fetch_apeda_notifications()
    sowing = fetch_sowing_progress()
    news = fetch_agri_news()
    
    logger.info(f"Pipeline: Processed Weather, Exports, Sowing, and News feeds.")

if __name__ == "__main__":
    aggregated_feed_flow()
