# AGENTS.md

## Startup Sequence (Critical)

The backend requires a specific boot order:

1. `python scripts/seed_knowledge.py` — builds the FAISS index from `data/seed/agri_knowledge.json`. Run once before first start; run again after adding new seed data.
2. `uvicorn backend.main:app --reload` — starts FastAPI on port 8000.
3. `cd frontend && npm run dev` — starts Vite dev server on port 5173.

## Config Pattern

All backend config lives in `backend/config.py`. Import via:

```python
from backend.config import settings
```

**Never** use `os.environ` directly. The `settings` singleton wraps `pydantic-settings` and reads `.env`.

## Python 3.14 Protobuf Patch

`backend/main.py` and scripts include a protobuf compatibility patch at the top:

```python
sys.modules['google._upb._message'] = None
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
```

Keep this patch in any new backend entrypoints or scripts that use `google-genai`.

## Database

SQLite via raw `sqlite3` (not SQLAlchemy ORM). DB path: `krishimitra.db` (gitignored).

- Schema initialized in `backend/db/db_utils.py` via `init_db_raw()` called on app startup.
- All queries use raw SQL with `?` placeholders.
- JSON fields (agents_used, sources, citations, etc.) are serialized with `json.dumps`/`json.loads`.

## API Structure

All routers registered in `backend/main.py` with `prefix="/api"`:

```
chat, health, ingest, graph, mandi, auth, prediction,
moat, pipelines, farm, satellite, geocoding
```

Routers are exported from `backend/api/__init__.py`.

## CORS

CORS origins are hardcoded in `main.py` (lines 40-43) to `localhost:5173` variants. The `settings.origins_list` from config is logged but not used by the middleware. Update `main.py` directly if adding new frontend origins.

## RAG Pipeline

- Embedder: `backend/rag/embedder.py` — wraps `sentence-transformers` (`all-MiniLM-L6-v2`), outputs 384-dim vectors.
- Vector store: `backend/rag/vector_store.py` — FAISS index on disk at `data/faiss_index/` (gitignored).
- Flow: PDF/text → chunk → embed → FAISS → retrieve → Gemini → response.

## Frontend Commands

```bash
cd frontend
npm install
npm run dev      # Port 5173
npm run build
npm run lint      # ESLint (flat config in eslint.config.js)
```

No TypeScript, no TypeScript check script.

## Env Variables

| Variable | Purpose | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Chat LLM | Hardcoded default in config.py (security risk) |
| `WEATHER_API_KEY` | OpenWeatherMap | Optional |
| `MANDI_API_KEY` | Mandi pricing data | Optional |
| `APP_ENV` | dev/prod | Defaults to "development" |
| `BACKEND_PORT` | Server port | Defaults to 8000 |

## Security Notes

- API keys have hardcoded defaults in `backend/config.py:21-27` — do not commit real keys.
- `.env` and `*.db` are gitignored.
- JWT tokens stored in localStorage on frontend.
