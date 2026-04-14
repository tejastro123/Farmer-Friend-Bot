"""
scripts/seed_knowledge.py
=========================
One-time script to populate the FAISS vector store with initial JSON seed data.
Run this before starting the backend.
"""

import sys
import os
import logging

# Patch for Python 3.14 Protobuf issue: force _CanImport to fail gracefully
sys.modules['google._upb._message'] = None 
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# Ensure backend module can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.rag.embedder import Embedder
from backend.rag.vector_store import VectorStore
from backend.rag.ingestion import ingest_json_knowledge
from backend.config import settings
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting seed knowledge ingestion...")
    
    embedder = Embedder()
    store = VectorStore(settings.faiss_index_path)

    # Use CLI argument if provided, otherwise default to settings
    json_path = sys.argv[1] if len(sys.argv) > 1 else settings.seed_data_path

    if not os.path.exists(json_path):
        logger.error(f"Cannot find seed file at {json_path}")
        return

    # To avoid appending duplicates if run multiple times, optionally delete old index here
    # but VectorStore load/add naturally appends. For safety on first run, we'll just add.

    chunks = ingest_json_knowledge(json_path, store, embedder)
    
    logger.info(f"Successfully ingested {chunks} seed questions.")
    logger.info(f"Vector store now has {store.total_chunks} chunks.")

if __name__ == "__main__":
    main()
