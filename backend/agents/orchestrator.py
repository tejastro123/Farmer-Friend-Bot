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
9. 🔥 TRUST & EXPLAINABILITY RULE: Farmers need to know WHY you are making a recommendation.
   - For every major recommendation, provide a "Reasoning" or "Why" explanation.
   - Assign a "Confidence Score" (0-100) based on the quality of agent reports and data consistency.
   - Provide specific citations where possible (e.g., "[1] ICAR Rice Handbook").
   - You MUST append these to your output using these exact tokens on new lines:
     [EXPLANATION] ... detailed reasoning ...
     [CONFIDENCE] ... numeric score ...
     [CITATIONS] ... JSON list of citations ...

NEVER make up data. If an agent fails to return prediction data, state that you don't have that information.
"""

@dataclass
class AgentResponse:
    answer: str
    sources: List[dict]  # Contains RAG sources
    language_detected: str
    agents_used: List[str] # E.g., ["Weather Intelligence", "Crop Advisor"]
    explanation: str = ""
    confidence_score: float = 0.0
    citations: List[dict] = None
    follow_up_questions: List[str] = None
    document_hashes: List[str] = None  # NEW: Track unique chunk hashes used

class OrchestratorAgent:
    def __init__(self, retriever_callable: Callable, weather_callable: Callable, market_callable: Callable):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not set in .env")
        genai.configure(api_key=settings.gemini_api_key)
        
        self.retriever_callable = retriever_callable
        self.weather_callable = weather_callable
        self.market_callable = market_callable
        
        logger.info("OrchestratorAgent initialized.")

    def generate(self, query: str, language: str = "en", location_context: str = "", 
                 image_data: str = None, images: List[str] = None, 
                 profile: dict = None, history: list = None,
                 corrections: list = None, db: Session = None) -> AgentResponse:
        
        # Format history for Gemini
        gemini_history = []
        if history:
            for msg in history:
                role = "model" if msg["role"] == "assistant" else "user"
                gemini_history.append({"role": role, "parts": [msg["content"]]})
        
        # State scoped to the request
        used_sources = []
        agents_called = set()
        sub_agent_confidences = []
        used_hashes = [] # NEW: Track chunk hashes for feedback loop

        # Wrap the core tools to capture sources centrally
        def tracked_retriever(search_query: str) -> str:
            docs: List[Document] = self.retriever_callable(search_query, db=db)
            if not docs:
                return "No internal results found."
                
            for d in docs:
                # Track unique chunk hashes
                if d.chunk_hash not in [h for h in used_hashes]:
                    used_hashes.append(d.chunk_hash)
                
                if not any(hasattr(existing, 'chunk_id') and existing.chunk_id == d.chunk_id for existing in used_sources):
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
        def _parse_confidence(text: str):
            try:
                import re
                match = re.search(r"\[SUB_CONFIDENCE\]\s*(\d+)", text)
                if match:
                    sub_agent_confidences.append(float(match.group(1)))
            except Exception as e:
                logger.warning(f"Failed to parse sub-confidence: {e}")

        def ask_crop_advisor(question: str) -> str:
            """Call this to get advice on planting, fertilizers, crop suitability, and farming steps."""
            agents_called.add("Crop Advisor")
            resp = sub_agents["crop"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_weather_agent(location: str, question: str) -> str:
            """Call this to get weather forecast and climate conditions."""
            agents_called.add("Weather Intelligence")
            loc = location if location else location_context
            resp = sub_agents["weather"].query(f"Location: {loc}. {question}")
            _parse_confidence(resp)
            return resp

        def ask_agricultural_vision_agent(question: str) -> str:
            """Analyze images for pests, diseases, and field health."""
            agents_called.add("Agricultural Vision")
            media_list = images if images else ([image_data] if image_data else None)
            resp = sub_agents["vision"].query(question, images=media_list)
            _parse_confidence(resp)
            return resp
           
        def ask_market_advisor(question: str) -> str:
            """Call this to get market price trends and demand analysis."""
            agents_called.add("Market Advisor")
            resp = sub_agents["market"].query(question)
            _parse_confidence(resp)
            return resp
            
        def ask_government_scheme_agent(question: str) -> str:
            """Call this to get information about agricultural subsidies and loans."""
            agents_called.add("Government Scheme")
            resp = sub_agents["gov"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_economics_advisor(question: str) -> str:
            """Calculate input costs, estimated profit, and ROI."""
            agents_called.add("Farm Economics")
            resp = sub_agents["economics"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_digital_mandi(question: str) -> str:
            """List crops for sale, find buyer matches, or set price alerts."""
            agents_called.add("Digital Mandi")
            resp = sub_agents["trading"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_knowledge_graph(entity: str) -> str:
            """Query the Knowledge Graph for relationships and causal chains."""
            agents_called.add("Knowledge Graph")
            kg = get_knowledge_graph()
            neighbors = kg.search_neighbors(entity)
            if not neighbors: return f"No specific graph connections found for '{entity}'."
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
                    from datetime import datetime
                    if isinstance(sowing_date, str):
                        sd = datetime.fromisoformat(sowing_date)
                    else:
                        sd = sowing_date
                    delta = (datetime.utcnow() - sd).days
                    crop_age_str = f"{delta} days"
                except: pass

            soil_type = profile.get("soil_type", "General")
            soil_info = "High clay content, good water retention." # Simplified
            state_val = location_context.split(",")[-1].strip() if "," in location_context else location_context
            
            prompt += f"\nCrop Profile: {profile.get('primary_crops', ['Not Specified'])}, Soil: {soil_type}, Age: {crop_age_str}"
            prompt += f"\nSoil Info: {soil_info}\nRegion: {state_val}"

        if corrections:
            import json
            prompt += f"\n\n[USER CORRECTIONS/PREVIOUS FEEDBACK]\n{json.dumps(corrections, indent=2)}\nIMPORTANT: Use these corrections to improve your advice."

        # NEW: Dynamic Few-Shot Injection of "Gold Standard" examples
        if db:
            from backend.models.models import ChatHistory
            gold_examples = db.query(ChatHistory).filter(ChatHistory.is_helpful == 1).order_by(ChatHistory.timestamp.desc()).limit(3).all()
            if gold_examples:
                prompt += "\n\n[HIGH-QUALITY EXAMPLES FROM PAST SUCCESSFUL SESSIONS]"
                for ex in gold_examples:
                    prompt += f"\nQuery: {ex.query}\nReference Answer Layout: {ex.answer[:300]}..."

        prompt += f"\n\n[CRITICAL INSTRUCTION: You MUST format your final response entirely in the language corresponding to language code '{language}'.]"

        # 5. Execution Step
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            system_instruction=SYSTEM_PROMPT,
            tools=[
                ask_crop_advisor, ask_weather_agent, ask_agricultural_vision_agent, 
                ask_market_advisor, ask_government_scheme_agent, 
                ask_economics_advisor, ask_digital_mandi, ask_knowledge_graph
            ]
        )

        try:
            chat = model.start_chat(history=gemini_history, enable_automatic_function_calling=True)
            
            # Injecting average confidence into the prompt before the final response is generated
            final_query = prompt
            if sub_agent_confidences:
                avg_conf = sum(sub_agent_confidences) / len(sub_agent_confidences)
                final_query += f"\n\n(Internal Note: Sub-agents reported an average confidence of {avg_conf:.1f}%)"

            response = chat.send_message(final_query)
            full_text = response.text
            
            # 6. Parse Structured Output
            import re
            answer = full_text
            explanation = ""
            confidence = 0.85
            citations = []

            if "[EXPLANATION]" in full_text:
                parts = full_text.split("[EXPLANATION]")
                answer = parts[0].strip()
                rest = parts[1]
                if "[CONFIDENCE]" in rest:
                    exp_parts = rest.split("[CONFIDENCE]")
                    explanation = exp_parts[0].strip()
                    rest = exp_parts[1]
                    if "[CITATIONS]" in rest:
                        conf_parts = rest.split("[CITATIONS]")
                        conf_str = re.sub(r"[^\d]", "", conf_parts[0])
                        if conf_str: confidence = float(conf_str) / 100.0
                        
                        import json
                        cite_match = re.search(r"(\[.*\]|\{.*\})", conf_parts[1], re.DOTALL)
                        if cite_match:
                            try: citations = json.loads(cite_match.group(1))
                            except: pass
                    else:
                        conf_str = re.sub(r"[^\d]", "", rest)
                        if conf_str: confidence = float(conf_str) / 100.0
                elif "[CITATIONS]" in rest:
                    cite_parts = rest.split("[CITATIONS]")
                    explanation = cite_parts[0].strip()
                    import json
                    cite_match = re.search(r"(\[.*\]|\{.*\})", cite_parts[1], re.DOTALL)
                    if cite_match:
                        try: citations = json.loads(cite_match.group(1))
                        except: pass
            
        except Exception as e:
            logger.error(f"Orchestrator error: {e}")
            return AgentResponse(
                answer=f"I'm having trouble. Please try again later. Error: {str(e)}",
                sources=[], language_detected=language, agents_used=list(agents_called)
            )

        return AgentResponse(
            answer=answer,
            sources=[{"text": s.text, "source": s.source, "page": s.page} for s in used_sources],
            language_detected=language,
            agents_used=list(agents_called),
            explanation=explanation,
            confidence_score=confidence,
            citations=citations,
            document_hashes=used_hashes
        )
