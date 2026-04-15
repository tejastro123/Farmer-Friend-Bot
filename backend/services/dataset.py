import os
import json
import logging
import sqlite3
from datetime import datetime
from google import genai
from backend.config import settings
from backend.db.session import DB_PATH

logger = logging.getLogger(__name__)

DATASET_DIR = os.path.join(os.getcwd(), "backend", "data", "moat")
DATASET_FILE = os.path.join(DATASET_DIR, "gold_dataset.jsonl")

def curate_interaction(message_id: int):
    """
    Transforms a helpful interaction into a structured training sample.
    Appends to the proprietary moat dataset using raw SQL.
    """
    try:
        os.makedirs(DATASET_DIR, exist_ok=True)
        
        # 1. Fetch the message using Raw SQL
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chat_history WHERE id = ?", (message_id,))
        msg = cursor.fetchone()
        conn.close()
        
        if not msg or msg["is_helpful"] != 1:
            logger.warning(f"Message {message_id} not found or not gold — skipping curation.")
            return

        # Parse meta_context
        meta = {}
        try:
            if msg["meta_context"]:
                meta = json.loads(msg["meta_context"])
        except: pass

        # 2. Derive Topic Tag using LLM
        topic = "General Agriculture"
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            tag_prompt = f"Categorize this agricultural query into ONE specific topic (e.g. Pest Management, Market Trends, Irrigation, Soil Health, Government Schemes). Query: {msg['query']}. Reply with ONLY the category name."
            resp = client.models.generate_content(model="gemini-flash-latest", contents=tag_prompt)
            topic = resp.text.strip().replace("*", "")
        except Exception as e:
            logger.error(f"Topic tagging failed for dataset: {e}")

        # 3. Format as Training Sample
        sample = {
            "id": msg["id"],
            "instruction": f"You are an expert AI agricultural advisor. Provide advice for the following query: {msg['query']}",
            "input": f"Location: {meta.get('location', 'Unknown')}, Crop: {meta.get('crop', 'Unknown')}",
            "output": msg["answer"],
            "metadata": {
                "topic": topic,
                "confidence": msg["confidence_score"],
                "agents": json.loads(msg["agents_used"] or "[]"),
                "curated_at": datetime.utcnow().isoformat()
            }
        }

        # 4. Append to JSONL
        with open(DATASET_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
            
        logger.info(f"Successfully curated message {message_id} into the AI Moat under topic: {topic}")
        return True
    except Exception as e:
        logger.error(f"Dataset curation failed: {e}")
        return False

def get_moat_stats():
    """
    Parses the JSONL dataset and returns statistics.
    """
    stats = {
        "total_samples": 0,
        "topics": {},
        "recent_samples": [],
        "file_size_kb": 0
    }
    
    if not os.path.exists(DATASET_FILE):
        return stats
        
    try:
        stats["file_size_kb"] = round(os.path.getsize(DATASET_FILE) / 1024, 2)
        with open(DATASET_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
            stats["total_samples"] = len(lines)
            
            # Parse for topics and recent items
            for line in lines[-50:]: 
                data = json.loads(line)
                t = data["metadata"]["topic"]
                stats["topics"][t] = stats["topics"].get(t, 0) + 1
            
            # Last 5 samples
            for line in lines[-5:]:
                data = json.loads(line)
                stats["recent_samples"].append({
                    "query": data["instruction"].replace("You are an expert AI agricultural advisor. Provide advice for the following query: ", ""),
                    "topic": data["metadata"]["topic"],
                    "timestamp": data["metadata"]["curated_at"]
                })
                
        return stats
    except Exception as e:
        logger.error(f"Failed to fetch moat stats: {e}")
        return stats
