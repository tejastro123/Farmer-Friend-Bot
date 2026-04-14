"""
backend/rag/embedder.py
=======================
Wraps sentence-transformers to produce dense vector embeddings.
Uses 'all-MiniLM-L6-v2' — fast, lightweight, great for semantic search.
Model is downloaded once and cached locally by the library.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # fixed for this model


@lru_cache(maxsize=1)
def _load_model() -> SentenceTransformer:
    """Load the model once and cache it for the process lifetime."""
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    return SentenceTransformer(MODEL_NAME)


class Embedder:
    """Thin wrapper around SentenceTransformer for batch/single embedding."""

    def __init__(self):
        self.model = _load_model()
        self.dim = EMBEDDING_DIM

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Embed a list of strings.
        Returns a float32 numpy array of shape (N, DIM).
        """
        if not texts:
            return np.empty((0, self.dim), dtype=np.float32)
        embeddings = self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query string. Returns shape (1, DIM)."""
        return self.embed_texts([query])
