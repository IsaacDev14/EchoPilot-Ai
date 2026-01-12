/**
 * AudioCapture Component
 * Controls for audio capture with visualization.
 */

import { useState, useEffect, useCallback } from 'react';
import { useInterview } from '../context/InterviewContext';
import { useAudioCapture, AudioCaptureStatus } from '../hooks/useAudioCapture';
import './AudioCapture.css';

function AudioCapture() {
    const {
        isConnected,
        sessionActive,
        startInterview,
        endInterview,
        sendAudioChunk
    } = useInterview();

    const [permissionGranted, setPermissionGranted] = useState(false);

    const audioCapture = useAudioCapture({
        onAudioChunk: (base64Audio) => {
            if (sessionActive) {
                sendAudioChunk(base64Audio);
            }
        },
        chunkIntervalMs: 500,
    });

    // Request microphone permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            const granted = await audioCapture.requestAccess();
            setPermissionGranted(granted);
        };
        requestPermission();
    }, []);

    // Start/stop recording when session state changes
    useEffect(() => {
        if (sessionActive && permissionGranted && !audioCapture.isRecording) {
            audioCapture.startRecording();
        } else if (!sessionActive && audioCapture.isRecording) {
            audioCapture.stopRecording();
        }
    }, [sessionActive, permissionGranted]);

    const handleToggleInterview = async () => {
        if (sessionActive) {
            audioCapture.stopRecording();
            endInterview();
        } else {
            await startInterview();
        }
    };

    const getStatusText = () => {
        if (!permissionGranted) return 'Microphone access required';
        if (!isConnected) return 'Connecting to server...';
        if (sessionActive) return 'Recording interview...';
        return 'Ready to start';
    };

    const getStatusClass = () => {
        if (!permissionGranted || !isConnected) return 'status-warning';
        if (sessionActive) return 'status-recording';
        return 'status-ready';
    };

    return (
        <div className="audio-capture-panel panel">
            <div className="panel-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <h3>Audio Capture</h3>
            </div>

            <div className="panel-body">
                <div className="audio-controls">
                    {/* Status Display */}
                    <div className={`audio-status ${getStatusClass()}`}>
                        {sessionActive && (
                            <div className="recording-indicator">
                                <span className="recording-dot"></span>
                            </div>
                        )}
                        <span>{getStatusText()}</span>
                    </div>

                    {/* Audio Visualizer */}
                    {sessionActive && (
                        <div className="audio-visualizer">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="audio-bar"
                                    style={{
                                        height: `${10 + audioCapture.audioLevel * 25 * (1 + Math.random() * 0.5)}px`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Control Button */}
                    <button
                        className={`btn ${sessionActive ? 'btn-danger' : 'btn-primary'} btn-lg audio-toggle-btn`}
                        onClick={handleToggleInterview}
                        disabled={!permissionGranted || !isConnected}
                    >
                        {sessionActive ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                                Stop Interview
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                                </svg>
                                Start Interview
                            </>
                        )}
                    </button>

                    {/* Permission Request */}
                    {!permissionGranted && (
                        <button
                            className="btn btn-secondary"
                            onClick={async () => {
                                const granted = await audioCapture.requestAccess();
                                setPermissionGranted(granted);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            </svg>
                            Enable Microphone
                        </button>
                    )}
                </div>

                {/* Instructions */}
                <div className="audio-instructions">
                    <p>
                        <strong>Tip:</strong> For best results, speak clearly and ensure your microphone
                        is close to the audio source. EchoPilot will transcribe questions and suggest
                        answers in real-time.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AudioCapture;
