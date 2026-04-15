import logging
import sqlite3
import json
from dataclasses import dataclass
from typing import List, Optional, Callable, Dict

from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.config import settings
from backend.rag.vector_store import Document
from backend.rag.knowledge_graph import get_knowledge_graph
from backend.services.hyperlocal import get_soil_context, get_regional_context_by_state
from backend.agents.specialized import create_specialized_agents
from backend.agents.reasoning import get_hybrid_thinker
from backend.services.local_ai import get_local_engine
from backend.db.session import DB_PATH

logger = logging.getLogger(__name__)

# ... (SYSTEM_PROMPT remains same)

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
        self.client = genai.Client(api_key=settings.gemini_api_key)
        
        self.retriever_callable = retriever_callable
        self.weather_callable = weather_callable
        self.market_callable = market_callable
        
        logger.info("OrchestratorAgent initialized.")

    def generate(self, query: str, language: str = "en", location_context: str = "", 
                 image_data: str = None, images: List[str] = None, 
                 profile: dict = None, history: list = None,
                 corrections: list = None) -> AgentResponse:
        
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
        used_hashes = [] 

        # EDGE AI CHECK
        local_engine = get_local_engine()
        is_online = local_engine.check_connectivity()
        
        if not is_online:
            logger.warning("OFFLINE DETECTED: Switching to KrishiMitra Edge Engine.")
            local_resp = local_engine.predict_offline(query, profile)
            return AgentResponse(
                answer=local_resp["answer"],
                sources=[{"source": local_resp["source"], "text": "Local Knowledge Base Retrieval"}],
                language_detected=language,
                agents_used=["Edge Expert"],
                explanation="Internet unavailable. Responded using on-device local expert logic.",
                confidence_score=local_resp["confidence"]
            )

        # Wrap the core tools to capture sources centrally
        def tracked_retriever(search_query: str) -> str:
            docs: List[Document] = self.retriever_callable(search_query)
            if not docs:
                return "No internal results found."
                
            for d in docs:
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

        def _parse_confidence(text: str):
            try:
                import re
                match = re.search(r"\[SUB_CONFIDENCE\]\s*(\d+)", text)
                if match:
                    sub_agent_confidences.append(float(match.group(1)))
            except Exception as e:
                logger.warning(f"Failed to parse sub-confidence: {e}")

        def ask_crop_advisor(question: str) -> str:
            agents_called.add("Crop Advisor")
            resp = sub_agents["crop"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_weather_agent(location: str, question: str) -> str:
            agents_called.add("Weather Intelligence")
            loc = location if location else location_context
            resp = sub_agents["weather"].query(f"Location: {loc}. {question}")
            _parse_confidence(resp)
            return resp

        def ask_agricultural_vision_agent(question: str) -> str:
            agents_called.add("Agricultural Vision")
            media_list = images if images else ([image_data] if image_data else None)
            resp = sub_agents["vision"].query(question, images=media_list)
            _parse_confidence(resp)
            return resp
           
        def ask_market_advisor(question: str) -> str:
            agents_called.add("Market Advisor")
            resp = sub_agents["market"].query(question)
            _parse_confidence(resp)
            return resp
            
        def ask_government_scheme_agent(question: str) -> str:
            agents_called.add("Government Scheme")
            resp = sub_agents["gov"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_economics_advisor(question: str) -> str:
            agents_called.add("Farm Economics")
            resp = sub_agents["economics"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_digital_mandi(question: str) -> str:
            agents_called.add("Digital Mandi")
            resp = sub_agents["trading"].query(question)
            _parse_confidence(resp)
            return resp

        def ask_knowledge_graph(entity: str) -> str:
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
                    if isinstance(sowing_date, str): sd = datetime.fromisoformat(sowing_date)
                    else: sd = sowing_date
                    delta = (datetime.utcnow() - sd).days
                    crop_age_str = f"{delta} days"
                except: pass

            soil_type = profile.get("soil_type", "General")
            soil_info = "High clay content, good water retention." 
            state_val = location_context.split(",")[-1].strip() if "," in location_context else location_context
            
            prompt += f"\nCrop Profile: {profile.get('primary_crops', ['Not Specified'])}, Soil: {soil_type}, Age: {crop_age_str}"
            prompt += f"\nSoil Info: {soil_info}\nRegion: {state_val}"

        if corrections:
            prompt += f"\n\n[USER CORRECTIONS/PREVIOUS FEEDBACK]\n{json.dumps(corrections, indent=2)}\nIMPORTANT: Use these corrections to improve your advice."

        # NEW: Dynamic Few-Shot Injection using Raw SQL
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT query, answer FROM chat_history WHERE is_helpful = 1 ORDER BY timestamp DESC LIMIT 3")
            gold_examples = cursor.fetchall()
            conn.close()
            if gold_examples:
                prompt += "\n\n[HIGH-QUALITY EXAMPLES FROM PAST SUCCESSFUL SESSIONS]"
                for ex in gold_examples:
                    prompt += f"\nQuery: {ex['query']}\nReference Answer Layout: {ex['answer'][:300]}..."
        except Exception as e:
            logger.debug(f"Few-shot lookup failed (safe to skip): {e}")

        prompt += f"\n\n[CRITICAL INSTRUCTION: You MUST format your final response entirely in the language corresponding to language code '{language}'.]"

        # Reasoning Step
        thinker = get_hybrid_thinker()
        reasoning_context = {
            "stage": profile.get("growing_stage", "Unknown"),
            "soil_type": soil_type,
            "weather": "Sunny"
        }
        packet = thinker.get_reasoning_packet(query, reasoning_context)
        
        if packet["warnings"]:
            prompt += "\n\n[MANDATORY SECURITY RULES & WARNINGS]"
            for w in packet["warnings"]: prompt += f"\n- {w}"
        
        if packet["graph_context"]:
            prompt += "\n\n[EXPERT KNOWLEDGE GRAPH RELATIONSHIPS]"
            for rel in packet["graph_context"][:10]: prompt += f"\n- {rel}"
        
        if packet["causal_chains"]:
            prompt += "\n\n[DERIVED CAUSAL REASONING CHAINS]"
            for chain in packet["causal_chains"]: prompt += f"\n- {chain}"

        # 5. Execution Step
        try:
            chat = self.client.chats.create(
                model="gemini-flash-latest",
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=[
                        ask_crop_advisor, ask_weather_agent, ask_agricultural_vision_agent, 
                        ask_market_advisor, ask_government_scheme_agent, 
                        ask_economics_advisor, ask_digital_mandi, ask_knowledge_graph
                    ],
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
                ),
                history=gemini_history
            )
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
