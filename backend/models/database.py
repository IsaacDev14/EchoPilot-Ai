"""
EchoPilot Database Module
SQLite async database setup and CRUD operations.
"""

import aiosqlite
from datetime import datetime
from typing import Optional, List
import json
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "..", "echopilot.db")


async def init_database():
    """Initialize the database and create tables."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Interview sessions table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                cv_filename TEXT,
                cv_text TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )
        """)
        
        # Question-Answer pairs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS interview_qa (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                key_points TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
            )
        """)
        
        await db.commit()


# Session CRUD operations
async def create_session(title: Optional[str] = None, cv_filename: Optional[str] = None, cv_text: Optional[str] = None) -> int:
    """Create a new interview session."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO interview_sessions (title, cv_filename, cv_text, started_at)
            VALUES (?, ?, ?, ?)
            """,
            (title, cv_filename, cv_text, datetime.utcnow())
        )
        await db.commit()
        return cursor.lastrowid


async def end_session(session_id: int) -> bool:
    """Mark a session as ended."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "UPDATE interview_sessions SET ended_at = ? WHERE id = ?",
            (datetime.utcnow(), session_id)
        )
        await db.commit()
        return True


async def get_session(session_id: int) -> Optional[dict]:
    """Get a session by ID with all Q&A pairs."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Get session
        async with db.execute(
            "SELECT * FROM interview_sessions WHERE id = ?",
            (session_id,)
        ) as cursor:
            session_row = await cursor.fetchone()
            
        if not session_row:
            return None
            
        session = dict(session_row)
        
        # Get Q&A pairs
        async with db.execute(
            "SELECT * FROM interview_qa WHERE session_id = ? ORDER BY timestamp",
            (session_id,)
        ) as cursor:
            qa_rows = await cursor.fetchall()
            
        session["qa_pairs"] = []
        for row in qa_rows:
            qa = dict(row)
            if qa.get("key_points"):
                qa["key_points"] = json.loads(qa["key_points"])
            else:
                qa["key_points"] = []
            session["qa_pairs"].append(qa)
            
        return session


async def get_all_sessions() -> List[dict]:
    """Get all sessions with summary info."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        async with db.execute("""
            SELECT 
                s.id, s.title, s.cv_filename, s.started_at, s.ended_at,
                COUNT(q.id) as question_count
            FROM interview_sessions s
            LEFT JOIN interview_qa q ON s.id = q.session_id
            GROUP BY s.id
            ORDER BY s.started_at DESC
        """) as cursor:
            rows = await cursor.fetchall()
            
        return [dict(row) for row in rows]


async def delete_session(session_id: int) -> bool:
    """Delete a session and its Q&A pairs."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("DELETE FROM interview_qa WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM interview_sessions WHERE id = ?", (session_id,))
        await db.commit()
        return True


# Q&A CRUD operations
async def add_qa(session_id: int, question: str, answer: str, key_points: List[str] = None) -> int:
    """Add a Q&A pair to a session."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        key_points_json = json.dumps(key_points) if key_points else None
        cursor = await db.execute(
            """
            INSERT INTO interview_qa (session_id, question, answer, key_points, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, question, answer, key_points_json, datetime.utcnow())
        )
        await db.commit()
        return cursor.lastrowid
