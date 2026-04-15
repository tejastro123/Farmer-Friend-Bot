import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from backend.api.auth import get_current_user
from backend.services.dataset import get_moat_stats, DATASET_FILE

logger = logging.getLogger(__name__)
router = APIRouter(tags=["AI Moat"])

@router.get("/moat/stats")
def handle_get_moat_stats(current_user: dict = Depends(get_current_user)):
    """Fetch statistics about the proprietary dataset."""
    try:
        stats = get_moat_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to fetch moat stats: {e}")
        raise HTTPException(status_code=500, detail="Stats engine failure.")

@router.get("/moat/export")
def handle_export_dataset(current_user: dict = Depends(get_current_user)):
    """Download the full proprietary gold dataset (JSONL)."""
    import os
    if not os.path.exists(DATASET_FILE):
        raise HTTPException(status_code=404, detail="Dataset not yet initialized. Collect more feedback first.")
    
    return FileResponse(
        DATASET_FILE,
        media_type="application/x-jsonlines",
        filename=f"farmer_mitra_gold_dataset_{current_user.get('id', 'anon')}.jsonl"
    )
