"""
EchoPilot Pydantic Models and Schemas
Defines data structures for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """WebSocket message types."""
    AUDIO_CHUNK = "audio_chunk"
    START_SESSION = "start_session"
    END_SESSION = "end_session"
    TRANSCRIPTION = "transcription"
    AI_RESPONSE = "ai_response"
    ERROR = "error"
    STATUS = "status"


# CV/Resume Models
class CVUploadResponse(BaseModel):
    """Response after uploading a CV."""
    success: bool
    message: str
    filename: str
    extracted_text: Optional[str] = None
    summary: Optional[str] = None


class CVContext(BaseModel):
    """Current CV context."""
    has_cv: bool
    filename: Optional[str] = None
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    uploaded_at: Optional[datetime] = None


# Transcription Models
class TranscriptionResult(BaseModel):
    """Real-time transcription result."""
    text: str
    is_final: bool = False
    confidence: Optional[float] = None
    timestamp: Optional[float] = None


# AI Response Models
class AIResponse(BaseModel):
    """AI-generated answer."""
    text: str
    key_points: List[str] = Field(default_factory=list)
    is_complete: bool = False
    question: Optional[str] = None


class AnswerRequest(BaseModel):
    """Request for AI answer generation."""
    question: str
    cv_context: Optional[str] = None
    role_context: Optional[str] = None


# TTS Models
class TTSRequest(BaseModel):
    """Text-to-speech request."""
    text: str
    voice: Optional[str] = None
    rate: Optional[str] = None
    volume: Optional[str] = None


class TTSVoice(BaseModel):
    """Available TTS voice."""
    name: str
    short_name: str
    locale: str
    gender: str


# Interview History Models
class InterviewQA(BaseModel):
    """Question and answer pair."""
    id: Optional[int] = None
    question: str
    answer: str
    key_points: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class InterviewSession(BaseModel):
    """Interview session data."""
    id: Optional[int] = None
    title: Optional[str] = None
    cv_filename: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    qa_pairs: List[InterviewQA] = Field(default_factory=list)


class InterviewSessionSummary(BaseModel):
    """Summary of an interview session for list view."""
    id: int
    title: Optional[str] = None
    cv_filename: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    question_count: int = 0


# WebSocket Models
class WSMessage(BaseModel):
    """WebSocket message structure."""
    type: MessageType
    data: Optional[dict] = None


class WSAudioChunk(BaseModel):
    """Audio chunk from client."""
    type: MessageType = MessageType.AUDIO_CHUNK
    data: str  # Base64 encoded audio


class WSTranscription(BaseModel):
    """Transcription message to client."""
    type: MessageType = MessageType.TRANSCRIPTION
    text: str
    is_final: bool = False


class WSAIResponse(BaseModel):
    """AI response message to client."""
    type: MessageType = MessageType.AI_RESPONSE
    text: str
    key_points: List[str] = Field(default_factory=list)
    is_complete: bool = False


class WSError(BaseModel):
    """Error message to client."""
    type: MessageType = MessageType.ERROR
    message: str


class WSStatus(BaseModel):
    """Status message to client."""
    type: MessageType = MessageType.STATUS
    status: str
    message: Optional[str] = None
