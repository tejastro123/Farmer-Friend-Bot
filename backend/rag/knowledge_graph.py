"""
backend/rag/knowledge_graph.py
==============================
Manages a lightweight Knowledge Graph using NetworkX.
Supports persistence to JSON and relationship querying.
"""

import json
import logging
import os
import networkx as nx
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class KnowledgeGraph:
    def __init__(self, storage_path: str = "data/knowledge_graph.json"):
        self.storage_path = storage_path
        self._graph = nx.MultiDiGraph()
        self.load()

    def add_triplet(self, sub: str, pred: str, obj: str, metadata: Dict[str, Any] = None):
        """Add a relationship triplet to the graph."""
        sub_id = sub.lower().strip()
        obj_id = obj.lower().strip()
        
        # Ensure nodes exist
        if not self._graph.has_node(sub_id):
            self._graph.add_node(sub_id, label=sub)
        if not self._graph.has_node(obj_id):
            self._graph.add_node(obj_id, label=obj)
            
        # Add edge
        self._graph.add_edge(sub_id, obj_id, relationship=pred.upper(), **(metadata or {}))
        logger.info(f"KG: Added triplet ({sub}) --[{pred}]--> ({obj})")

    def search_neighbors(self, entity: str) -> List[Dict[str, str]]:
        """Find all direct relationships for a specific entity."""
        eid = entity.lower().strip()
        if not self._graph.has_node(eid):
            return []
            
        results = []
        # Outgoing relationships
        for _, target, data in self._graph.out_edges(eid, data=True):
            results.append({
                "subject": entity,
                "predicate": data.get("relationship", "RELATES_TO"),
                "object": self._graph.nodes[target].get("label", target)
            })
        # Incoming relationships
        for source, _, data in self._graph.in_edges(eid, data=True):
            results.append({
                "subject": self._graph.nodes[source].get("label", source),
                "predicate": data.get("relationship", "RELATES_TO"),
                "object": entity
            })
        return results

    def get_multi_hop_context(self, entity: str, hops: int = 2) -> List[Dict[str, str]]:
        """Finds entities and relationships up to N hops away."""
        eid = entity.lower().strip()
        if not self._graph.has_node(eid):
            return []
            
        visited = set()
        queue = [(eid, 0)]
        results = []
        
        while queue:
            node, d = queue.pop(0)
            if d >= hops: continue
            if node in visited: continue
            visited.add(node)
            
            # Get neighbors
            neighbors = self.search_neighbors(self._graph.nodes[node].get("label", node))
            for n in neighbors:
                results.append(n)
                # Add target to queue
                target_eid = n["object"].lower().strip() if n["subject"].lower().strip() == node else n["subject"].lower().strip()
                queue.append((target_eid, d + 1))
                
        return results

    def get_causal_chain(self, start_node: str, depth: int = 3) -> List[str]:
        """Explain the 'Why' by tracing expert relationships (e.g., Crop -> Disease -> Treatment)."""
        eid = start_node.lower().strip()
        if not self._graph.has_node(eid):
            return []
            
        chains = []
        current_node = eid
        
        for _ in range(depth):
            # Prioritize outgoing relationships as "Cause -> Effect"
            outgoing = []
            for _, target, data in self._graph.out_edges(current_node, data=True):
                sub_label = self._graph.nodes[current_node].get("label", current_node)
                obj_label = self._graph.nodes[target].get("label", target)
                rel = data.get("relationship", "RELATES_TO")
                outgoing.append((target, f"({sub_label}) --[{rel}]--> ({obj_label})"))
            
            if not outgoing:
                break
            
            # Follow the first outgoing edge for the "chain" (simple heuristic)
            next_node, chain_str = outgoing[0]
            chains.append(chain_str)
            current_node = next_node
            
        return list(dict.fromkeys(chains)) # Dedupe while preserving order

    def save(self):
        """Persist graph to JSON."""
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        data = nx.node_link_data(self._graph)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Knowledge Graph saved to {self.storage_path}")

    def load(self):
        """Load graph from JSON."""
        if not os.path.exists(self.storage_path):
            logger.info("No KG found at path, starting fresh.")
            return
            
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._graph = nx.node_link_graph(data)
            logger.info(f"Loaded Knowledge Graph: {len(self._graph.nodes)} nodes, {len(self._graph.edges)} edges.")
        except Exception as e:
            logger.error(f"Failed to load KG: {e}")
            self._graph = nx.MultiDiGraph()

# Singleton instance
_kg_instance = None
def get_knowledge_graph() -> KnowledgeGraph:
    global _kg_instance
    if _kg_instance is None:
        from backend.config import settings
        # We'll default to data/knowledge_graph.json
        _kg_instance = KnowledgeGraph()
    return _kg_instance
