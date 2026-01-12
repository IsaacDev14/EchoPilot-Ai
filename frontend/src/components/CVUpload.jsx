/**
 * CVUpload Component
 * Handles CV/Resume file upload with drag-and-drop.
 */

import { useState, useCallback } from 'react';
import { useInterview } from '../context/InterviewContext';
import './CVUpload.css';

function CVUpload() {
    const { cvContext, uploadCV, clearCV } = useInterview();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer?.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    }, []);

    const handleFileSelect = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    }, []);

    const handleUpload = async (file) => {
        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const validExtensions = ['.pdf', '.docx', '.txt'];

        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(extension)) {
            setError('Please upload a PDF, DOCX, or TXT file');
            return;
        }

        setIsUploading(true);
        setError(null);

        const result = await uploadCV(file);

        setIsUploading(false);

        if (!result.success) {
            setError(result.error);
        }
    };

    const handleClear = async () => {
        await clearCV();
        setError(null);
    };

    if (cvContext.hasCV) {
        return (
            <div className="cv-upload-panel panel">
                <div className="panel-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <h3>Resume Loaded</h3>
                </div>
                <div className="panel-body">
                    <div className="cv-loaded">
                        <div className="cv-file-info">
                            <div className="cv-file-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="cv-file-details">
                                <span className="cv-filename">{cvContext.filename}</span>
                                <span className="cv-status badge badge-success">Active</span>
                            </div>
                        </div>

                        {cvContext.summary && (
                            <div className="cv-summary">
                                <h4>Summary</h4>
                                <p>{cvContext.summary.substring(0, 300)}...</p>
                            </div>
                        )}

                        <button className="btn btn-secondary btn-sm" onClick={handleClear}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Remove Resume
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cv-upload-panel panel">
            <div className="panel-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <h3>Upload Resume</h3>
            </div>
            <div className="panel-body">
                <div
                    className={`dropzone ${isDragging ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('cv-file-input').click()}
                >
                    <input
                        id="cv-file-input"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {isUploading ? (
                        <div className="upload-loading">
                            <div className="spinner"></div>
                            <span>Processing resume...</span>
                        </div>
                    ) : (
                        <>
                            <div className="dropzone-icon">📄</div>
                            <p className="dropzone-text">
                                <strong>Drop your resume here</strong>
                                <br />
                                or click to browse
                            </p>
                            <span className="dropzone-hint">PDF, DOCX, or TXT (max 10MB)</span>
                        </>
                    )}
                </div>

                {error && (
                    <div className="cv-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CVUpload;
