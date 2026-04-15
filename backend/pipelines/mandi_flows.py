import logging
from typing import List, Dict
from datetime import datetime, timedelta
from prefect import flow, task
from backend.services.market import AgmarknetClient, MAJOR_AGRI_STATES
from backend.rag.knowledge_graph import get_knowledge_graph
from backend.config import settings
from backend.db.db_utils import upsert_mandi_price, get_latest_market_snapshot

logger = logging.getLogger(__name__)

# Strategic crops prioritized for national tracking
STRATEGIC_CROPS = ["Wheat", "Rice", "Tomato", "Onion", "Potato", "Cotton", "Soybean"]

@task(retries=2, retry_delay_seconds=30)
def fetch_national_mandi_data(crop: str):
    """Fetches Mandi records for a crop across all major agricultural states."""
    if not settings.mandi_api_key:
        logger.warning(f"Mandi API Key missing. Returning simulation data for {crop}.")
        return [{
            "state": "Maharashtra", "district": "Pune", "market": "Pune",
            "commodity": crop, "variety": "Local", "arrival_date": datetime.now().strftime("%d/%m/%Y"),
            "min_price": 2000.0, "max_price": 2500.0, "modal_price": float(2200 + (datetime.now().day % 10)*10)
        }]

    client = AgmarknetClient(settings.mandi_api_key, settings.mandi_resource_id)
    return client.fetch_national_records(commodity=crop)

@task
def persist_mandi_records(records: List[Dict]):
    """Persists pricing records to SQL storage using raw SQL (3.14 compatible)."""
    if not records:
        return
    
    success_count = 0
    for r in records:
        try:
            # Typecasting and basic validation
            min_p = float(r.get('min_price', 0))
            max_p = float(r.get('max_price', 0))
            modal_p = float(r.get('modal_price', 0))
            
            if modal_p <= 0: continue
            
            success = upsert_mandi_price(
                state=r.get('state'),
                district=r.get('district'),
                market=r.get('market'),
                commodity=r.get('commodity'),
                variety=r.get('variety'),
                arrival_date=r.get('arrival_date'),
                min_p=min_p,
                max_p=max_p,
                modal_p=modal_p
            )
            if success: success_count += 1
        except Exception as e:
            logger.debug(f"Skipping malformed record: {e}")
            
    logger.info(f"Pipeline: Persisted {success_count} national records to SQL storage.")

@task
def detect_market_trends():
    """Analyzes recent prices vs. history to find significant trends."""
    kg = get_knowledge_graph()
    trends_found = 0
    
    try:
        for crop in STRATEGIC_CROPS:
            # Get snapshot of latest price points
            snapshots = get_latest_market_snapshot(crop)
            
            # Simple heuristic: Group by market and find changes
            market_map = {}
            for s in snapshots:
                m = s['market']
                if m not in market_map: market_map[m] = []
                market_map[m].append(s['modal_price'])
            
            for market, prices in market_map.items():
                if len(prices) >= 2:
                    current, previous = prices[0], prices[1]
                    if previous > 0:
                        change = ((current - previous) / previous) * 100
                        if abs(change) >= 10:
                            direction = "SURGE" if change > 0 else "CRASH"
                            # Index as a Volatility Alert in Knowledge Graph
                            kg.add_triplet(crop, f"MARKET_{direction}", market, metadata={"change": f"{change:.1f}%", "price": f"₹{current}"})
                            trends_found += 1
        
        kg.save()
        logger.info(f"Pipeline: Detected {trends_found} significant market trends indexed to KG.")
    except Exception as e:
        logger.error(f"Trend Detection Error: {e}")

@flow(name="National Mandi and Trend Sync")
def mandi_ingestion_flow():
    """Master flow for all-India market orchestration."""
    logger.info("Starting National Mandi Ingestion...")
    
    for crop in STRATEGIC_CROPS:
        records = fetch_national_mandi_data(crop)
        persist_mandi_records(records)
        
    # Analyze trends after all data is in
    detect_market_trends()
    logger.info("National Mandi Sync Complete.")

if __name__ == "__main__":
    mandi_ingestion_flow()
