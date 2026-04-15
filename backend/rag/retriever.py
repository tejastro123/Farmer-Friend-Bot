"""
backend/rag/retriever.py
========================
High-level retriever: takes a natural-language query,
embeds it, searches the vector store, returns ranked docs.
"""

from __future__ import annotations

import logging
import sqlite3
from typing import List

from backend.rag.embedder import Embedder
from backend.rag.vector_store import Document, VectorStore
from backend.db.session import DB_PATH

logger = logging.getLogger(__name__)


class Retriever:
    def __init__(self, store: VectorStore, embedder: Embedder, top_k: int = 5):
        self.store = store
        self.embedder = embedder
        self.top_k = top_k

    def retrieve(self, query: str) -> List[Document]:
        """
        Embed the query and return the top-K relevant documents.
        Applies a boost based on historical user feedback using raw SQL.
        """
        if self.store.total_chunks == 0:
            logger.warning("Knowledge base is empty — returning no context.")
            return []

        query_emb = self.embedder.embed_query(query)
        results = self.store.search(query_emb, top_k=self.top_k * 2) # Get more for re-ranking
        
        if not results:
            return []

        # Apply Feedback Boosting (Raw SQL)
        scored_results = []
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            for doc in results:
                h = doc.chunk_hash
                cursor.execute("SELECT helpful_count, unhelpful_count FROM chunk_feedback WHERE chunk_hash = ?", (h,))
                feedback = cursor.fetchone()
                
                boost = 1.0
                if feedback:
                    net_votes = feedback["helpful_count"] - feedback["unhelpful_count"]
                    if net_votes > 0:
                        boost += (min(net_votes, 100) / 100.0) * 0.5 # Max 50% boost
                    elif net_votes < 0:
                        boost -= (min(abs(net_votes), 100) / 100.0) * 0.3 # Max 30% penalty
                
                scored_results.append((doc, boost))
            conn.close()
        except Exception as e:
            logger.error(f"Retriever: Feedback boosting error: {e}")
            # Fallback to no boost
            return results[:self.top_k]
        
        # Sort by boost
        scored_results.sort(key=lambda x: x[1], reverse=True)
        
        final_docs = [x[0] for x in scored_results[:self.top_k]]
        logger.debug(f"Retrieved {len(final_docs)} chunks with feedback boosting.")
        return final_docs

    def format_context(self, docs: List[Document]) -> str:
        """Format retrieved documents into a single context string for the LLM."""
        if not docs:
            return "No relevant information found in the knowledge base."
        parts = []
        for i, doc in enumerate(docs, start=1):
            source_label = f"[Source: {doc.source}" + (f", Page {doc.page}" if doc.page else "") + "]"
            parts.append(f"--- Context {i} {source_label} ---\n{doc.text}")
        return "\n\n".join(parts)
