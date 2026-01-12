"""
EchoPilot Configuration Module
Handles environment variables and application settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    
    # Whisper Configuration
    whisper_model: str = "base"  # tiny, base, small, medium, large
    whisper_device: str = "auto"  # cpu, cuda, auto
    whisper_compute_type: str = "int8"  # float16, float32, int8
    
    # TTS Configuration
    tts_voice: str = "en-US-AriaNeural"
    tts_rate: str = "+0%"
    tts_volume: str = "+0%"
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./echopilot.db"
    
    # Server
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Audio Processing
    audio_sample_rate: int = 16000
    audio_chunk_duration: float = 0.5  # seconds
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    def get_llm_provider(self) -> str:
        """Determine which LLM provider to use based on available API keys."""
        if self.groq_api_key:
            return "groq"
        elif self.openai_api_key:
            return "openai"
        else:
            raise ValueError("No LLM API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.")


settings = Settings()
