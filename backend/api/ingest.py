"""
backend/api/ingest.py
=====================
Endpoint for uploading and ingesting agriculture PDFs into the knowledge base.
"""

import logging
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Ingest"])

@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    """Upload a PDF file and ingest it into the vector store."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    from backend.api.chat import get_rag_components
    from backend.rag.ingestion import ingest_pdf
    
    # Needs the vector store to be loaded
    retriever = get_rag_components()

    logger.info(f"Receiving file for ingestion: {file.filename}")

    # Save to temporary file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Ingest
        num_chunks = ingest_pdf(tmp_path, retriever.store, retriever.embedder)
        
        # Cleanup
        os.unlink(tmp_path)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Successfully ingested {file.filename}",
                "chunks_added": num_chunks,
                "total_chunks_in_store": retriever.store.total_chunks
            }
        )
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
