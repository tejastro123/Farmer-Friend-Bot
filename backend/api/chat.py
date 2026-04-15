"""
backend/api/chat.py
===================
Main chat endpoint for the Farmer AI.
Handles language detection, translation, RAG retrieval, weather fetching,
and LLM generation orchestration.
"""

import logging
import json
import sqlite3
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel

from backend.agents.orchestrator import OrchestratorAgent
from backend.rag.embedder import Embedder
from backend.rag.retriever import Retriever
from backend.rag.vector_store import VectorStore
from backend.services.weather import get_weather_forecast
from backend.services.market import get_market_price_trend
from backend.utils.language import (
    detect_language,
    translate_from_english,
    translate_to_english,
)
from backend.db.session import DB_PATH
from backend.db.db_utils import (
    create_chat_session, get_chat_sessions, get_session_messages, 
    save_chat_message, get_farmer_profile
)
from backend.api.auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chat"])

# ── Dependencies ─────────────────────────────────────────────────────────────

_orchestrator: Optional[OrchestratorAgent] = None
_vector_store: Optional[VectorStore] = None
_embedder: Optional[Embedder] = None
_retriever: Optional[Retriever] = None

def get_rag_components() -> Retriever:
    global _vector_store, _embedder, _retriever
    from backend.config import settings
    if _embedder is None:
        _embedder = Embedder()
    if _vector_store is None:
        _vector_store = VectorStore(settings.faiss_index_path)
        _vector_store.load() 
    if _retriever is None:
        _retriever = Retriever(store=_vector_store, embedder=_embedder)
    return _retriever

def get_agent() -> OrchestratorAgent:
    global _orchestrator
    if _orchestrator is None:
        from backend.config import settings
        if not settings.gemini_api_key:
             raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Bind the callables
        ret = get_rag_components()
        _orchestrator = OrchestratorAgent(
            retriever_callable=ret.retrieve,
            weather_callable=get_weather_forecast,
            market_callable=get_market_price_trend
        )
    return _orchestrator

# ── Schemas ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None
    location: Optional[str] = None
    preferred_language: Optional[str] = None
    images: Optional[List[str]] = None # List of Base64 data URIs
    attachments: Optional[List[dict]] = None # Placeholder for complex files
    profile: Optional[dict] = None # Farm profile constraints
    history: Optional[List[dict]] = None # Optional fallback history
    model: Optional[str] = "gemini-2.0-flash-exp" # Model selection

class SessionResponse(BaseModel):
    id: int
    title: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SessionRename(BaseModel):
    title: str

class SourceInfo(BaseModel):
    source: str
    page: Optional[int] = None
    text: str

