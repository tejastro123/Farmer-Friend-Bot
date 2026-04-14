# 🌾 Farmer Helper AI Agent (Phase 1 MVP)

An AI-powered assistant for Indian farmers, offering multilingual crop advice, weather-aware reasoning, and government scheme guidance powered by a local RAG pipeline and Google Gemini.

## Features

- **RAG-Powered Chat**: Grounded Q&A against agricultural documents.
- **Multilingual UI**: Chat in English, Hindi, Marathi, and Telugu.
- **Dynamic Ingestion**: Upload government PDFs or pesticide manuals dynamically.
- **Weather Integration**: (Scaffolded for Phase 2) Connects location to weather API to contextualize advice.

## Tech Stack

- Frontend: **React + Vite** (Vanilla CSS for lightweight styling)
- Backend: **FastAPI (Python)**
- Vector DB: **FAISS (Local CPU)**
- Embeddings: **Sentence-transformers (`all-MiniLM-L6-v2`)**
- LLM: **Google Gemini 1.5 Flash**

## Quickstart

### 1. Backend Setup

```bash
# Create virtal env
python -m venv venv
# Activate on Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Add your **Google Gemini API Key** (Free tier from Google AI Studio).

### 3. Seed Knowledge Base

Run the seed script to ingest the initial agricultural Q&A into the FAISS database.

```bash
python scripts/seed_knowledge.py
```

### 4. Run Servers

**Backend:**

```bash
uvicorn backend.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!
