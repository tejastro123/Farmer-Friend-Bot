"""
backend/rag/graph_ingestor.py
==============================
Uses Gemini to extract entities and their relationships (triplets) 
from text chunks and updates the Knowledge Graph.
"""

import logging
import json
from google import genai
from typing import List, Dict

from backend.config import settings
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are an expert Agricultural Knowledge Engineer.
Your task is to extract relationships from the following agricultural text chunk.

Extract as triplets in the form: [Subject, Predicate, Object]

Rules:
1. Entities: Crop names, Diseases, Fertilizers, Weather conditions, Pests, Chemicals, Subsidies.
2. Predicates: SUFFER_FROM, TRIGGERED_BY, TREATED_BY, PREVENTED_BY, RECOMMENDED_FOR, PART_OF, INCREASES_RISK_OF.
3. Keep names concise (e.g., 'Tomato', not 'the tomato plants').
4. Return ONLY valid JSON as a list of lists.

Example Output:
[
  ["Tomato", "SUFFER_FROM", "Blight"],
  ["High Humidity", "TRIGGERED_BY", "Blight"],
  ["Blight", "TREATED_BY", "Copper Fungicide"]
]

Text Chunk:
{text}
"""

class GraphIngestor:
    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not set")
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.kg = get_knowledge_graph()

    def process_chunk(self, text: str):
        """Extract triplets from a text chunk and add to KG."""
        try:
            logger.info("KG: Extracting triplets from chunk...")
            prompt = EXTRACTION_PROMPT.format(text=text)
            response = self.client.models.generate_content(model="gemini-flash-latest", contents=prompt)
            
            # Extract JSON from response (handling potential markdown blocks)
            raw_text = response.text.strip()
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            triplets = json.loads(raw_text)
            
            for tri in triplets:
                if len(tri) == 3:
                    sub, pred, obj = tri
                    self.kg.add_triplet(sub, pred, obj, metadata={"source_chunk": text[:100]})
            
            # Save KG after processing
            self.kg.save()
            logger.info(f"KG: Successfully processed chunk and extracted {len(triplets)} triplets.")
            
        except Exception as e:
            logger.error(f"KG Extraction Error: {e}")

# Singleton
_ingestor_instance = None
def get_graph_ingestor() -> GraphIngestor:
    global _ingestor_instance
    if _ingestor_instance is None:
        _ingestor_instance = GraphIngestor()
    return _ingestor_instance
