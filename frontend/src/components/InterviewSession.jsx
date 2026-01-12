/**
 * InterviewSession Component
 * Active interview session UI with transcript and AI responses.
 */

import { useState, useEffect, useRef } from 'react';
import { useInterview } from '../context/InterviewContext';
import { useAudioCapture, AudioCaptureStatus, AudioSourceType } from '../hooks/useAudioCapture';
import { useTTS } from '../hooks/useTTS';
import './InterviewSession.css';

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

    const [autoScroll, setAutoScroll] = useState(true);
    const [manualMessage, setManualMessage] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isConnecting, setIsConnecting] = useState(false);

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

    // Timer
    useEffect(() => {
        if (sessionActive && !startTimeRef.current) {
            startTimeRef.current = Date.now();
        }

        if (!sessionActive) {
            startTimeRef.current = null;
            setElapsedTime(0);
            return;
        }

        const timer = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionActive]);

    // Auto scroll transcript
    useEffect(() => {
        if (autoScroll && transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcription, interimTranscription, autoScroll]);

    // Start recording when session starts
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

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await audioCapture.requestAccess(AudioSourceType.TAB);
            await startInterview();
        } catch (err) {
            console.error('Failed to connect:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        audioCapture.stopRecording();
        audioCapture.cleanup();
    };

    const handleClear = () => {
        // This would need to be implemented in context
    };

    const handleSendManual = () => {
        if (manualMessage.trim()) {
            requestAnswer(manualMessage.trim());
            setManualMessage('');
        }
    };

    const handleAIAnswer = () => {
        // Request AI to analyze and answer based on transcript
        if (transcription) {
            requestAnswer(transcription);
        }
    };

    const handleSpeak = () => {
        if (aiResponse.answer) {
            tts.speak(aiResponse.answer);
        }
    };

    const handleExit = () => {
        if (sessionActive) {
            endInterview();
        }
        audioCapture.cleanup();
        onExit();
    };

    return (
        <div className="interview-session">
            {/* Header */}
            <header className="session-header">
                <div className="session-info">
                    <span className="session-company">{settings.company}</span>
                    <span className="session-position">
                        {settings.jobDescription?.slice(0, 50)}
                        {settings.jobDescription?.length > 50 ? '...' : ''}
                    </span>
                </div>

                <div className="session-timer">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-value">{formatTime(elapsedTime)}</span>
                </div>

                <div className="session-actions">
                    <button className="btn btn-ghost btn-icon" title="Settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                    <button className="btn btn-danger" onClick={handleExit}>
                        Exit
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="session-content">
                {/* Transcript Panel */}
                <div className="session-panel transcript-panel">
                    <div className="panel-header">
                        <h3>Transcript</h3>
                        <div className="panel-controls">
                            <button
                                className={`btn btn-sm ${sessionActive ? 'btn-success' : 'btn-secondary'}`}
                                onClick={sessionActive ? handleDisconnect : handleConnect}
                                disabled={isConnecting}
                            >
                                {isConnecting ? 'Connecting...' : sessionActive ? 'Connected' : 'Connect'}
                                {!isConnecting && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    </svg>
                                )}
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={handleClear}>
                                × Clear
                            </button>
                            <label className="auto-scroll-toggle">
                                AutoScroll
                                <input
                                    type="checkbox"
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                />
                                <span className="toggle-slider small"></span>
                            </label>
                        </div>
                    </div>

                    <div className="transcript-content" ref={transcriptRef}>
                        {!transcription && !interimTranscription ? (
                            <div className="transcript-empty">
                                {sessionActive ? 'Listening...' : 'Click "Connect" to start capturing audio'}
                            </div>
                        ) : (
                            <>
                                {transcription && (
                                    <div className="transcript-text">
                                        {transcription.split('\n\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>
                                )}
                                {interimTranscription && (
                                    <p className="transcript-interim">{interimTranscription}</p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Audio Level */}
                    {audioCapture.isRecording && (
                        <div className="audio-level-bar">
                            <div
                                className="audio-level-fill"
                                style={{ width: `${audioCapture.audioLevel * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* AI Response Panel */}
                <div className="session-panel ai-panel">
                    <div className="panel-header">
                        <h3>
                            <span className="ai-icon">🤖</span>
                            EchoPilot
                        </h3>
                    </div>

                    <div className="ai-content">
                        {!aiResponse.answer && !aiResponse.isGenerating ? (
                            <div className="ai-empty">
                                <p>No messages yet.</p>
                                <p className="ai-hint">Click "AI Answer" to start!</p>
                            </div>
                        ) : (
                            <div className="ai-messages">
                                {aiResponse.question && (
                                    <div className="ai-message question">
                                        <span className="message-label">Question Detected:</span>
                                        <p>{aiResponse.question}</p>
                                    </div>
                                )}

                                <div className="ai-message answer">
                                    {aiResponse.isGenerating && !aiResponse.answer ? (
                                        <div className="generating">
                                            <div className="spinner"></div>
                                            <span>Generating answer...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="answer-text">
                                                {aiResponse.answer.split('\n').map((line, i) => (
                                                    line.trim() && <p key={i}>{line}</p>
                                                ))}
                                            </div>

                                            {aiResponse.keyPoints?.length > 0 && (
                                                <div className="key-points">
                                                    <span className="kp-label">Key Points:</span>
                                                    <ul>
                                                        {aiResponse.keyPoints.map((point, i) => (
                                                            <li key={i}>{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="answer-actions">
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={handleSpeak}
                                                    disabled={tts.isPlaying}
                                                >
                                                    {tts.isPlaying ? '🔊 Speaking...' : '🔊 Speak'}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => navigator.clipboard.writeText(aiResponse.answer)}
                                                >
                                                    📋 Copy
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Input */}
                    <div className="ai-input">
                        <input
                            type="text"
                            className="input"
                            placeholder="Type a manual message..."
                            value={manualMessage}
                            onChange={(e) => setManualMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendManual()}
                        />
                        <button
                            className="btn btn-ghost"
                            onClick={handleSendManual}
                            disabled={!manualMessage.trim()}
                        >
                            Send
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="ai-actions">
                        <button
                            className="btn btn-primary btn-ai-answer"
                            onClick={handleAIAnswer}
                            disabled={aiResponse.isGenerating || !transcription}
                        >
                            ✨ AI Answer
                        </button>
                        <button className="btn btn-secondary">
                            🖥️ Analyze Screen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewSession;
