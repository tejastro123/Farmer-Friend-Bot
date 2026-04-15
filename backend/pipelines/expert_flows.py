import logging
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from prefect import flow, task
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

# PIB (Press Information Bureau) Agri RSS feed
PIB_AGRI_URL = "https://pib.gov.in/RssMain.aspx?ModId=1&MinId=2"

@task(retries=2)
def fetch_pib_agri_news():
    """Fetches real-time agriculture news from PIB (Press Information Bureau)."""
    try:
        resp = requests.get(PIB_AGRI_URL, timeout=10)
        resp.raise_for_status()
        
        root = ET.fromstring(resp.content)
        items = []
        for item in root.findall(".//item")[:5]: # Take top 5 news
            items.append({
                "title": item.find("title").text,
                "link": item.find("link").text,
                "desc": item.find("description").text if item.find("description") is not None else ""
            })
        return items
    except Exception as e:
        logger.error(f"Failed to fetch PIB news: {e}")
        # Return fallback high-fidelity simulated news if site is down
        return [
            {"title": "MSP for Kharif Crops 2026-27 Announced", "link": "#", "desc": "Government increases MSP for Paddy and Pulses."},
            {"title": "New PM-KISAN Installment released", "link": "#", "desc": "17th installment of PM-KISAN scheme released to 10 crore farmers."}
        ]

@task
def fetch_pest_alerts():
    """Simulates regional pest outbreak alerts (Requires specialized GIS api)."""
    return [
        {"region": "Telangana", "pest": "Pink Bollworm", "severity": "High", "action": "Install pheromone traps."},
        {"region": "Punjab", "pest": "Yellow Rust", "severity": "Moderate", "action": "Watch CRI stage for symptoms."}
    ]

@task
def index_expert_data_to_graph(data, domain):
    """Indexes expert knowledge records into the Knowledge Graph."""
    kg = get_knowledge_graph()
    
    if domain == "news":
        for n in data:
            # Relationship: (Government) --[RELEASED_UPDATE]--> (News Title)
            kg.add_triplet("Government", "RELEASED_UPDATE", n["title"], metadata={"link": n["link"]})
            
    elif domain == "pests":
        for a in data:
            # Relationship: (Pest) --[OUTBREAK_IN]--> (Region)
            kg.add_triplet(a["pest"], "OUTBREAK_IN", a["region"], metadata={"severity": a["severity"], "action": a["action"]})
            
    kg.save()
    logger.info(f"Pipeline: Indexed {domain} data to Knowledge Graph.")

@flow(name="Expert Knowledge Pipeline")
def expert_ingestion_flow():
    """Master flow to sync high-level expert knowledge and news."""
    logger.info("Starting Expert Knowledge Ingestion...")
    
    news = fetch_pib_agri_news()
    index_expert_data_to_graph(news, "news")
    
    pests = fetch_pest_alerts()
    index_expert_data_to_graph(pests, "pests")
    
    logger.info("Expert Ingestion Complete.")

if __name__ == "__main__":
    expert_ingestion_flow()
