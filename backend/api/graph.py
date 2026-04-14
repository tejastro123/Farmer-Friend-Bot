"""
backend/api/graph.py
====================
Endpoint to fetch the raw Knowledge Graph data for visualization.
"""

import logging
from fastapi import APIRouter
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Graph"])

@router.get("/graph")
async def get_graph_data():
    """Returns the KG nodes and links for frontend consumption."""
    kg = get_knowledge_graph()
    
    # We transform the NetworkX MultiDiGraph into a simple nodes/links format
    nodes = []
    links = []
    
    for node_id, data in kg._graph.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": data.get("label", node_id),
            "type": node_id.split(":")[0] if ":" in node_id else "entity"
        })
        
    for source, target, data in kg._graph.edges(data=True):
        links.append({
            "source": source,
            "target": target,
            "relationship": data.get("relationship", "RELATES_TO")
        })
        
    return {
        "nodes": nodes,
        "links": links
    }
