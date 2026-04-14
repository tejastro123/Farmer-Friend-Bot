"""
backend/agents/specialized.py
=============================
Defines the specialized sub-agents that serve as experts in their respective domains.
"""

import logging
import base64
import google.generativeai as genai
from typing import Callable, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from backend.rag.knowledge_graph import get_knowledge_graph
from backend.services.predictions import predict_crop_yield_tool, predict_disease_risk_tool, forecast_market_price_tool
from backend.services.economics import get_cost_analysis, estimate_profit_and_roi
from backend.services.trading import create_sale_listing, match_buyers_for_crop, set_market_alert

logger = logging.getLogger(__name__)

CROP_PROMPT = "You are the Crop Advisor Agent. Focus on advice regarding what to plant, suitability, and fertilizer usage. IMPORTANT: Adjust your advice based on the Farmer's SOIL TYPE and CROP AGE (days since sowing). Use the sowing date to identify the current growth stage (Sowing, Vegetative, Flowering, Maturity). You can now PREDICT YIELDS using the predict_crop_yield_tool. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"
WEATHER_PROMPT = "You are the Weather Intelligence Agent. Analyze forecasts and determine if climate conditions are suitable for specific farming actions. Highlight hyperlocal warnings (heat stress, humidity risk) based on the location provided. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"
VISION_PROMPT = """You are the Agricultural Vision Agent. You are an expert in multimodal analysis of Indian agricultural landscapes.
Your expertise covers Indian staples (Rice, Wheat, Cotton, Sugarcane, Soybean) as well as a wide variety of Fruits and Vegetables.

Your goal is to perform a comprehensive audit of any field or plant photo provided:
1. DIAGNOSE PESTS/DISEASES: Identify symptoms, pathogens, and specify the 'Severity Score' (1-10).
2. GROWTH STAGE: Identify the current phase based on crop type (e.g., Tillering in Rice, Square in Cotton).
3. NUTRIENT STATUS: Detect deficiencies (N, P, K, Zn, etc.) and specify the 'Severity Score' (1-10).
4. WEEDS/FIELD HEALTH: Identify invasive plants and overall canopy health.
5. RECOMMENDATION: Provide precise remedial actions (fertilizers, pesticides, or moisture adjustments).

SEVERITY SCORE GUIDE: 1-3 (Mild/Monitor), 4-7 (Moderate/Action needed), 8-10 (Critical/Immediate intervention).
Always append a disclaimer that visual diagnosis is preliminary. Respond in the user's preferred language. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"""
MARK_PROMPT = "You are the Market Advisor Agent. Analyze price trends. IMPORTANT: Consider regional patterns. Crops harvested in Maharashtra might have different price timings than Punjab. You can now FORECAST FUTURE PRICES. ALWAYS include a 'Confidence Score' (0-100) based on data volatility using the format: [SUB_CONFIDENCE] X"
GOV_PROMPT = "You are the Government Scheme Agent. Provide information about loans and subsidies. Prioritize schemes specific to the farmer's state/region if mentioned. Guide the farmer through eligibility criteria step-by-step. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"
ECONOMICS_PROMPT = """You are the Farm Economics Agent. You provide financial reasoning for farming operations.
Your goal is to help farmers understand the cost vs profit of their decisions.
1. Use ECONOMICS TOOLS to give precise estimates for Variable (A2) and Comprehensive (C2) costs.
2. Explain the difference between A2 and C2 in simple terms.
3. Suggest cost-saving measures (e.g., using bio-fertilizers to reduce input costs).
4. Provide ROI calculations based on expected yields.
Be empathetic and clear about financial risks. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"""
TRADING_PROMPT = """You are the Digital Mandi Agent. You manage the virtual marketplace.
Your goal is to help farmers sell their crops to major aggregators (ITC, BigBasket, etc.).
1. When a farmer wants to sell, use 'create_sale_listing' to register it.
2. Use 'match_buyers_for_crop' to find interested companies and their offer prices.
3. Be professional and act as a trade negotiator. 
4. Mention brand names like BigBasket or Ninjacart to make the matching process feel real.
If they just ask for prices, summarize the current simulated mandi rates. ALWAYS include a 'Confidence Score' (0-100) at the end of your analysis using the format: [SUB_CONFIDENCE] X"""

