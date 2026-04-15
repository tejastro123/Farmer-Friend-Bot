"""
backend/api/graph.py
===================
Endpoint to fetch the raw Knowledge Graph data for visualization.
"""

import logging
import math
from fastapi import APIRouter
from backend.rag.knowledge_graph import get_knowledge_graph

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Graph"])

def compute_layout(nodes, links, width=900, height=600):
    """Compute simple radial layout for nodes."""
    n = len(nodes)
    if n == 0:
        return []
    
    center_x, center_y = width / 2, height / 2
    radius = min(width, height) / 2.5
    
    for i, node in enumerate(nodes):
        angle = (2 * math.pi * i) / n
        node['x'] = center_x + radius * math.cos(angle)
        node['y'] = center_y + radius * math.sin(angle)
    
    return nodes

@router.get("/graph")
async def get_graph_data():
    """Returns the KG nodes and links for frontend consumption."""
    kg = get_knowledge_graph()
    
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
    
    nodes = compute_layout(nodes, links)
        
    return {
        "nodes": nodes,
        "links": links
    }
