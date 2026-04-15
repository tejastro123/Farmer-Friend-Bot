from fastapi import APIRouter, BackgroundTasks, HTTPException
import logging
from typing import List, Dict
from datetime import datetime

# Import real Prefect flows
from backend.pipelines.mandi_flows import mandi_ingestion_flow
from backend.pipelines.weather_flows import weather_ingestion_flow
from backend.pipelines.expert_flows import expert_ingestion_flow

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Pipelines"])

# Track last run times in memory for the demo
LAST_RUNS = {}

PIPELINES = [
    {"id": "imd_weather", "name": "IMD Weather Ingestion", "status": "Healthy", "last_run": "Never", "records": 48},
    {"id": "mandi_prices", "name": "Agmarknet Price Trends", "status": "Healthy", "last_run": "Never", "records": 1250},
    {"id": "gov_schemes", "name": "Gov Scheme DBT Monitor", "status": "Healthy", "last_run": "Never", "records": 12},
    {"id": "pest_alerts", "name": "Pest Outbreak Monitor", "status": "Healthy", "last_run": "Never", "records": 5},
    {"id": "satellite_ndvi", "name": "Satellite NDVI Health", "status": "Healthy", "last_run": "Never", "records": 402},
    {"id": "fert_prices", "name": "Fertilizer Input Pricing", "status": "Healthy", "last_run": "Never", "records": 8},
    {"id": "sowing_prog", "name": "National Sowing Progress", "status": "Healthy", "last_run": "Never", "records": 34},
    {"id": "export_notif", "name": "APEDA Export Monitor", "status": "Healthy", "last_run": "Never", "records": 3},
    {"id": "water_res", "name": "Dam Water Level Check", "status": "Healthy", "last_run": "Never", "records": 15},
    {"id": "agri_news", "name": "Expert News Aggregator", "status": "Healthy", "last_run": "Never", "records": 21}
]

@router.get("/pipelines")
async def list_pipelines():
    """Returns status of all 10+ expert ingestion pipelines."""
    # Update last run times from memory
    for p in PIPELINES:
        if p["id"] in LAST_RUNS:
            p["last_run"] = LAST_RUNS[p["id"]]
    return PIPELINES

@router.post("/pipelines/{pipeline_id}/run")
async def trigger_pipeline(pipeline_id: str, background_tasks: BackgroundTasks):
    """Triggers a Prefect-backed ingestion flow in the background."""
    logger.info(f"Pipeline: Manually triggered {pipeline_id}")
    
    # Map ID to Flow
    flow_map = {
        "mandi_prices": mandi_ingestion_flow,
        "imd_weather": weather_ingestion_flow,
        "agri_news": expert_ingestion_flow,
        "gov_schemes": expert_ingestion_flow,
        "pest_alerts": expert_ingestion_flow,
    }

    selected_flow = flow_map.get(pipeline_id)
    if not selected_flow:
        # For demo purposes, we'll "simulate" success for others
        LAST_RUNS[pipeline_id] = datetime.now().strftime("%Y-%m-%d %H:%M")
        return {"status": "simulated", "pipeline_id": pipeline_id}

    # Execute flow in background
    background_tasks.add_task(selected_flow)
    LAST_RUNS[pipeline_id] = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    return {"status": "triggered", "pipeline_id": pipeline_id}
