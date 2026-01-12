"""
EchoPilot Text-to-Speech Service
Natural voice output using edge-tts (Microsoft Edge TTS).
"""

import asyncio
import edge_tts
from typing import Optional, List, AsyncGenerator
import io
import logging

from config import settings

logger = logging.getLogger(__name__)


class TTSService:
    """Text-to-Speech service using Microsoft Edge TTS."""
    
    # Popular English voices
    RECOMMENDED_VOICES = {
        "en-US-AriaNeural": {"name": "Aria", "gender": "Female", "style": "Friendly, versatile"},
        "en-US-GuyNeural": {"name": "Guy", "gender": "Male", "style": "Professional"},
        "en-US-JennyNeural": {"name": "Jenny", "gender": "Female", "style": "Warm, conversational"},
        "en-US-EricNeural": {"name": "Eric", "gender": "Male", "style": "Confident"},
        "en-GB-SoniaNeural": {"name": "Sonia", "gender": "Female", "style": "British, professional"},
        "en-GB-RyanNeural": {"name": "Ryan", "gender": "Male", "style": "British, friendly"},
    }
    
    def __init__(self, default_voice: str = None):
        """
        Initialize TTS service.
        
        Args:
            default_voice: Default voice to use (e.g., "en-US-AriaNeural")
        """
        self.default_voice = default_voice or settings.tts_voice
        self.default_rate = settings.tts_rate
        self.default_volume = settings.tts_volume
        self._voices_cache = None
    
    async def get_available_voices(self, locale_filter: str = "en") -> List[dict]:
        """
        Get list of available TTS voices.
        
        Args:
            locale_filter: Filter voices by locale prefix (e.g., "en" for English)
            
        Returns:
            List of voice dictionaries
        """
        if self._voices_cache is None:
            all_voices = await edge_tts.list_voices()
            self._voices_cache = all_voices
        
        voices = []
        for voice in self._voices_cache:
            if locale_filter and not voice["Locale"].startswith(locale_filter):
                continue
            
            voices.append({
                "name": voice["FriendlyName"],
                "short_name": voice["ShortName"],
                "locale": voice["Locale"],
                "gender": voice["Gender"]
            })
        
        return voices
    
    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        volume: Optional[str] = None
    ) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (short name like "en-US-AriaNeural")
            rate: Speech rate adjustment (e.g., "+10%", "-20%")
            volume: Volume adjustment (e.g., "+20%", "-10%")
            
        Returns:
            Audio bytes in MP3 format
        """
        voice = voice or self.default_voice
        rate = rate or self.default_rate
        volume = volume or self.default_volume
        
        try:
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                volume=volume
            )
            
            audio_data = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
            
            return audio_data.getvalue()
            
        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            raise
    
    async def synthesize_stream(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        volume: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream text-to-speech audio in chunks.
        
        Args:
            text: Text to convert to speech
            voice: Voice to use
            rate: Speech rate adjustment
            volume: Volume adjustment
            
        Yields:
            Audio data chunks in MP3 format
        """
        voice = voice or self.default_voice
        rate = rate or self.default_rate
        volume = volume or self.default_volume
        
        try:
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=rate,
                volume=volume
            )
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
                    
        except Exception as e:
            logger.error(f"TTS streaming error: {e}")
            raise
    
    async def save_to_file(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        volume: Optional[str] = None
    ) -> str:
        """
        Save synthesized speech to an audio file.
        
        Args:
            text: Text to convert
            output_path: Path to save the audio file
            voice: Voice to use
            rate: Speech rate adjustment
            volume: Volume adjustment
            
        Returns:
            Path to the saved file
        """
        audio_data = await self.synthesize(text, voice, rate, volume)
        
        with open(output_path, "wb") as f:
            f.write(audio_data)
        
        return output_path


# Global instance
tts_service = TTSService()
