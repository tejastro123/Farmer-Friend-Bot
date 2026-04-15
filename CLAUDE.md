# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KrishiMitra AI - AI-powered assistant for Indian farmers with multilingual crop advice, weather-aware reasoning, RAG-powered chat, and government scheme guidance.

## Tech Stack

- **Frontend**: React 19 + Vite, React Router, Framer Motion, Lucide React icons
- **Backend**: FastAPI (Python)
- **Vector DB**: FAISS (CPU)
- **Embeddings**: Sentence-transformers (`all-MiniLM-L6-v2`)
- **LLM**: Google Gemini 1.5 Flash
- **Auth**: JWT with bcrypt
- **Database**: SQLite with SQLAlchemy 2.0

## Commands

### Backend
```bash
# Activate venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run backend
uvicorn backend.main:app --reload

# Seed knowledge base
python scripts/seed_knowledge.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

```
backend/
├── main.py              # FastAPI entry point, CORS, router registration
├── config.py            # pydantic-settings singleton (settings.GEMINI_API_KEY, etc.)
├── api/                 # API route handlers
│   ├── auth.py          # JWT auth endpoints
│   ├── chat.py          # RAG-powered chat
│   ├── ingest.py        # PDF/document ingestion
│   ├── mandi.py         # Market price APIs
│   ├── prediction.py    # Crop yield predictions
│   └── pipelines.py     # Weather, expert, mandi data pipelines
├── rag/                 # RAG pipeline
│   ├── embedder.py      # Sentence-transformers embedding
│   ├── ingestion.py     # PDF/text chunking & indexing
│   ├── retriever.py     # FAISS vector search
│   └── knowledge_graph.py
├── agents/              # AI agent logic
│   ├── orchestrator.py  # Main agent router
│   ├── reasoning.py     # Reasoning module
│   └── specialized.py   # Domain-specific agents
├── services/            # External integrations
│   ├── weather.py       # Weather API
│   ├── market.py        # Mandi pricing
│   ├── hyperlocal.py    # Localized advisory
│   └── predictions.py   # ML-based crop models
├── models/              # SQLAlchemy ORM + ML models
├── db/                  # Database utilities
└── utils/               # Auth, language detection, translation

frontend/src/
├── App.jsx              # React Router setup, navigation
├── pages/               # Page components (ChatPage, MarketPage, etc.)
└── services/api.js      # Axios API client
```

## Key Patterns

- **Settings**: All config via `backend/config.py` singleton; never use `os.environ` directly
- **API Structure**: Each route file exports a `router` mounted in `main.py`
- **RAG Flow**: PDF → chunk → embed (MiniLM) → FAISS → retrieve → Gemini → response
- **Auth**: JWT tokens stored in localStorage; `PrivateRoute` wrapper protects pages
- **Multilingual**: Language detection + translation via `langdetect` + `deep-translator`

## Environment Variables

Set in `.env` (see `.env.example`):
- `GEMINI_API_KEY` - Required for chat
- `WEATHER_API_KEY` - OpenWeatherMap for weather context
- `MANDI_API_KEY` - Government mandi pricing data
