"""
EchoPilot TTS Router
Handles text-to-speech conversion endpoints.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io

from models.schemas import TTSRequest, TTSVoice
from services.tts_service import tts_service

router = APIRouter(prefix="/api/tts", tags=["TTS"])


@router.post("/speak")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech and return audio.
    
    Returns MP3 audio data.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum 5000 characters.")
    
    try:
        audio_data = await tts_service.synthesize(
            text=request.text,
            voice=request.voice,
            rate=request.rate,
            volume=request.volume
        )
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@router.post("/speak/stream")
async def text_to_speech_stream(request: TTSRequest):
    """
    Stream text-to-speech audio in chunks.
    
    Returns streaming MP3 audio data.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    async def audio_generator():
        async for chunk in tts_service.synthesize_stream(
            text=request.text,
            voice=request.voice,
            rate=request.rate,
            volume=request.volume
        ):
            yield chunk
    
    return StreamingResponse(
        audio_generator(),
        media_type="audio/mpeg"
    )


@router.get("/voices", response_model=list[TTSVoice])
async def get_available_voices(locale: str = "en"):
    """
    Get list of available TTS voices.
    
    Args:
        locale: Filter by locale prefix (default: "en" for English)
    """
    try:
        voices = await tts_service.get_available_voices(locale_filter=locale)
        return [TTSVoice(**v) for v in voices]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voices: {str(e)}")


@router.get("/voices/recommended")
async def get_recommended_voices():
    """Get list of recommended high-quality voices."""
    return tts_service.RECOMMENDED_VOICES
