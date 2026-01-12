"""
EchoPilot Transcription Service
Real-time speech-to-text using faster-whisper.
"""

import asyncio
import numpy as np
from typing import Optional, AsyncGenerator, Tuple
import io
import wave
import logging

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Real-time transcription using faster-whisper."""
    
    def __init__(self, model_size: str = "base", device: str = "auto", compute_type: str = "int8"):
        """
        Initialize the transcription service.
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
            device: Device to run on (cpu, cuda, auto)
            compute_type: Compute type (float16, float32, int8)
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = None
        self._loaded = False
    
    async def load_model(self):
        """Load the Whisper model."""
        if self._loaded:
            return
        
        logger.info(f"Loading faster-whisper model: {self.model_size}")
        
        # Run model loading in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_model_sync)
        
        self._loaded = True
        logger.info("Whisper model loaded successfully")
    
    def _load_model_sync(self):
        """Synchronous model loading."""
        from faster_whisper import WhisperModel
        
        self.model = WhisperModel(
            self.model_size,
            device=self.device,
            compute_type=self.compute_type
        )
    
    async def transcribe(self, audio_data: bytes, sample_rate: int = 16000) -> Tuple[str, float]:
        """
        Transcribe audio data.
        
        Args:
            audio_data: Raw PCM audio bytes (16-bit, mono)
            sample_rate: Audio sample rate
            
        Returns:
            Tuple of (transcribed_text, confidence)
        """
        if not self._loaded:
            await self.load_model()
        
        if len(audio_data) < 1000:  # Too short
            return "", 0.0
        
        # Convert bytes to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Run transcription in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._transcribe_sync,
            audio_array
        )
        
        return result
    
    def _transcribe_sync(self, audio_array: np.ndarray) -> Tuple[str, float]:
        """Synchronous transcription."""
        try:
            segments, info = self.model.transcribe(
                audio_array,
                beam_size=5,
                language="en",
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=500,
                    speech_pad_ms=200
                )
            )
            
            text_parts = []
            total_confidence = 0
            segment_count = 0
            
            for segment in segments:
                text_parts.append(segment.text.strip())
                total_confidence += segment.avg_logprob
                segment_count += 1
            
            full_text = " ".join(text_parts)
            avg_confidence = total_confidence / segment_count if segment_count > 0 else 0
            
            # Convert log probability to percentage-like confidence
            confidence = min(1.0, max(0.0, (avg_confidence + 1) / 1))
            
            return full_text, confidence
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return "", 0.0
    
    async def transcribe_stream(self, audio_chunks: AsyncGenerator[bytes, None]) -> AsyncGenerator[Tuple[str, bool], None]:
        """
        Transcribe a stream of audio chunks.
        
        Args:
            audio_chunks: Async generator of audio bytes
            
        Yields:
            Tuple of (partial_text, is_final)
        """
        if not self._loaded:
            await self.load_model()
        
        buffer = bytearray()
        buffer_duration_ms = 0
        chunk_size = 16000 * 2  # 1 second of audio at 16kHz, 16-bit
        
        async for chunk in audio_chunks:
            buffer.extend(chunk)
            buffer_duration_ms += len(chunk) / 32  # Approximate ms
            
            # Process when we have enough audio
            if len(buffer) >= chunk_size:
                text, confidence = await self.transcribe(bytes(buffer))
                
                if text:
                    yield text, False
                
                # Keep some overlap for context
                overlap = chunk_size // 4
                buffer = buffer[-overlap:] if len(buffer) > overlap else bytearray()
        
        # Process remaining audio
        if len(buffer) > 100:
            text, confidence = await self.transcribe(bytes(buffer))
            if text:
                yield text, True


# Audio normalization utilities
def convert_webm_to_pcm(webm_data: bytes) -> Optional[bytes]:
    """
    Convert WebM audio to PCM format for Whisper.
    Falls back to treating as raw PCM if conversion fails.
    """
    try:
        # Try to use ffmpeg for conversion if available
        import subprocess
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(webm_data)
            input_path = f.name
        
        output_path = input_path.replace(".webm", ".wav")
        
        result = subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ar", "16000", "-ac", "1", "-f", "s16le",
            output_path
        ], capture_output=True, timeout=10)
        
        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                pcm_data = f.read()
            os.unlink(input_path)
            os.unlink(output_path)
            return pcm_data
        
        os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)
            
    except Exception as e:
        logger.warning(f"FFmpeg conversion failed: {e}")
    
    # Fallback: assume it's already PCM-like data
    return webm_data


# Global instance
transcription_service = TranscriptionService()
