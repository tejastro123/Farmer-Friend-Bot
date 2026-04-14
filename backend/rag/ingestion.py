"""
backend/rag/ingestion.py
========================
PDF and JSON ingestion pipeline.
  1. Load raw text from PDF (via pypdf) or JSON (pre-structured Q&A)
  2. Split into overlapping chunks (LangChain TextSplitter)
  3. Embed chunks (sentence-transformers)
  4. Add to vector store
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import List

from pypdf import PdfReader

from backend.rag.embedder import Embedder
from backend.rag.vector_store import Document, VectorStore
from backend.rag.graph_ingestor import get_graph_ingestor

logger = logging.getLogger(__name__)

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def _split_text(text: str) -> List[str]:
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + CHUNK_SIZE
        
        if end >= text_len:
            chunks.append(text[start:].strip())
            break
            
        # Try to break at a newline or period or space
        break_point = text.rfind("\n", start, end)
        if break_point == -1 or break_point <= start + CHUNK_OVERLAP:
            break_point = text.rfind(". ", start, end)
            
        if break_point == -1 or break_point <= start + CHUNK_OVERLAP:
            break_point = text.rfind(" ", start, end)
            
        if break_point == -1 or break_point <= start + CHUNK_OVERLAP:
            break_point = end # Hard break
            
        chunk = text[start:break_point].strip()
        if chunk:
            chunks.append(chunk)
            
        start = break_point - CHUNK_OVERLAP
        
    return chunks


# ── PDF ────────────────────────────────────────────────────────────────────

def ingest_pdf(pdf_path: str, store: VectorStore, embedder: Embedder) -> int:
    """
    Extract text from all pages of a PDF, chunk it, and add to vector store.
    Returns number of chunks added.
    """
    logger.info(f"Ingesting PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    filename = Path(pdf_path).name
    all_docs: List[Document] = []
    all_embeddings = []

    for page_num, page in enumerate(reader.pages, start=1):
        raw = page.extract_text() or ""
        if not raw.strip():
            continue
        chunks = _split_text(raw)
        docs = [
            Document(text=chunk, source=filename, chunk_id=i, page=page_num)
            for i, chunk in enumerate(chunks)
        ]
        embs = embedder.embed_texts([d.text for d in docs])
        all_docs.extend(docs)
        all_embeddings.append(embs)

    if not all_docs:
        logger.warning(f"No text extracted from {pdf_path}")
        return 0

    import numpy as np
    combined_embs = np.vstack(all_embeddings)
    store.add(combined_embs, all_docs)
    store.save()

    # Phase 9: Knowledge Graph Triplet Extraction
    try:
        ingestor = get_graph_ingestor()
        # We process a representative sample of chunks to avoid blowing up the Gemini quota, 
        # or process all if it's a small document.
        # For simplicity in this local project, we'll process all chunks.
        for doc in all_docs:
            ingestor.process_chunk(doc.text)
    except Exception as e:
        logger.warning(f"Failed to extract KG triplets: {e}")

    logger.info(f"PDF ingested: {len(all_docs)} chunks from {filename}")
    return len(all_docs)


# ── JSON (Seed Knowledge) ──────────────────────────────────────────────────

def ingest_json_knowledge(json_path: str, store: VectorStore, embedder: Embedder) -> int:
    """
    Load a JSON file with list of {question, answer, category, source} objects.
    Each Q&A pair is treated as a single chunk.
    Returns number of chunks added.
    """
    logger.info(f"Ingesting JSON knowledge: {json_path}")
    if not os.path.exists(json_path):
        logger.error(f"Seed file not found: {json_path}")
        return 0

    with open(json_path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    docs: List[Document] = []
    for idx, entry in enumerate(entries):
        q = entry.get("question", "")
        a = entry.get("answer", "")
        src = entry.get("source", "seed")
        combined = f"Q: {q}\nA: {a}"
        docs.append(Document(text=combined, source=src, chunk_id=idx))

    if not docs:
        return 0

    embs = embedder.embed_texts([d.text for d in docs])
    store.add(embs, docs)
    store.save()

    # Phase 9: Knowledge Graph Triplet Extraction
    try:
        ingestor = get_graph_ingestor()
        for doc in docs:
            ingestor.process_chunk(doc.text)
    except Exception as e:
        logger.warning(f"Failed to extract KG triplets: {e}")

    logger.info(f"JSON knowledge ingested: {len(docs)} Q&A pairs")
    return len(docs)
