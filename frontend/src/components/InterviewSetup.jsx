/**
 * InterviewSetup Component
 * Multi-step wizard for setting up an interview session.
 */

import { useState, useEffect } from 'react';
import { useInterview } from '../context/InterviewContext';
import { cvApi } from '../services/api';
import './InterviewSetup.css';

const STEPS = {
    COMPANY: 0,
    LANGUAGE: 1,
    RESUME: 2,
    OPTIONS: 3,
};

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
];

function InterviewSetup({ isOpen, onClose, onStart }) {
    const { cvContext, uploadCV } = useInterview();

    const [currentStep, setCurrentStep] = useState(STEPS.COMPANY);
    const [formData, setFormData] = useState({
        company: '',
        jobDescription: '',
        language: 'en',
        simpleEnglish: false,
        extraInstructions: '',
        resumeFile: null,
        autoGenerate: true,
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(STEPS.COMPANY);
        }
    }, [isOpen]);

    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.OPTIONS) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > STEPS.COMPANY) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await uploadCV(file);
            if (result.success) {
                updateForm('resumeFile', file);
            } else {
                setUploadError(result.error);
            }
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleStart = () => {
        onStart(formData);
        onClose();
    };

    const canProceed = () => {
        switch (currentStep) {
            case STEPS.COMPANY:
                return formData.company.trim().length > 0;
            case STEPS.LANGUAGE:
                return true;
            case STEPS.RESUME:
                return cvContext.hasCV || formData.resumeFile;
            case STEPS.OPTIONS:
                return true;
            default:
                return false;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content setup-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Progress Indicator */}
                <div className="setup-progress">
                    {[STEPS.COMPANY, STEPS.LANGUAGE, STEPS.RESUME, STEPS.OPTIONS].map((step) => (
                        <div
                            key={step}
                            className={`progress-dot ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                        />
                    ))}
                </div>

                {/* Step Content */}
                <div className="setup-step">
                    {currentStep === STEPS.COMPANY && (
                        <>
                            <div className="step-header">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4M12 8h.01" />
                                    </svg>
                                </div>
                                <h2>Interview Details</h2>
                                <p>Tell us about the company and position you're interviewing for.</p>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Company
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Google, Meta, Amazon..."
                                    value={formData.company}
                                    onChange={(e) => updateForm('company', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                    Job Description
                                </label>
                                <textarea
                                    className="input textarea"
                                    placeholder="Paste the job description or key requirements..."
                                    value={formData.jobDescription}
                                    onChange={(e) => updateForm('jobDescription', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </>
                    )}

                    {currentStep === STEPS.LANGUAGE && (
                        <>
                            <div className="step-header">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                </div>
                                <h2>Language & Instructions</h2>
                                <p>Choose your language and provide special instructions for the AI.</p>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                    Language
                                </label>
                                <select
                                    className="input select"
                                    value={formData.language}
                                    onChange={(e) => updateForm('language', e.target.value)}
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group toggle-group">
                                <label className="toggle-label">
                                    <span>Simple English</span>
                                    <span className="optional-tag">Optional</span>
                                </label>
                                <p className="form-hint">
                                    If English is not your first language, enable this for simpler vocabulary.
                                </p>
                                <label className="toggle">
                                    <input
                                        type="checkbox"
                                        checked={formData.simpleEnglish}
                                        onChange={(e) => updateForm('simpleEnglish', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>
                                    Extra Context/Instructions
                                    <span className="optional-tag">Optional</span>
                                </label>
                                <textarea
                                    className="input textarea"
                                    placeholder="e.g., Be more technical, use casual tone, focus on leadership examples..."
                                    value={formData.extraInstructions}
                                    onChange={(e) => updateForm('extraInstructions', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </>
                    )}

                    {currentStep === STEPS.RESUME && (
                        <>
                            <div className="step-header">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <h2>Select Resume</h2>
                                <p>Choose a resume to help the AI provide personalized answers based on your experience.</p>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    Resume
                                </label>

                                {cvContext.hasCV ? (
                                    <div className="resume-selected">
                                        <div className="resume-info">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            <span>{cvContext.filename}</span>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => document.getElementById('resume-input').click()}
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="upload-area"
                                        onClick={() => document.getElementById('resume-input').click()}
                                    >
                                        {isUploading ? (
                                            <div className="uploading">
                                                <div className="spinner"></div>
                                                <span>Uploading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Click to upload resume</span>
                                                <span className="upload-hint">PDF, DOCX, or TXT</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <input
                                    id="resume-input"
                                    type="file"
                                    accept=".pdf,.docx,.doc,.txt"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                {uploadError && (
                                    <div className="upload-error">{uploadError}</div>
                                )}
                            </div>
                        </>
                    )}

                    {currentStep === STEPS.OPTIONS && (
                        <>
                            <div className="step-header">
                                <div className="step-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </div>
                                <h2>Auto Generate AI Response</h2>
                                <span className="new-badge">New</span>
                            </div>

                            <div className="form-group toggle-group highlight-toggle">
                                <label className="toggle-label">
                                    <span>Auto Generate AI Response</span>
                                    <span className="optional-tag">Optional</span>
                                </label>
                                <p className="form-hint">
                                    If enabled, the AI will automatically detect questions and generate responses.
                                    If disabled, you'll need to click "AI Help" to generate a response.
                                </p>
                                <label className="toggle">
                                    <input
                                        type="checkbox"
                                        checked={formData.autoGenerate}
                                        onChange={(e) => updateForm('autoGenerate', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Summary */}
                            <div className="setup-summary">
                                <h4>Summary</h4>
                                <div className="summary-item">
                                    <span>Company:</span>
                                    <strong>{formData.company}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Language:</span>
                                    <strong>{LANGUAGES.find(l => l.code === formData.language)?.name}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Resume:</span>
                                    <strong>{cvContext.filename || 'Not selected'}</strong>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="setup-actions">
                    {currentStep > STEPS.COMPANY && (
                        <button className="btn btn-secondary" onClick={handleBack}>
                            ← Back
                        </button>
                    )}

                    {currentStep < STEPS.OPTIONS ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleStart}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            </svg>
                            Start Interview
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InterviewSetup;
