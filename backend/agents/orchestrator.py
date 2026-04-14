"""
backend/agents/orchestrator.py
==============================
Meta-agent coordinator that routes queries to specialized sub-agents.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional, Callable, Dict

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.config import settings
from backend.rag.vector_store import Document
from backend.rag.knowledge_graph import get_knowledge_graph
from backend.services.hyperlocal import get_soil_context, get_regional_context_by_state
from backend.agents.specialized import create_specialized_agents

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are KrishiMitra (कृषि मित्र), an Orchestrator AI agricultural advisor for Indian farmers.
You do NOT answer questions directly from your own knowledge. Instead, you MUST use your provided specialized agent tools to gather the necessary insights, and then you synthesize their responses into a cohesive, actionable final answer for the user.

Your toolkit includes specialized sub-agents. Based on the user's query:
1. Determine which specialized agent(s) are needed (e.g., if asking about planting and weather, query both the Crop Advisor and Weather Agents).
   🔥 IMPORTANT NOTE: Your Sub-Agents now have Machine Learning capabilities!
   - Route inquiries about expected harvest volumes to the Crop Agent so it can run PREDICT YIELDS.
   - Route pricing inquiries to the Market Agent so it can run FORECAST PRICES.
   - Route inquiries about COSTS, PROFITS, or ROI to the Economics Agent so it can run CALCULATE CROP ECONOMICS.
2. Route ANY image-based queries to the Agricultural Vision Agent to analyze diseases, GROWTH STAGES, NUTRIENT DEFICIENCIES, and WEEDS.
3. Ensure you pass specific numeric contexts (temperature, area size) to the sub-agents so they can compute accurately.
4. You can query multiple agents sequentially or logically.
5. Once all necessary agents have returned their reports, combine their insights into a complete answer.
6. Base your final response PRIMARILY on the agents' output.
7. If the user question is in Hindi/Telugu/Tamil/other language, respond in the same language exactly.
8. Keep answers concise but complete — farmers need actionable advice.

🔥 HYPERLOCAL RULE: You MUST tailor advice based on the Farmer's specific SOIL and REGION context. 

🔥 CONVERSATIONAL RULE: You are talking to a human. Be empathetic. 
- ALWAYS append 3 short, helpful follow-up questions at the end of your response.
- These questions should guide the user (e.g., "Would you like me to predict the yield for this crop?" or "Should I check the market price for Pune?").
- Format follow-ups as a list at the very end, preceded by the token [FOLLOW_UP] on a new line.

NEVER make up data. If an agent fails to return prediction data, state that you don't have that information.
"""

@dataclass
class AgentResponse:
    answer: str
    sources: List[dict]  # Contains RAG sources
    language_detected: str
    agents_used: List[str] # E.g., ["Weather Intelligence", "Crop Advisor"]
    follow_up_questions: List[str] = None

