"""
EchoPilot CV/Resume Router
Handles CV upload and context management.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid

from models.schemas import CVUploadResponse, CVContext
from services.cv_processor import CVProcessor, cv_context_manager

router = APIRouter(prefix="/api/cv", tags=["CV"])

# Default session ID for single-user mode
# In production, this would be tied to user authentication
DEFAULT_SESSION = "default"


@router.post("/upload", response_model=CVUploadResponse)
async def upload_cv(file: UploadFile = File(...)):
    """
    Upload a CV/resume file and extract text.
    
    Supports PDF, DOCX, and TXT files.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    extension = "." + file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if extension not in CVProcessor.SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(CVProcessor.SUPPORTED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    # Extract text
    extracted_text, error = await CVProcessor.extract_text(content, file.filename)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file")
    
    # Create summary
    summary = CVProcessor.create_summary(extracted_text)
    
    # Store context
    cv_context_manager.set_context(DEFAULT_SESSION, file.filename, extracted_text, summary)
    
    return CVUploadResponse(
        success=True,
        message="CV uploaded and processed successfully",
        filename=file.filename,
        extracted_text=extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        summary=summary
    )


@router.get("/context", response_model=CVContext)
async def get_cv_context():
    """Get the current CV context."""
    context = cv_context_manager.get_context(DEFAULT_SESSION)
    
    if not context:
        return CVContext(has_cv=False)
    
    return CVContext(
        has_cv=True,
        filename=context["filename"],
        extracted_text=context["text"][:1000] + "..." if len(context["text"]) > 1000 else context["text"],
        summary=context["summary"],
        uploaded_at=context["uploaded_at"]
    )


@router.delete("/clear")
async def clear_cv_context():
    """Clear the current CV context."""
    cv_context_manager.clear_context(DEFAULT_SESSION)
    return {"success": True, "message": "CV context cleared"}


@router.get("/full-text")
async def get_full_cv_text():
    """Get the full extracted CV text (for internal use)."""
    context = cv_context_manager.get_context(DEFAULT_SESSION)
    
    if not context:
        raise HTTPException(status_code=404, detail="No CV uploaded")
    
    return {"text": context["text"]}
