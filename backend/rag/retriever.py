"""
backend/rag/retriever.py
========================
High-level retriever: takes a natural-language query,
embeds it, searches the vector store, returns ranked docs.
"""

from __future__ import annotations

import logging
from typing import List

from backend.rag.embedder import Embedder
from backend.rag.vector_store import Document, VectorStore

logger = logging.getLogger(__name__)


class Retriever:
    def __init__(self, store: VectorStore, embedder: Embedder, top_k: int = 5):
        self.store = store
        self.embedder = embedder
        self.top_k = top_k

    def retrieve(self, query: str) -> List[Document]:
        """
        Embed the query and return the top-K relevant documents.
        Returns empty list if the knowledge base is empty.
        """
        if self.store.total_chunks == 0:
            logger.warning("Knowledge base is empty — returning no context.")
            return []

        query_emb = self.embedder.embed_query(query)
        results = self.store.search(query_emb, top_k=self.top_k)
        logger.debug(f"Retrieved {len(results)} chunks for query: '{query[:60]}...'")
        return results

    def format_context(self, docs: List[Document]) -> str:
        """Format retrieved documents into a single context string for the LLM."""
        if not docs:
            return "No relevant information found in the knowledge base."
        parts = []
        for i, doc in enumerate(docs, start=1):
            source_label = f"[Source: {doc.source}" + (f", Page {doc.page}" if doc.page else "") + "]"
            parts.append(f"--- Context {i} {source_label} ---\n{doc.text}")
        return "\n\n".join(parts)
