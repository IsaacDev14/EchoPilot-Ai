"""
EchoPilot WebSocket Audio Handler
Handles real-time audio streaming, transcription, and AI response generation.
"""

import asyncio
import base64
import json
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect

from services.transcription import transcription_service, convert_webm_to_pcm
from services.ai_generator import ai_generator
from services.cv_processor import cv_context_manager
from models.database import create_session, end_session, add_qa

logger = logging.getLogger(__name__)

DEFAULT_SESSION = "default"


class InterviewSession:
    """Manages state for a single interview WebSocket session."""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.db_session_id: Optional[int] = None
        self.audio_buffer = bytearray()
        self.transcription_buffer = ""
        self.last_question = ""
        self.is_processing = False
        self.processing_lock = asyncio.Lock()
    
    async def send_message(self, msg_type: str, **data):
        """Send a JSON message to the client."""
        await self.websocket.send_json({
            "type": msg_type,
            **data
        })
    
    async def send_error(self, message: str):
        """Send an error message to the client."""
        await self.send_message("error", message=message)
    
    async def send_status(self, status: str, message: str = None):
        """Send a status update to the client."""
        await self.send_message("status", status=status, message=message)


async def handle_audio_websocket(websocket: WebSocket):
    """
    Main WebSocket handler for interview audio streaming.
    
    Protocol:
    - Client sends: {"type": "start_session"} to begin
    - Client sends: {"type": "audio_chunk", "data": "<base64 audio>"} for audio
    - Client sends: {"type": "end_session"} to finish
    - Server sends: {"type": "transcription", "text": "...", "is_final": bool}
    - Server sends: {"type": "ai_response", "text": "...", "key_points": [...], "is_complete": bool}
    """
    await websocket.accept()
    session = InterviewSession(websocket)
    
    logger.info("WebSocket connection established")
    
    # Preload models
    try:
        await session.send_status("loading", "Loading transcription model...")
        await transcription_service.load_model()
        await session.send_status("ready", "Ready for audio")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        await session.send_error(f"Failed to load models: {str(e)}")
        await websocket.close()
        return
    
    try:
        while True:
            # Receive message
            raw_message = await websocket.receive_text()
            
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                await session.send_error("Invalid JSON message")
                continue
            
            msg_type = message.get("type")
            
            if msg_type == "start_session":
                await handle_start_session(session, message)
            
            elif msg_type == "audio_chunk":
                await handle_audio_chunk(session, message)
            
            elif msg_type == "end_session":
                await handle_end_session(session)
            
            elif msg_type == "generate_answer":
                # Manual trigger for answer generation
                question = message.get("question", session.transcription_buffer)
                if question:
                    await generate_and_send_answer(session, question)
            
            else:
                await session.send_error(f"Unknown message type: {msg_type}")
    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        if session.db_session_id:
            await end_session(session.db_session_id)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await session.send_error(str(e))
        except:
            pass


async def handle_start_session(session: InterviewSession, message: dict):
    """Handle session start."""
    # Get CV context if available
    cv_context = cv_context_manager.get_context(DEFAULT_SESSION)
    cv_filename = cv_context["filename"] if cv_context else None
    cv_text = cv_context["text"] if cv_context else None
    
    # Create database session
    session.db_session_id = await create_session(
        title=f"Interview Session",
        cv_filename=cv_filename,
        cv_text=cv_text
    )
    
    session.audio_buffer = bytearray()
    session.transcription_buffer = ""
    
    await session.send_status("session_started", f"Session {session.db_session_id} started")
    logger.info(f"Started session {session.db_session_id}")


async def handle_audio_chunk(session: InterviewSession, message: dict):
    """Handle incoming audio chunk."""
    audio_b64 = message.get("data")
    
    if not audio_b64:
        return
    
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_b64)
        
        # Convert from WebM if needed
        pcm_data = convert_webm_to_pcm(audio_bytes)
        if pcm_data:
            session.audio_buffer.extend(pcm_data)
        else:
            session.audio_buffer.extend(audio_bytes)
        
        # Process when we have enough audio (about 2 seconds)
        if len(session.audio_buffer) >= 64000:  # ~2 seconds at 16kHz, 16-bit
            await process_audio_buffer(session)
            
    except Exception as e:
        logger.error(f"Error processing audio chunk: {e}")


async def process_audio_buffer(session: InterviewSession):
    """Process accumulated audio and generate transcription."""
    async with session.processing_lock:
        if session.is_processing:
            return
        session.is_processing = True
    
    try:
        audio_data = bytes(session.audio_buffer)
        session.audio_buffer = bytearray()  # Clear buffer
        
        # Transcribe
        text, confidence = await transcription_service.transcribe(audio_data)
        
        if text.strip():
            session.transcription_buffer += " " + text
            session.transcription_buffer = session.transcription_buffer.strip()
            
            # Send transcription to client
            await session.send_message(
                "transcription",
                text=text,
                full_text=session.transcription_buffer,
                is_final=False,
                confidence=confidence
            )
            
            # Check if this looks like a complete question
            if await is_complete_question(session.transcription_buffer):
                question = session.transcription_buffer
                session.transcription_buffer = ""
                
                # Send final transcription
                await session.send_message(
                    "transcription",
                    text=question,
                    is_final=True
                )
                
                # Generate AI answer
                await generate_and_send_answer(session, question)
    
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
    
    finally:
        session.is_processing = False


async def is_complete_question(text: str) -> bool:
    """Determine if the transcription appears to be a complete question."""
    text = text.strip()
    
    if not text:
        return False
    
    # Check for question markers
    if text.endswith("?"):
        return True
    
    # Check if it's long enough and has a natural pause indicator
    # (In production, you'd use VAD or silence detection)
    word_count = len(text.split())
    if word_count >= 10:
        # Simple heuristic: looks like a complete thought
        question_starters = ["what", "how", "why", "tell", "describe", "explain", "can", "could", "would", "do", "does", "have", "where", "when"]
        first_word = text.lower().split()[0]
        if first_word in question_starters:
            return True
    
    return False


async def generate_and_send_answer(session: InterviewSession, question: str):
    """Generate and stream AI answer to the client."""
    await session.send_status("generating", "Generating answer...")
    
    # Get CV context
    cv_context = cv_context_manager.get_context(DEFAULT_SESSION)
    cv_text = cv_context["summary"] if cv_context else None
    
    try:
        # Generate answer
        answer, key_points = await ai_generator.generate_answer(
            question=question,
            cv_context=cv_text
        )
        
        # Send complete answer
        await session.send_message(
            "ai_response",
            question=question,
            text=answer,
            key_points=key_points,
            is_complete=True
        )
        
        # Save to database
        if session.db_session_id:
            await add_qa(
                session_id=session.db_session_id,
                question=question,
                answer=answer,
                key_points=key_points
            )
        
        session.last_question = question
        
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        await session.send_error(f"Failed to generate answer: {str(e)}")


async def handle_end_session(session: InterviewSession):
    """Handle session end."""
    # Process any remaining audio
    if len(session.audio_buffer) > 1000:
        await process_audio_buffer(session)
    
    # End database session
    if session.db_session_id:
        await end_session(session.db_session_id)
        await session.send_status("session_ended", f"Session {session.db_session_id} ended")
        logger.info(f"Ended session {session.db_session_id}")
    
    session.db_session_id = None
