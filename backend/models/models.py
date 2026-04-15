"""
backend/models/models.py
========================
DEPRECATED: SQLAlchemy models are disabled for Python 3.14 stability.
All data access now uses raw SQL via backend.db.db_utils.
"""

# The following classes are kept as documentation of the schema only.
# They no longer inherit from Base to avoid SQLAlchemy initialization.

class User:
    """id, email, hashed_password, full_name, created_at"""
    pass

class FarmerProfile:
    """id, user_id, latitude, longitude, soil_role, farm_size, primary_crop, ..."""
    pass

class ChatSession:
    """id, user_id, title, created_at, updated_at"""
    pass

class ChatHistory:
    """id, session_id, user_id, query, answer, explanation, agents_used, sources, ..."""
    pass

class ChunkFeedback:
    """id, chunk_hash, helpful_count, unhelpful_count, last_updated"""
    pass

class MandiPrice:
    """id, state, district, market, commodity, variety, arrival_date, ..."""
    pass
