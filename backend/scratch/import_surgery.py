
import sys
import os

modules = [
    "logging",
    "fastapi",
    "pydantic",
    "backend.config",
    "backend.db.session",
    "backend.db.db_utils",
    "backend.utils.auth_utils",
    "backend.api.health",
    "backend.api.auth",
    "backend.ml.models",
    "backend.services.predictions",
    "backend.agents.specialized",
    "backend.agents.reasoning",
    "backend.rag.knowledge_graph",
    "backend.rag.vector_store",
    "backend.rag.embedder",
    "backend.rag.retriever",
    "backend.agents.orchestrator",
    "backend.api.chat",
    "backend.api.ingest",
    "backend.api.graph",
    "backend.api.mandi",
    "backend.api.prediction",
    "backend.api.moat",
    "backend.api.pipelines",
    "backend.main"
]

print("--- IMPORT SURGERY ---")
for mod in modules:
    print(f"Importing {mod}...", end="", flush=True)
    try:
        __import__(mod)
        print(" OK")
    except Exception as e:
        print(f" FAILED: {e}")
print("--- ALL IMPORTS FINISHED ---")