class OrchestratorAgent:
    def __init__(self, retriever_callable: Callable, weather_callable: Callable, market_callable: Callable):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set in .env")
        genai.configure(api_key=settings.gemini_api_key)
        
        self.retriever_callable = retriever_callable
        self.weather_callable = weather_callable
        self.market_callable = market_callable
        
        logger.info("OrchestratorAgent initialized.")

    def generate(self, query: str, language: str = "en", location_context: str = "", image_data: Optional[str] = None, images: Optional[List[str]] = None, profile: Optional[dict] = None, history: Optional[List[dict]] = None) -> AgentResponse:
        
        # Format history for Gemini
        gemini_history = []
        if history:
            for msg in history:
                role = "model" if msg["role"] == "assistant" else "user"
                gemini_history.append({"role": role, "parts": [msg["content"]]})
        
        # State scoped to the request
        used_sources = []
        agents_called = set()

        # Wrap the core tools to capture sources centrally
        def tracked_retriever(search_query: str) -> str:
            docs: List[Document] = self.retriever_callable(search_query)
            if not docs:
                return "No internal results found. Ensure you declare this."
                
            for d in docs:
                if not any(existing.chunk_id == d.chunk_id for existing in used_sources):
                    used_sources.append(d)
            parts = []
            for i, doc in enumerate(docs, 1):
                src = f"{doc.source}" + (f" (p.{doc.page})" if doc.page else "")
                parts.append(f"[{i}] {src}:\n{doc.text}")
            return "\n\n".join(parts)

        # Instantiate specialized agents
        sub_agents = create_specialized_agents(
            rag_tool=tracked_retriever,
            weather_tool=self.weather_callable,
            market_tool=self.market_callable
        )

        # Create tools for the Orchestrator
        def ask_crop_advisor(question: str) -> str:
            """Call this to get advice on planting, fertilizers, crop suitability, and farming steps."""
            agents_called.add("Crop Advisor")
            return sub_agents["crop"].query(question)

        def ask_weather_agent(location: str, question: str) -> str:
            """Call this to get weather forecast and climate conditions."""
            agents_called.add("Weather Intelligence")
            loc = location if location else location_context
            return sub_agents["weather"].query(f"Location: {loc}. {question}")

        def ask_agricultural_vision_agent(question: str) -> str:
            """
            Analyze images for diagnostics. 
            Call this for: Pests, diseases, growth stage detection, nutrient deficiency diagnosis, and weed audits.
            """
            agents_called.add("Agricultural Vision")
            # Use images list if available, else fallback to single image_data
            media_list = images if images else ([image_data] if image_data else None)
            return sub_agents["vision"].query(question, images=media_list)
           
        def ask_market_advisor(question: str) -> str:
            """Call this to get market price trends and demand analysis."""
            agents_called.add("Market Advisor")
            return sub_agents["market"].query(question)
            
        def ask_government_scheme_agent(question: str) -> str:
            """Call this to get information about agricultural subsidies, loans, PM-KISAN, etc."""
            agents_called.add("Government Scheme")
            return sub_agents["gov"].query(question)

        def ask_economics_advisor(question: str) -> str:
            """
            Call this to calculate input costs (A2/C2), estimated profit, and ROI.
            Use this for questions about 'How much will it cost?', 'What is my profit?', or 'Is it worth planting?'.
            """
            agents_called.add("Farm Economics")
            return sub_agents["economics"].query(question)

        def ask_digital_mandi(question: str) -> str:
            """
            Call this to list crops for sale, find buyer matches (ITC, BigBasket, etc.), or set price alerts.
            Use this for 'I want to sell...', 'Who is buying...', or 'Alert me when prices hit...'.
            """
            agents_called.add("Digital Mandi")
            return sub_agents["trading"].query(question)

        def ask_knowledge_graph(entity: str) -> str:
            """
            Query the Knowledge Graph for relationships and causal chains.
            Call this to explain 'Why' something happens or find connected concepts 
            (e.g., 'What diseases are triggered by high humidity?').
            """
            agents_called.add("Knowledge Graph")
            kg = get_knowledge_graph()
            neighbors = kg.search_neighbors(entity)
            if not neighbors:
                return f"No specific graph connections found for '{entity}'."
            
            summary = [f"Direct relationships for '{entity}':"]
            for n in neighbors:
                summary.append(f"- {n['subject']} -> {n['predicate']} -> {n['object']}")
            
            chain = kg.get_causal_chain(entity)
            if chain:
                summary.append("\nReasoning chain:")
                summary.extend([f"- {c}" for c in chain])
                
            return "\n".join(summary)

        # Build prompt
        prompt = f"User Query: {query}"
        if location_context:
            prompt += f"\n\n(Context: User location is {location_context})"
            
            sowing_date = profile.get("sowing_date")
            crop_age_str = "Not Specified"
            if sowing_date:
                try:
                    if isinstance(sowing_date, str):
                        from datetime import datetime
                        sd = datetime.fromisoformat(sowing_date)
                    else:
                        sd = sowing_date
                    delta = (datetime.utcnow() - sd).days
                    crop_age_str = f"{delta} days"
                except:
                    pass

            # Extract soil and regional context for the prompt
            soil_type = profile.get("soil_type", "General")
            soil_info = get_soil_context(soil_type)
            
            # Simple state extraction (Last word usually state if "City, State")
            state_val = location_context.split(",")[-1].strip() if "," in location_context else location_context
            region_info = get_regional_context_by_state(state_val)

            persona_block = f"""
[FARMER PROFILE CONTEXT]
Current Crop: {profile.get("primary_crop", profile.get("crop", "Not Specified"))}
Farm Size: {profile.get("farm_size", profile.get("size", "Not Specified"))} acres
Sowing Date: {sowing_date if sowing_date else "Not Specified"}
Calculated Crop Age: {crop_age_str}
{soil_info}
{region_info}
Include this specific hyperlocal context when querying sub-agents. Your advice MUST be compatible with these soil, regional, and growth stage constraints.
"""
            prompt += persona_block
            
        prompt += f"\n\n[CRITICAL INSTRUCTION: You MUST format your final response entirely in the language corresponding to language code '{language}'.]"
            
        logger.info(f"Orchestrator sending prompt: '{query[:80]}...'")

        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=SYSTEM_PROMPT,
            tools=[
                ask_crop_advisor,
                ask_weather_agent,
                ask_agricultural_vision_agent,
                ask_market_advisor,
                ask_government_scheme_agent,
                ask_economics_advisor,
                ask_digital_mandi,
                ask_knowledge_graph
            ]
        )

        @retry(
            wait=wait_exponential(multiplier=1, min=2, max=10),
            stop=stop_after_attempt(5),
            retry=retry_if_exception_type(Exception),
            before_sleep=lambda retry_state: logger.warning(f"Quota/Rate Limit hit in Orchestrator. Retrying in {retry_state.next_action.sleep}s (Attempt {retry_state.attempt_number})")
        )
        def send_orchestrator_message(chat_obj, p):
            return chat_obj.send_message(p)

        try:
            chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=True)
            response = send_orchestrator_message(chat, prompt) 
            full_text = response.text
            
            # Parse follow-ups
            if "[FOLLOW_UP]" in full_text:
                parts = full_text.split("[FOLLOW_UP]")
                answer = parts[0].strip()
                follow_ups = [q.strip("- ").strip() for q in parts[1].strip().split("\n") if q.strip()]
            else:
                answer = full_text
                follow_ups = []
        except Exception as e:
            logger.error(f"Orchestrator API error during tool loop or final synthesis: {e}")
            answer = f"I'm having trouble coordinating my agents due to high server load (Gemini Quota). Please try again in 30 seconds. (Error: {str(e)})"

        # Map Document objects to UI-friendly dicts
        sources_out = [
            {"source": doc.source, "page": doc.page, "excerpt": doc.text[:200]}
            for doc in used_sources[:3]
        ]

        if not agents_called:
            agents_called.add("Orchestrator") # Fallback if it somehow answered itself

        return AgentResponse(
            answer=answer,
            sources=sources_out,
            language_detected=language,
            agents_used=list(agents_called),
            follow_up_questions=follow_ups[:3]
        )
