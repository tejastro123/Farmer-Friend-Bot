"""
backend/rag/vector_store.py
===========================
FAISS-based vector store with persistence.
Stores both the raw FAISS index and a parallel list of document metadata
(text, source, chunk_id) in a JSON sidecar file.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass
from typing import List, Optional

import faiss
import numpy as np

from backend.rag.embedder import EMBEDDING_DIM

logger = logging.getLogger(__name__)


@dataclass
class Document:
    """A single indexed chunk with its metadata."""
    text: str
    source: str           # filename or URL the chunk came from
    chunk_id: int
    page: Optional[int] = None

    @property
    def chunk_hash(self) -> str:
        import hashlib
        return hashlib.sha256(self.text.encode('utf-8')).hexdigest()


class VectorStore:
    """
    Flat L2 FAISS index with a parallel document list.
    Call save() to persist; call load() to restore from disk.
    """

    INDEX_FILENAME = "index.faiss"
    META_FILENAME = "meta.json"

    def __init__(self, index_dir: str):
        self.index_dir = index_dir
        os.makedirs(index_dir, exist_ok=True)
        self._index: faiss.IndexFlatL2 = faiss.IndexFlatL2(EMBEDDING_DIM)
        self._docs: List[Document] = []

    # ── Write ──────────────────────────────────────────────────────────────

    def add(self, embeddings: np.ndarray, documents: List[Document]) -> None:
        """Add pre-computed embeddings + matching Document list."""
        assert len(embeddings) == len(documents), "Embeddings and documents must match in length"
        if len(embeddings) == 0:
            return
        self._index.add(embeddings)
        self._docs.extend(documents)
        logger.info(f"Added {len(documents)} chunks. Total: {self._index.ntotal}")

    def save(self) -> None:
        """Persist index and metadata to disk."""
        faiss.write_index(self._index, os.path.join(self.index_dir, self.INDEX_FILENAME))
        meta_path = os.path.join(self.index_dir, self.META_FILENAME)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump([asdict(d) for d in self._docs], f, ensure_ascii=False, indent=2)
        logger.info(f"Vector store saved to {self.index_dir} ({self._index.ntotal} vectors)")

    # ── Read ───────────────────────────────────────────────────────────────

    def load(self) -> bool:
        """Try to load index from disk. Returns True if successful."""
        idx_path = os.path.join(self.index_dir, self.INDEX_FILENAME)
        meta_path = os.path.join(self.index_dir, self.META_FILENAME)
        if not (os.path.exists(idx_path) and os.path.exists(meta_path)):
            logger.info("No existing vector store found.")
            return False
        self._index = faiss.read_index(idx_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        self._docs = [Document(**d) for d in raw]
        logger.info(f"Loaded vector store: {self._index.ntotal} vectors from {self.index_dir}")
        return True

    # ── Query ──────────────────────────────────────────────────────────────

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Document]:
        """Return top-k most similar documents for a query embedding."""
        if self._index.ntotal == 0:
            logger.warning("Vector store is empty — no results.")
            return []
        top_k = min(top_k, self._index.ntotal)
        distances, indices = self._index.search(query_embedding, top_k)
        results: List[Document] = []
        for idx in indices[0]:
            if 0 <= idx < len(self._docs):
                results.append(self._docs[idx])
        return results

    @property
    def total_chunks(self) -> int:
        return self._index.ntotal
