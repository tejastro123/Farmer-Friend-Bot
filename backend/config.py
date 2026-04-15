"""
backend/config.py
=================
Centralised configuration loaded from .env via pydantic-settings.
Every module imports `settings` from here — never reads os.environ directly.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── LLM ──────────────────────────────────────────────────
    gemini_api_key: str = ""

    # ── External Data APIs ────────────────────────────────────
    weather_api_key: str = ""
    mandi_api_key: str = ""
    mandi_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070" 
    news_api_key: str = ""

    # ── App ───────────────────────────────────────────────────
    app_env: str = "development"
    backend_port: int = 8000

    # ── Paths ─────────────────────────────────────────────────
    faiss_index_path: str = "data/faiss_index"
    seed_data_path: str = "data/seed/agri_knowledge.json"
    uploads_path: str = "data/uploads"

    # ── CORS ─────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# Singleton for easy import everywhere
settings = get_settings()