class ChatResponse(BaseModel):
    id: Optional[int] = None
    answer: str
    explanation: Optional[str] = ""
    confidence_score: Optional[float] = 0.0
    sources: List[SourceInfo]
    citations: Optional[List[dict]] = []
    language: str
    agents_used: List[str]
    session_id: Optional[int] = None
    follow_up_questions: List[str] = []
    is_helpful: Optional[int] = None
    feedback_text: Optional[str] = None
    
    # New Learning Fields
    meta_context: Optional[dict] = {}
    latencies: Optional[dict] = {}
    document_ids: Optional[List[str]] = []

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def handle_chat_query(
    req: ChatRequest,
    agent: OrchestratorAgent = Depends(get_agent),
    current_user: Optional[dict] = Depends(get_current_user), 
):
    """Process a farmer's query with session persistence."""
    logger.info(f"Received query: '{req.query}' (session: {req.session_id})")

    # 1. Resolve Session (Raw SQL)
    session_id = req.session_id
    if current_user:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        if session_id:
            cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, current_user["id"]))
            row = cursor.fetchone()
            if not row: session_id = None
        
        if not session_id:
            title = " ".join(req.query.split()[:5]) + ("..." if len(req.query.split()) > 5 else "")
            session_id = create_chat_session(current_user["id"], title)
        conn.close()
    
    # 2. Reconstruct History from Session
    thread_history = []
    if session_id:
        msgs = get_session_messages(session_id)
        for m in msgs[-10:]:
            thread_history.append({"role": "user", "content": m["query"]})
            thread_history.append({"role": "assistant", "content": m["answer"]})

    target_lang = req.preferred_language or detect_language(req.query)
    query_en = req.query if target_lang == "en" else translate_to_english(req.query, target_lang)

    # 3. Fetch Recent Corrections (Learned Experience)
    corrections = []
    if current_user:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT query, feedback_text FROM chat_history 
            WHERE user_id = ? AND is_helpful = -1 AND feedback_text IS NOT NULL
            ORDER BY timestamp DESC LIMIT 5
        """, (current_user["id"],))
        rows = cursor.fetchall()
        for r in rows:
            corrections.append({"query": r["query"], "correction": r["feedback_text"]})
        conn.close()

    # 4. Agent Execution
    
    # Determine profile context
    user_profile = None
    if current_user:
        user_profile = get_farmer_profile(current_user["id"])
        
    agent_response = agent.generate(
        query=query_en,
        language=target_lang,
        location_context=req.location or "",
        image_data=req.images[0] if req.images else None,
        images=req.images,
        profile=req.profile or user_profile,
        history=thread_history or req.history,
        corrections=corrections,
        model=req.model
    )

    # 5. Persistent Save
    msg_id = None
    if current_user and session_id:
        try:
            meta_context = {
                "crop": req.profile.get("primary_crop") if req.profile else (user_profile["primary_crop"] if user_profile else "Unknown"),
                "location": req.location or (user_profile["location_name"] if user_profile else "Unknown"),
                "user_lang": target_lang,
                "client_source": "web_mvp"
            }
            
            save_chat_message(
                session_id=session_id,
                user_id=current_user["id"],
                query=req.query,
                answer=agent_response.answer,
                explanation=agent_response.explanation,
                confidence=agent_response.confidence_score,
                agents=agent_response.agents_used,
                sources=agent_response.sources,
                citations=agent_response.citations,
                meta=meta_context,
                doc_ids=agent_response.document_hashes or []
            )
            
            # Get latest msg ID for response
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM chat_history WHERE session_id = ? ORDER BY id DESC LIMIT 1", (session_id,))
            msg_id = cursor.fetchone()[0]
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to save message: {e}")

    # Normalize Citations to List[dict] for Pydantic
    processed_citations = []
    if agent_response.citations:
        for c in agent_response.citations:
            if isinstance(c, str):
                processed_citations.append({"text": c})
            elif isinstance(c, dict):
                processed_citations.append(c)

    return ChatResponse(
        id=msg_id,
        answer=agent_response.answer,
        explanation=agent_response.explanation,
        confidence_score=agent_response.confidence_score,
        sources=[SourceInfo(**s) for s in agent_response.sources],
        citations=processed_citations,
        language=target_lang,
        agents_used=agent_response.agents_used,
        session_id=session_id,
        follow_up_questions=getattr(agent_response, 'follow_up_questions', []) or []
    )

@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """List all chat sessions for the current user. Returns empty list if not authenticated."""
    if current_user is None:
        return []
    return get_chat_sessions(current_user["id"])

@router.get("/sessions/{session_id}/messages", response_model=List[ChatResponse])
def get_messages(session_id: int, current_user: dict = Depends(get_current_user)):
    """Retrieve full message history for a session."""
    # Auth Check
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, current_user["id"]))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    conn.close()
    
    msgs = get_session_messages(session_id)
    results = []
    for m in msgs:
        # Map sources consistently
        processed_sources = []
        for s in (m.get("sources") or []):
            if isinstance(s, dict) and 'text' in s:
                processed_sources.append(SourceInfo(**s))
        
        # Normalize citations
        processed_citations = []
        for c in (m.get("citations") or []):
            if isinstance(c, str): processed_citations.append({"text": c})
            elif isinstance(c, dict): processed_citations.append(c)

        results.append(
            ChatResponse(
                id=m["id"],
                answer=m["answer"],
                explanation=m["explanation"],
                confidence_score=m["confidence_score"],
                sources=processed_sources,
                citations=processed_citations,
                language=m.get("meta_context", {}).get("user_lang", "en"),
                agents_used=m.get("agents_used", []),
                session_id=m["session_id"],
                meta_context=m.get("meta_context"),
                latencies=m.get("latencies"),
                document_ids=m.get("document_ids")
            )
        )
    return results

class FeedbackRequest(BaseModel):
    is_helpful: int # 1 or -1
    feedback_text: Optional[str] = None

@router.post("/message/{message_id}/feedback")
def submit_feedback(
    message_id: int,
    req: FeedbackRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Submit 👍/👎 and optional correction for a specific message."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT document_ids FROM chat_history WHERE id = ? AND user_id = ?", (message_id, current_user["id"]))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Message not found")
    
    doc_ids_json = row[0]
    cursor.execute("UPDATE chat_history SET is_helpful = ?, feedback_text = ? WHERE id = ?", (req.is_helpful, req.feedback_text, message_id))
    
    # Update Chunk Feedback
    try:
        if doc_ids_json:
            doc_ids = json.loads(doc_ids_json)
            for chunk_h in doc_ids:
                cursor.execute("SELECT id FROM chunk_feedback WHERE chunk_hash = ?", (chunk_h,))
                if not cursor.fetchone():
                    cursor.execute("INSERT INTO chunk_feedback (chunk_hash) VALUES (?)", (chunk_h,))
                
                if req.is_helpful == 1:
                    cursor.execute("UPDATE chunk_feedback SET helpful_count = helpful_count + 1, last_updated = CURRENT_TIMESTAMP WHERE chunk_hash = ?", (chunk_h,))
                    # NEW: Propagate to AI Moat Dataset Builder (in background)
                    try:
                        from backend.services.dataset import curate_interaction
                        background_tasks.add_task(curate_interaction, message_id)
                    except Exception as e:
                        logger.warning(f"Could not add to moat: {e}")
                else:
                    cursor.execute("UPDATE chunk_feedback SET unhelpful_count = unhelpful_count + 1, last_updated = CURRENT_TIMESTAMP WHERE chunk_hash = ?", (chunk_h,))
    except Exception as e:
        logger.error(f"Feedback Logic Error: {e}")

    conn.commit()
    conn.close()
    return {"status": "success", "message_id": message_id}

@router.patch("/sessions/{session_id}", response_model=SessionResponse)
def rename_session(session_id: int, update: SessionRename, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, current_user["id"]))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    
    cursor.execute("UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (update.title, session_id))
    row = {"id": session_id, "title": update.title, "updated_at": datetime.now()}
    conn.commit()
    conn.close()
    return row

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, current_user["id"]))
    conn.commit()
    conn.close()
    return {"status": "deleted"}
