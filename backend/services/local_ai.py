import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class LocalExpertEngine:
    """
    KrishiMitra Edge Engine: Provides intelligence when internet is unavailable.
    Uses Local RAG + Scikit-learn Classifier + Expert Heuristics.
    """
    
    def __init__(self, dataset_path: str = "backend/data/moat/gold_dataset.jsonl"):
        self.dataset_path = dataset_path
        self.embedder = None
        self.classifier = None
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._is_online = True
        
        # Load local models if dataset exists
        self.initialize_models()

    def initialize_models(self):
        """Trains a lightweight classifier on the proprietary gold dataset."""
        if not os.path.exists(self.dataset_path):
            logger.warning("Local AI: No gold dataset found. Local reasoning will be limited to basic RAG.")
            return

        try:
            # 1. Load Embedder (MiniLM is small and fast)
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
            
            # 2. Train Local Topic Classifier
            queries = []
            labels = []
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    queries.append(data["instruction"])
                    labels.append(data["metadata"]["topic"])
            
            if queries:
                X = self.vectorizer.fit_transform(queries)
                self.classifier = LogisticRegression(max_iter=1000)
                self.classifier.fit(X, labels)
                logger.info(f"Local AI: Trained decision engine on {len(queries)} gold samples.")
        except Exception as e:
            logger.error(f"Local AI initialization failed: {e}")

    def check_connectivity(self) -> bool:
        """Pings a reliable server to check for internet access."""
        try:
            requests.get("https://www.google.com", timeout=2)
            self._is_online = True
            return True
        except:
            self._is_online = False
            return False

    def predict_offline(self, query: str, context: dict) -> Dict[str, Any]:
        """
        Synthesizes an answer using local intelligence only.
        """
        if not self.classifier:
            return {"answer": "I am currently offline and my local knowledge base is initializing. Please check your connection.", "confidence": 0.0}

        # 1. Detect Topic
        X = self.vectorizer.transform([query])
        topic = self.classifier.predict(X)[0]
        
        # 2. Local Expert Synthesis (Mocking locally retrieved context for now)
        # In a full impl, this would query a local ChromaDB index
        advice_template = f" (Edge Intelligence Mode: Offline)\n\n"
        advice_template += f"Based on my local knowledge for **{topic}**:\n"
        
        if "pest" in topic.lower() or "disease" in query.lower():
            advice_template += "- Prioritize cultural controls: Remove infected plants immediately.\n"
            advice_template += "- Avoid chemical sprays if rain is expected (referencing local patterns).\n"
        elif "irrigation" in topic.lower() or "water" in query.lower():
            advice_template += "- Shift irrigation to early morning hours to prevent evaporation.\n"
            advice_template += "- Check soil moisture manually at 6-inch depth using the 'feel' test.\n"
        else:
            advice_template += f"- Focusing on {topic} fundamentals. Ensure your primary crop is monitored for nutrient stress.\n"

        return {
            "answer": advice_template,
            "topic": topic,
            "confidence": 0.75,
            "source": "KrishiMitra Local Expert Hub",
            "timestamp": datetime.utcnow().isoformat()
        }

# Singleton instance
_local_engine = None
def get_local_engine() -> LocalExpertEngine:
    global _local_engine
    if _local_engine is None:
        _local_engine = LocalExpertEngine()
    return _local_engine
