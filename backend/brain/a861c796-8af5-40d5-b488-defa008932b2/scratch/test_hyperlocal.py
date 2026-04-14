import sys
import os

# Patch for Python 3.14 Protobuf issue
sys.modules['google._upb._message'] = None 
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# Add the project root to sys.path
sys.path.append(os.getcwd())

from backend.agents.orchestrator import OrchestratorAgent
from backend.rag.retriever import Retriever # Just for typing or mock
from typing import List

# Mock components for testing
def mock_retriever(q): return [] # No RAG needed for this test
def mock_weather(l): return "Weather: 32°C, 88% Humidity. [AGRICULTURAL WARNINGS]: High Humidity - Risk for Fungal disease."
def mock_market(q): return "Market: Stable."

def test_hyperlocal_differential_advice():
    print("Testing Phase 10: Hyperlocal Intelligence...")
    
    agent = OrchestratorAgent(mock_retriever, mock_weather, mock_market)
    
    query = "Is it a good time to water my crops today?"
    
    # Farmer A: Punjab (North), Alluvial Soil
    print("\n--- FARMER A: Ludhiana, Punjab (North), Alluvial Soil ---")
    res_a = agent.generate(
        query=query,
        location_context="Punjab",
        profile={"crop": "Wheat", "size": "5 acres", "soil": "alluvial"}
    )
    print(f"Advice for A:\n{res_a.answer}")
    
    # Farmer B: Maharashtra (West), Black Soil
    print("\n--- FARMER B: Pune, Maharashtra (West), Black Soil ---")
    res_b = agent.generate(
        query=query,
        location_context="Maharashtra",
        profile={"crop": "Wheat", "size": "5 acres", "soil": "black"}
    )
    print(f"Advice for B:\n{res_b.answer}")

if __name__ == "__main__":
    try:
        test_hyperlocal_differential_advice()
        print("\nPhase 10 Verification Successful!")
    except Exception as e:
        print(f"\nVerification Failed: {e}")
        import traceback
        traceback.print_exc()
