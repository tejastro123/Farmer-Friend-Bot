import logging
from typing import List, Dict, Any, Optional
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

class RulesEngine:
    """Expert system logic for 'Safe Decisions' in agriculture."""
    
    def __init__(self):
        # Define 'Hard rules'
        self.rules = [
            {
                "id": "pesticide_safety",
                "trigger": ["spray", "pesticide", "insecticide", "chemical"],
                "condition": lambda context: context.get("stage") == "Flowering",
                "warning": "⚠️ SAFETY ALERT: Do not spray potent pesticides during the Flowering stage. It will harm pollinators like bees, reducing your final yield.",
                "action": "BLOCK_OR_WARN"
            },
            {
                "id": "urea_timing",
                "trigger": ["urea", "nitrogen", "fertilizer"],
                "condition": lambda context: context.get("stage") == "Final Harvest Prep",
                "warning": "⚠️ RESOURCE WASTE: Applying Urea right before harvest is inefficient as the plant stops nitrogen uptake. Focus on maturity management instead.",
                "action": "WARN"
            },
            {
                "id": "water_logging",
                "trigger": ["irrigation", "watering", "flood"],
                "condition": lambda context: context.get("soil_type") == "Clay Soil" and "Heavy Rain" in context.get("weather", ""),
                "warning": "⚠️ CROP RISK: Heavy rain is forecast and you have Clay soil (high water retention). Do NOT irrigate today to avoid root rot/waterlogging.",
                "action": "BLOCK"
            }
        ]

    def evaluate(self, query: str, context: dict) -> List[str]:
        triggered_warnings = []
        query_low = query.lower()
        
        for rule in self.rules:
            # Check if query mentions a trigger word
            if any(t in query_low for t in rule["trigger"]):
                # Check condition
                if rule["condition"](context):
                    triggered_warnings.append(rule["warning"])
                    
        return triggered_warnings

class HybridThinker:
    """Combines Rules, Graph, and LLM context into a single reasoning package."""
    
    def __init__(self):
        self.rules_engine = RulesEngine()
        self.kg = get_knowledge_graph()

    def get_reasoning_packet(self, query: str, context: dict) -> Dict[str, Any]:
        """
        Gathers Hard Intelligence (Rules + Graph) before LLM synthesis.
        """
        # 1. Rule Evaluation
        warnings = self.rules_engine.evaluate(query, context)
        
        # 2. Graph Traversal (Entities)
        # Extract potential entities (simple word matching for now)
        entities = []
        for word in query.replace("?", "").split():
            word_clean = word.strip().capitalize()
            if self.kg._graph.has_node(word_clean.lower()):
                entities.append(word_clean)
        
        graph_context = []
        for entity in entities:
            # Multi-hop relationships
            neighbors = self.kg.get_multi_hop_context(entity, hops=2)
            for n in neighbors:
                graph_context.append(f"{n['subject']} -> {n['predicate']} -> {n['object']}")
                
        # 3. Causal Explanations
        causal_chains = []
        for entity in entities:
            causal_chains.extend(self.kg.get_causal_chain(entity))

        return {
            "warnings": warnings,
            "graph_context": list(set(graph_context)),
            "causal_chains": list(set(causal_chains)),
            "entities_found": entities
        }

# Singleton instance
_thinker = None
def get_hybrid_thinker() -> HybridThinker:
    global _thinker
    if _thinker is None:
        _thinker = HybridThinker()
    return _thinker
