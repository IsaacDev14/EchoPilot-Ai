"""
EchoPilot Interview History Router
Handles interview session history and Q&A review.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from models.schemas import InterviewSession, InterviewSessionSummary
from models.database import (
    get_all_sessions,
    get_session,
    delete_session
)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=List[InterviewSessionSummary])
async def list_interview_sessions():
    """Get all interview sessions with summary info."""
    sessions = await get_all_sessions()
    return [InterviewSessionSummary(**s) for s in sessions]


@router.get("/{session_id}")
async def get_interview_session(session_id: int):
    """Get a specific interview session with all Q&A pairs."""
    session = await get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.delete("/{session_id}")
async def delete_interview_session(session_id: int):
    """Delete an interview session and its Q&A pairs."""
    session = await get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await delete_session(session_id)
    
    return {"success": True, "message": "Session deleted"}


@router.delete("")
async def clear_all_sessions():
    """Delete all interview sessions."""
    sessions = await get_all_sessions()
    
    for session in sessions:
        await delete_session(session["id"])
    
    return {"success": True, "message": f"Deleted {len(sessions)} sessions"}
