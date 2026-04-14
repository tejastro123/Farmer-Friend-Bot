"""
backend/api/chat.py
===================
Main chat endpoint for the Farmer AI.
Handles language detection, translation, RAG retrieval, weather fetching,
and LLM generation orchestration.
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

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
from backend.db.session import get_db
from backend.models.models import ChatHistory, User, FarmerProfile, ChatSession
from backend.api.auth import get_current_user

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

class SessionResponse(BaseModel):
    id: int
    title: str
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionRename(BaseModel):
    title: str

class SourceInfo(BaseModel):
    source: str
    page: Optional[int] = None
    excerpt: str

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

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def handle_chat_query(
    req: ChatRequest,
    agent: OrchestratorAgent = Depends(get_agent),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user), 
):
    """Process a farmer's query with session persistence."""
    logger.info(f"Received query: '{req.query}' (session: {req.session_id})")

    # 1. Resolve Session
    session = None
    if current_user:
        if req.session_id:
            session = db.query(ChatSession).filter(ChatSession.id == req.session_id, ChatSession.user_id == current_user.id).first()
        
        if not session:
            # Create a new session if none provided or not found
            # Extract a title from the first query (first 5 words)
            title = " ".join(req.query.split()[:5]) + ("..." if len(req.query.split()) > 5 else "")
            session = ChatSession(user_id=current_user.id, title=title)
            db.add(session)
            db.commit()
            db.refresh(session)
    
    # 2. Reconstruct History from Session (if applicable)
    thread_history = []
    if session:
        # Get last 10 messages for context
        msgs = db.query(ChatHistory).filter(ChatHistory.session_id == session.id).order_by(ChatHistory.timestamp.asc()).all()
        for m in msgs:
            thread_history.append({"role": "user", "content": m.query})
            thread_history.append({"role": "assistant", "content": m.answer})

    target_lang = req.preferred_language or detect_language(req.query)
    query_en = req.query if target_lang == "en" else translate_to_english(req.query, target_lang)

    # 3b. Fetch Recent Corrections (Learned Experience)
    corrections = []
    if current_user:
        recent_bad_msgs = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id,
            ChatHistory.is_helpful == -1,
            ChatHistory.feedback_text != None
        ).order_by(ChatHistory.timestamp.desc()).limit(5).all()
        for m in recent_bad_msgs:
            corrections.append({"query": m.query, "correction": m.feedback_text})

    # 4. Agent Execution
    agent_response = agent.generate(
        query=query_en,
        language=target_lang,
        location_context=req.location or "",
        image_data=req.images[0] if req.images else None, # Migration compatibility
        images=req.images, # New multi-image support
        profile=req.profile or (current_user.profile.__dict__ if current_user and current_user.profile else None),
        history=thread_history or req.history,
        corrections=corrections,
        db=db
    )

    # 5. Persistent Save
    if current_user and session:
        try:
            # Capture 7+ Features for metadata learning loop
            meta_context = {
                "crop": req.profile.get("primary_crop") if req.profile else (current_user.profile.primary_crop if current_user and current_user.profile else "Unknown"),
                "location": req.location or (current_user.profile.location_name if current_user and current_user.profile else "Unknown"),
                "sowing_date": str(req.profile.get("sowing_date")) if req.profile else (str(current_user.profile.sowing_date) if current_user and current_user.profile else None),
                "soil_type": req.profile.get("soil_role") if req.profile else (current_user.profile.soil_role if current_user and current_user.profile else "Standard"),
                "farm_size": req.profile.get("farm_size") if req.profile else (current_user.profile.farm_size if current_user and current_user.profile else 0.0),
                "user_lang": target_lang,
                "client_source": "web_mvp"
            }

            new_msg = ChatHistory(
                session_id=session.id,
                user_id=current_user.id,
                query=req.query,
                answer=agent_response.answer,
                explanation=agent_response.explanation,
                confidence_score=agent_response.confidence_score,
                agents_used=agent_response.agents_used,
                sources=agent_response.sources,
                citations=agent_response.citations,
                document_ids=agent_response.document_hashes or [],
                meta_context=meta_context
            )
            session.updated_at = datetime.utcnow()
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            msg_id = new_msg.id
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            msg_id = None
    else:
        msg_id = None

    # Normalize Citations to List[dict] for Pydantic
    processed_citations = []
    if agent_response.citations:
        for c in agent_response.citations:
            if isinstance(c, str):
                processed_citations.append({"text": c})
            elif isinstance(c, dict):
                processed_citations.append(c)

    return ChatResponse(
        id=msg_id if current_user and session else None,
        answer=agent_response.answer,
        explanation=agent_response.explanation,
        confidence_score=agent_response.confidence_score,
        sources=[SourceInfo(**s) for s in agent_response.sources],
        citations=processed_citations,
        language=target_lang,
        agents_used=agent_response.agents_used,
        session_id=session.id if session else None,
        follow_up_questions=getattr(agent_response, 'follow_up_questions', []) or []
    )

@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all chat sessions for the current user."""
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()

@router.get("/sessions/{session_id}/messages", response_model=List[ChatResponse])
def get_session_messages(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full message history for a session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    msgs = db.query(ChatHistory).filter(ChatHistory.session_id == session.id).order_by(ChatHistory.timestamp.asc()).all()
    return [
        ChatResponse(
            id=m.id,
            answer=m.answer,
            explanation=m.explanation,
            confidence_score=m.confidence_score,
            sources=[SourceInfo(**s) for s in m.sources],
            citations=m.citations,
            language="en",
            agents_used=m.agents_used,
            session_id=session.id,
            follow_up_questions=[],
            is_helpful=m.is_helpful,
            feedback_text=m.feedback_text
        )
        for m in msgs
    ]

class FeedbackRequest(BaseModel):
    is_helpful: int # 1 or -1
    feedback_text: Optional[str] = None

@router.post("/message/{message_id}/feedback")
def submit_feedback(
    message_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit 👍/👎 and optional correction for a specific message."""
    msg = db.query(ChatHistory).filter(ChatHistory.id == message_id, ChatHistory.user_id == current_user.id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.is_helpful = req.is_helpful
    if req.feedback_text:
        msg.feedback_text = req.feedback_text
    
    db.commit()
    db.refresh(msg)
    
    # NEW: Global Chunk Feedback Learning Loop Update
    if msg.document_ids:
        from backend.models.models import ChunkFeedback
        for chunk_h in msg.document_ids:
            score = db.query(ChunkFeedback).filter(ChunkFeedback.chunk_hash == chunk_h).first()
            if not score:
                score = ChunkFeedback(chunk_hash=chunk_h)
                db.add(score)
            
            if req.is_helpful == 1:
                score.helpful_count += 1
            elif req.is_helpful == -1:
                score.unhelpful_count += 1
        db.commit()

    return {"status": "success", "message_id": message_id}

@router.patch("/sessions/{session_id}", response_model=SessionResponse)
def rename_session(session_id: int, update: SessionRename, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = update.title
    db.commit()
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "deleted"}
