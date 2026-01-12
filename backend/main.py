"""
EchoPilot Backend - Main Application
Real-time AI interview assistant backend with FastAPI.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.database import init_database
from routers import cv_router, tts_router, history_router
from websockets import handle_audio_websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting EchoPilot backend...")
    await init_database()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EchoPilot backend...")


# Create FastAPI app
app = FastAPI(
    title="EchoPilot",
    description="Real-time AI interview assistant",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(cv_router)
app.include_router(tts_router)
app.include_router(history_router)


# WebSocket endpoint
@app.websocket("/ws/interview")
async def websocket_interview(websocket: WebSocket):
    """WebSocket endpoint for real-time interview audio streaming."""
    await handle_audio_websocket(websocket)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "EchoPilot",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to EchoPilot API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