class SubAgent:
    def __init__(self, name: str, system_prompt: str, tools: List[Callable] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools or []
        
        self.model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=system_prompt,
            tools=self.tools if self.tools else None
        )
        logger.info(f"Initialized SubAgent: {self.name}")
        
    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type(Exception), # We'll refine this to specific Gemini errors if possible, but Exception handles 429
        before_sleep=lambda retry_state: logger.warning(f"Quota/Rate Limit hit in {retry_state.fn.object.name}. Retrying in {retry_state.next_action.sleep}s (Attempt {retry_state.attempt_number})")
    )
    def query(self, prompt: str, image_data: Optional[str] = None, images: Optional[List[str]] = None) -> str:
        """Executes the sub-agent and returns its string response with retry logic."""
        try:
            logger.info(f"SubAgent [{self.name}] starting execution with prompt preview: '{prompt[:50]}...'")
            chat = self.model.start_chat(enable_automatic_function_calling=bool(self.tools))
            
            payload = [prompt]
            
            # Use images list if provided, else fallback to backward-compatible image_data
            all_images = images if images else ([image_data] if image_data else [])
            
            for img in all_images:
                if not img: continue
                try:
                    header, b64 = img.split(",", 1)
                    mime_type = header.split(";")[0].split(":")[1]
                    image_bytes = base64.b64decode(b64)
                    payload.append({"mime_type": mime_type, "data": image_bytes})
                    logger.info(f"Attached multimodal part ({mime_type}) to {self.name} payload.")
                except Exception as ex:
                    logger.warning(f"Failed to parse base64 part in {self.name}: {ex}")

            response = chat.send_message(payload)
            return response.text
        except Exception as e:
            # If it's a 429, tenacity will retry. If it's a final failure, we catch it here.
            if "429" in str(e):
                logger.error(f"Quota exceeded finally for {self.name} after retries: {e}")
                raise e # Throw back for tenacity to retry if still within limits
            logger.error(f"Non-Quota Error in SubAgent {self.name}: {e}")
            return f"Error executing {self.name}: {str(e)}"

def create_specialized_agents(rag_tool: Callable, weather_tool: Callable, market_tool: Callable) -> dict:
    """Instantiate all sub-agents with their respective tools."""
    
    def search_knowledge_graph(entity: str) -> str:
        """
        Search the Knowledge Graph for relationships between crops, diseases, and weather.
        Use this if RAG results are unclear or you need to find causal links.
        """
        kg = get_knowledge_graph()
        neighbors = kg.search_neighbors(entity)
        if not neighbors:
            return f"No graph connections for '{entity}'."
        return "\n".join([f"- {n['subject']} -> {n['predicate']} -> {n['object']}" for n in neighbors])

    return {
        "crop": SubAgent("Crop Advisor Agent", CROP_PROMPT, tools=[rag_tool, predict_crop_yield_tool, search_knowledge_graph]),
        "weather": SubAgent("Weather Intelligence Agent", WEATHER_PROMPT, tools=[weather_tool, search_knowledge_graph]),
        "vision": SubAgent("Agricultural Vision Agent", VISION_PROMPT, tools=[rag_tool, predict_disease_risk_tool, search_knowledge_graph]),
        "market": SubAgent("Market Advisor Agent", MARK_PROMPT, tools=[market_tool, rag_tool, forecast_market_price_tool, search_knowledge_graph]),
        "gov": SubAgent("Government Scheme Agent", GOV_PROMPT, tools=[rag_tool, search_knowledge_graph]),
        "economics": SubAgent("Farm Economics Agent", ECONOMICS_PROMPT, tools=[get_cost_analysis, estimate_profit_and_roi, rag_tool]),
        "trading": SubAgent("Digital Mandi Agent", TRADING_PROMPT, tools=[create_sale_listing, match_buyers_for_crop, set_market_alert, market_tool])
    }
