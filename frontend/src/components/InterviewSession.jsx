/**
 * InterviewSession Component
 * Active interview session with tab audio capture and AI responses.
 */

import { useState, useEffect, useRef } from 'react';
import { useInterview } from '../context/InterviewContext';
import { useAudioCapture, AudioSourceType } from '../hooks/useAudioCapture';
import { useTTS } from '../hooks/useTTS';
import './InterviewSession.css';

// Session states
const SessionState = {
    WAITING_FOR_TAB: 'waiting',
    CONNECTING: 'connecting',
    ACTIVE: 'active',
    ERROR: 'error',
};

function InterviewSession({ settings, onExit }) {
    const {
        transcription,
        interimTranscription,
        aiResponse,
        sendAudioChunk,
        sessionActive,
        startInterview,
        endInterview,
        requestAnswer,
    } = useInterview();

    const [sessionState, setSessionState] = useState(SessionState.WAITING_FOR_TAB);
    const [error, setError] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [autoScroll, setAutoScroll] = useState(true);

    const transcriptRef = useRef(null);
    const startTimeRef = useRef(null);

    const tts = useTTS();

    const audioCapture = useAudioCapture({
        onAudioChunk: (chunk) => {
            if (sessionActive) {
                sendAudioChunk(chunk);
            }
        },
        chunkIntervalMs: 500,
    });

    // Auto-prompt for tab selection when component mounts
    useEffect(() => {
        promptForTabSelection();
    }, []);

    // Timer
    useEffect(() => {
        if (sessionState !== SessionState.ACTIVE) return;

        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }

        const timer = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionState]);

    // Auto scroll transcript
    useEffect(() => {
        if (autoScroll && transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcription, interimTranscription, autoScroll]);

    // Start recording when session is active
    useEffect(() => {
        if (sessionActive && audioCapture.isReady && !audioCapture.isRecording) {
            audioCapture.startRecording();
        }
    }, [sessionActive, audioCapture.isReady, audioCapture.isRecording]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const promptForTabSelection = async () => {
        setSessionState(SessionState.CONNECTING);
        setError(null);

        try {
            // Request tab audio access - this will show the browser's tab picker
            await audioCapture.requestAccess(AudioSourceType.TAB);

            // Start the interview session
            await startInterview();

            // Session is now active
            setSessionState(SessionState.ACTIVE);
        } catch (err) {
            console.error('Failed to start session:', err);
            setError(err.message || 'Failed to capture tab audio');
            setSessionState(SessionState.ERROR);
        }
    };

    const handleExit = () => {
        if (sessionActive) {
            endInterview();
        }
        audioCapture.cleanup();
        onExit();
    };

    const handleRetry = () => {
        promptForTabSelection();
    };

    const handleAIAnswer = () => {
        if (transcription) {
            requestAnswer(transcription);
        }
    };

    const handleSpeak = () => {
        if (aiResponse.answer) {
            tts.speak(aiResponse.answer);
        }
    };

    const handleCopy = () => {
        if (aiResponse.answer) {
            navigator.clipboard.writeText(aiResponse.answer);
        }
    };

    // Waiting/Connecting/Error state
    if (sessionState !== SessionState.ACTIVE) {
        return (
            <div className="interview-session">
                <div className="session-waiting">
                    <div className="waiting-content">
                        {sessionState === SessionState.CONNECTING && (
                            <>
                                <div className="waiting-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    </svg>
                                </div>
                                <h2>Select Interview Tab</h2>
                                <p>Choose the browser tab where your interview is happening.</p>
                                <p className="waiting-hint">Make sure to check "Share audio" in the browser dialog!</p>
                                <div className="spinner"></div>
                            </>
                        )}

                        {sessionState === SessionState.ERROR && (
                            <>
                                <div className="waiting-icon error">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <h2>Connection Failed</h2>
                                <p className="error-text">{error}</p>
                                <div className="waiting-actions">
                                    <button className="btn btn-primary" onClick={handleRetry}>
                                        Try Again
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleExit}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Active session view
    return (
        <div className="interview-session">
            {/* Header */}
            <header className="session-header">
                <div className="session-info">
                    <div className="session-logo">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="12" fill="#3b82f6" />
                            <circle cx="14" cy="14" r="6" fill="#0a0a0a" />
                            <circle cx="14" cy="14" r="3" fill="#3b82f6" />
                        </svg>
                        <span>EchoPilot</span>
                    </div>
                    <span className="session-company">{settings.company}</span>
                </div>

                <div className="session-status">
                    <div className="status-live">
                        <span className="live-dot"></span>
                        LIVE
                    </div>
                    <div className="session-timer">
                        {formatTime(elapsedTime)}
                    </div>
                </div>

                <button className="btn btn-danger" onClick={handleExit}>
                    End Session
                </button>
            </header>

            {/* Main Content - Two Panels */}
            <div className="session-content">
                {/* Left: Transcript Panel */}
                <div className="session-panel">
                    <div className="panel-header">
                        <h3>Live Transcript</h3>
                        <div className="panel-controls">
                            <label className="auto-scroll-toggle">
                                <input
                                    type="checkbox"
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                />
                                <span>Auto-scroll</span>
                            </label>
                        </div>
                    </div>

                    <div className="panel-content transcript-content" ref={transcriptRef}>
                        {!transcription && !interimTranscription ? (
                            <div className="panel-empty">
                                <div className="listening-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                                <p>Listening for audio...</p>
                            </div>
                        ) : (
                            <div className="transcript-text">
                                {transcription && transcription.split('\n').map((line, i) => (
                                    line.trim() && <p key={i}>{line}</p>
                                ))}
                                {interimTranscription && (
                                    <p className="interim">{interimTranscription}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Audio Level */}
                    <div className="audio-level">
                        <div
                            className="audio-level-fill"
                            style={{ width: `${(audioCapture.audioLevel || 0) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Right: AI Response Panel */}
                <div className="session-panel ai-panel">
                    <div className="panel-header">
                        <h3>AI Response</h3>
                    </div>

                    <div className="panel-content">
                        {!aiResponse.answer && !aiResponse.isGenerating ? (
                            <div className="panel-empty">
                                <p>AI will respond when questions are detected</p>
                                <p className="hint">Or click "Generate Answer" below</p>
                            </div>
                        ) : (
                            <div className="ai-response">
                                {aiResponse.isGenerating && !aiResponse.answer ? (
                                    <div className="generating">
                                        <div className="spinner"></div>
                                        <span>Generating response...</span>
                                    </div>
                                ) : (
                                    <>
                                        {aiResponse.question && (
                                            <div className="detected-question">
                                                <span className="label">Question:</span>
                                                <p>{aiResponse.question}</p>
                                            </div>
                                        )}

                                        <div className="ai-answer">
                                            {aiResponse.answer.split('\n').map((line, i) => (
                                                line.trim() && <p key={i}>{line}</p>
                                            ))}
                                        </div>

                                        {aiResponse.keyPoints?.length > 0 && (
                                            <div className="key-points">
                                                <span className="label">Key Points:</span>
                                                <ul>
                                                    {aiResponse.keyPoints.map((point, i) => (
                                                        <li key={i}>{point}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="response-actions">
                                            <button className="btn btn-sm btn-ghost" onClick={handleSpeak}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                                </svg>
                                                Speak
                                            </button>
                                            <button className="btn btn-sm btn-ghost" onClick={handleCopy}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                                Copy
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="panel-footer">
                        <button
                            className="btn btn-primary btn-full"
                            onClick={handleAIAnswer}
                            disabled={aiResponse.isGenerating || !transcription}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                            Generate Answer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewSession;
