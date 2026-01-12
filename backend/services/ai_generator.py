"""
EchoPilot AI Answer Generation Service
Context-aware answer generation using LLM (Groq/OpenAI).
"""

import asyncio
from typing import Optional, AsyncGenerator, List, Tuple
import logging
import json
import re

from config import settings

logger = logging.getLogger(__name__)


class AIGenerator:
    """Generate context-aware interview answers using LLM."""
    
    SYSTEM_PROMPT = """You are an expert interview coach helping a candidate answer interview questions in real-time. 

Your role is to:
1. Analyze the interview question
2. Use the candidate's CV/resume context to craft a personalized, authentic answer
3. Provide a natural, conversational response that the candidate can use or adapt
4. Highlight key points the candidate should emphasize

Guidelines:
- Keep answers concise but comprehensive (2-3 paragraphs max)
- Use first person ("I have experience...", "In my previous role...")
- Be specific - reference actual experience from the CV when possible
- Sound natural and confident, not robotic
- For technical questions, demonstrate understanding while being accessible
- If the question is unclear, provide the best interpretation

Format your response as:
ANSWER: [The suggested answer]

KEY POINTS:
- [Point 1]
- [Point 2]
- [Point 3]"""

    def __init__(self):
        self.client = None
        self.provider = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize the LLM client."""
        if self._initialized:
            return
        
        self.provider = settings.get_llm_provider()
        
        if self.provider == "groq":
            from groq import AsyncGroq
            self.client = AsyncGroq(api_key=settings.groq_api_key)
            self.model = "llama-3.1-70b-versatile"
            logger.info("Initialized Groq client")
        else:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
            self.model = "gpt-4o-mini"
            logger.info("Initialized OpenAI client")
        
        self._initialized = True
    
    def _build_user_prompt(self, question: str, cv_context: Optional[str], role_context: Optional[str] = None) -> str:
        """Build the user prompt with context."""
        prompt_parts = []
        
        if cv_context:
            prompt_parts.append(f"CANDIDATE'S CV/RESUME:\n{cv_context}\n")
        
        if role_context:
            prompt_parts.append(f"ROLE CONTEXT:\n{role_context}\n")
        
        prompt_parts.append(f"INTERVIEW QUESTION:\n{question}")
        
        return "\n---\n".join(prompt_parts)
    
    def _parse_response(self, response_text: str) -> Tuple[str, List[str]]:
        """Parse the LLM response into answer and key points."""
        answer = response_text
        key_points = []
        
        # Extract answer section
        if "ANSWER:" in response_text:
            parts = response_text.split("KEY POINTS:", 1)
            answer_part = parts[0].replace("ANSWER:", "").strip()
            answer = answer_part
            
            if len(parts) > 1:
                points_text = parts[1].strip()
                # Extract bullet points
                lines = points_text.split("\n")
                for line in lines:
                    line = line.strip()
                    if line.startswith("-") or line.startswith("•"):
                        point = line.lstrip("-•").strip()
                        if point:
                            key_points.append(point)
        
        # Fallback: if no key points found, extract some from the answer
        if not key_points and answer:
            sentences = answer.split(".")
            key_points = [s.strip() + "." for s in sentences[:3] if len(s.strip()) > 20]
        
        return answer, key_points
    
    async def generate_answer(self, question: str, cv_context: Optional[str] = None, role_context: Optional[str] = None) -> Tuple[str, List[str]]:
        """
        Generate a complete answer for an interview question.
        
        Args:
            question: The interview question
            cv_context: Candidate's CV/resume text
            role_context: Optional context about the role
            
        Returns:
            Tuple of (answer_text, key_points)
        """
        await self.initialize()
        
        user_prompt = self._build_user_prompt(question, cv_context, role_context)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            return self._parse_response(response_text)
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return f"I apologize, but I couldn't generate an answer at this moment. Error: {str(e)}", []
    
    async def generate_answer_stream(self, question: str, cv_context: Optional[str] = None, role_context: Optional[str] = None) -> AsyncGenerator[Tuple[str, bool], None]:
        """
        Generate an answer with streaming response.
        
        Args:
            question: The interview question
            cv_context: Candidate's CV/resume text
            role_context: Optional context about the role
            
        Yields:
            Tuple of (text_chunk, is_complete)
        """
        await self.initialize()
        
        user_prompt = self._build_user_prompt(question, cv_context, role_context)
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
                stream=True
            )
            
            full_response = ""
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_response += text
                    yield text, False
            
            yield "", True
            
        except Exception as e:
            logger.error(f"Error in streaming answer: {e}")
            yield f"Error generating answer: {str(e)}", True
    
    async def extract_question(self, transcription: str) -> Optional[str]:
        """
        Extract and clean up an interview question from transcription.
        Uses simple heuristics - could be enhanced with LLM.
        """
        # Simple heuristics to detect questions
        question_indicators = ["?", "tell me", "describe", "explain", "what", "how", "why", "where", "when", "can you", "could you", "would you"]
        
        text = transcription.strip()
        
        # Check if it looks like a question
        is_question = text.endswith("?") or any(ind in text.lower() for ind in question_indicators)
        
        if is_question and len(text) > 10:
            return text
        
        return None


# Global instance
ai_generator = AIGenerator()
