import logging
from prefect import flow, task
from backend.services.weather import get_raw_weather_data
from backend.rag.knowledge_graph import get_knowledge_graph
from backend.config import settings

logger = logging.getLogger(__name__)

# Core regions for regional weather tracking
AGRI_HOTSPOTS = ["Pune", "Nashik", "Nagpur", "Hyderabad", "Ludhiana", "Patna"]

@task(retries=3, retry_delay_seconds=30)
def fetch_regional_weather(location: str):
    """Fetches raw weather data for a hotspot."""
    data = get_raw_weather_data(location)
    if isinstance(data, str):
        logger.error(f"Weather Fetch Error for {location}: {data}")
        return None
    return data

@task
def generate_agri_advisory(location: str, weather_data: dict):
    """
    Simulates an LLM-based agricultural advisory generation based on weather.
    In a real system, this would call the LLM agent.
    """
    if not weather_data:
        return None
    
    curr = weather_data["current"]
    temp = curr["main"]["temp"]
    humidity = curr["main"]["humidity"]
    desc = curr["weather"][0]["description"]
    
    advisory = f"Current conditions in {location}: {desc.capitalize()}, {temp}°C."
    
    if humidity > 80:
        advisory += " High humidity detected. High risk of fungal outbreaks (Mildew). Check crops immediately."
    elif temp > 35:
        advisory += " Extreme heat alert. Increase irrigation frequency for young crops."
    else:
        advisory += " Conditions are stable for ongoing cultivation activities."
        
    return advisory

@task
def index_weather_to_graph(location: str, advisory: str):
    """Indexes the weather advisory as a node in the Knowledge Graph."""
    if not advisory:
        return
        
    kg = get_knowledge_graph()
    
    # Node: Advisor Node linked to the location
    advisory_node = f"Weather Advisory ({location})"
    kg.add_triplet(location, "HAS_CURRENT_ADVISORY", advisory_node)
    kg.add_triplet(advisory_node, "TELLS_USER", advisory)
    
    kg.save()
    logger.info(f"Pipeline: Indexed weather advisory for {location}.")

@flow(name="Regional Weather Ingestion Flow")
def weather_ingestion_flow():
    """Master flow to sync weather-based insights for agri hotspots."""
    logger.info("Starting Regional Weather Ingestion...")
    
    for hotspot in AGRI_HOTSPOTS:
        data = fetch_regional_weather(hotspot)
        if data:
            advisory = generate_agri_advisory(hotspot, data)
            index_weather_to_graph(hotspot, advisory)
            
    logger.info("Weather Ingestion Complete.")

if __name__ == "__main__":
    weather_ingestion_flow()
