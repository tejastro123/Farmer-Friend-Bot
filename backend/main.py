"""
backend/main.py
===============
FastAPI application entry point.
"""

# Patch for Python 3.14 Protobuf issue: force _CanImport to fail gracefully
import sys
import os
sys.modules['google._upb._message'] = None 
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.api import chat, health, ingest, graph, mandi, auth, prediction
from backend.config import settings
from backend.db.session import engine, Base
import backend.models.models as models

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Farmer Helper AI API",
    description="Backend for the KrishiMitra Farmer Assistant phase 1 MVP.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(mandi.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(prediction.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"Starting Farmer Helper in {settings.app_env} mode.")
    logger.info(f"Allowed CORS origins: {settings.origins_list}")
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY is not set. Chat endpoint will fail.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.backend_port, reload=True)
