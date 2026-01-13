"""
EchoPilot Transcription Service
Real-time speech-to-text using Groq Whisper API.
"""

import asyncio
import httpx
import numpy as np
from typing import Optional, Tuple
import io
import wave
import logging
import tempfile
import os

from config import settings

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Real-time transcription using Groq Whisper API."""
    
    def __init__(self):
        """Initialize the transcription service."""
        self.api_key = settings.groq_api_key
        self.api_url = "https://api.groq.com/openai/v1/audio/transcriptions"
        self._client = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client
    
    async def transcribe(self, audio_data: bytes, sample_rate: int = 16000) -> Tuple[str, float]:
        """
        Transcribe audio data using Groq Whisper API.
        
        Args:
            audio_data: Raw PCM audio bytes (16-bit, mono)
            sample_rate: Audio sample rate
            
        Returns:
            Tuple of (transcribed_text, confidence)
        """
        if len(audio_data) < 1000:  # Too short
            return "", 0.0
        
        if not self.api_key:
            logger.error("GROQ_API_KEY not configured")
            return "", 0.0
        
        try:
            # Convert raw PCM to WAV format for the API
            wav_data = self._pcm_to_wav(audio_data, sample_rate)
            
            client = await self._get_client()
            
            # Send to Groq Whisper API
            files = {
                "file": ("audio.wav", wav_data, "audio/wav"),
            }
            data = {
                "model": "whisper-large-v3",
                "language": "en",
                "response_format": "json",
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
            }
            
            response = await client.post(
                self.api_url,
                files=files,
                data=data,
                headers=headers,
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result.get("text", "").strip()
                return text, 0.9 if text else 0.0
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                return "", 0.0
                
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return "", 0.0
    
    def _pcm_to_wav(self, pcm_data: bytes, sample_rate: int) -> bytes:
        """Convert raw PCM data to WAV format."""
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)
        buffer.seek(0)
        return buffer.read()
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Global instance
transcription_service = TranscriptionService()
