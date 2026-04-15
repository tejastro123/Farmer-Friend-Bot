import random
import logging
from prefect import flow, task
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

@task
def ingest_satellite_ndvi():
    """Simulates NDVI crop health data ingestion."""
    districts = ["Medak", "Sangareddy", "Bhatinda", "Ahmednagar"]
    stats = []
    for d in districts:
        stats.append({"district": d, "ndvi_avg": round(random.uniform(0.3, 0.8), 2)})
    return stats

@task
def fetch_reservoir_levels():
    """Fetches water levels for major dams."""
    return [
        {"dam": "Nagarjuna Sagar", "current_level_ft": 510, "max_level_ft": 590},
        {"dam": "Bhakra", "current_level_ft": 1600, "max_level_ft": 1680}
    ]

@task
def fetch_agmarknet_trends():
    """Simulates market price trend scraping."""
    return [
        {"crop": "Cotton", "trend": "Stable", "rate": 7000},
        {"crop": "Turmeric", "trend": "Bullish", "rate": 14500}
    ]

@task
def sync_to_analytics(data, source):
    # This would normally push to a database or analytical store
    logger.info(f"Pipeline: Synced {len(data)} items from {source}")

@flow(name="Environment & Market Pipeline")
def env_market_flow():
    ndvi = ingest_satellite_ndvi()
    sync_to_analytics(ndvi, "Satellite NDVI")
    
    reservoirs = fetch_reservoir_levels()
    sync_to_analytics(reservoirs, "Water Levels")
    
    market = fetch_agmarknet_trends()
    sync_to_analytics(market, "Agmarknet Trends")

if __name__ == "__main__":
    env_market_flow()
