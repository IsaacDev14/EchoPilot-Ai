/**
 * AudioCapture Component
 * Controls for audio recording with source selection (microphone or tab).
 */

import { useEffect, useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import { useAudioCapture, AudioCaptureStatus, AudioSourceType } from '../hooks/useAudioCapture';
import './AudioCapture.css';

function AudioCapture() {
    const {
        sessionActive,
        startInterview,
        endInterview,
        sendAudioChunk,
        isConnected,
    } = useInterview();

    const [selectedSource, setSelectedSource] = useState(AudioSourceType.TAB);

    const audioCapture = useAudioCapture({
        onAudioChunk: (chunk) => {
            if (sessionActive) {
                sendAudioChunk(chunk);
            }
        },
        chunkIntervalMs: 500,
    });

    // Start recording when session becomes active
    useEffect(() => {
        if (sessionActive && audioCapture.isReady && !audioCapture.isRecording) {
            audioCapture.startRecording();
        }
    }, [sessionActive, audioCapture.isReady, audioCapture.isRecording]);

    // Stop recording when session ends
    useEffect(() => {
        if (!sessionActive && audioCapture.isRecording) {
            audioCapture.stopRecording();
        }
    }, [sessionActive, audioCapture.isRecording]);

    const handleSourceSelect = async (source) => {
        setSelectedSource(source);
        // Cleanup any existing stream
        if (audioCapture.status !== AudioCaptureStatus.IDLE) {
            audioCapture.cleanup();
        }
    };

    const handleEnableAudio = async () => {
        await audioCapture.requestAccess(selectedSource);
    };

    const handleStartInterview = async () => {
        if (!audioCapture.isReady) {
            const success = await audioCapture.requestAccess(selectedSource);
            if (!success) return;
        }
        startInterview();
    };

    const handleStopInterview = () => {
        audioCapture.stopRecording();
        endInterview();
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case AudioSourceType.MICROPHONE:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                );
            case AudioSourceType.TAB:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                );
            case AudioSourceType.BOTH:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                    </svg>
                );
        }
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case AudioSourceType.MICROPHONE:
                return 'Microphone Only';
            case AudioSourceType.TAB:
                return 'Browser Tab Audio';
            case AudioSourceType.BOTH:
                return 'Mic + Tab Audio';
        }
    };

    const isIdle = audioCapture.status === AudioCaptureStatus.IDLE;
    const isRequesting = audioCapture.status === AudioCaptureStatus.REQUESTING;

    return (
        <div className="audio-capture panel">
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
                {/* Audio Source Selector */}
                <div className="source-selector">
                    <label className="source-label">Audio Source:</label>
                    <div className="source-options">
                        {Object.values(AudioSourceType).map((source) => (
                            <button
                                key={source}
                                className={`source-option ${selectedSource === source ? 'active' : ''}`}
                                onClick={() => handleSourceSelect(source)}
                                disabled={sessionActive || isRequesting}
                                title={getSourceLabel(source)}
                            >
                                {getSourceIcon(source)}
                                <span>{getSourceLabel(source)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Name Display */}
                {audioCapture.tabName && audioCapture.isReady && (
                    <div className="tab-info">
                        <span className="tab-label">Capturing from:</span>
                        <span className="tab-name">{audioCapture.tabName}</span>
                    </div>
                )}

                {/* Status & Controls */}
                <div className="audio-controls">
                    {isIdle && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleEnableAudio}
                            disabled={isRequesting}
                        >
                            {isRequesting ? 'Connecting...' : `Select ${selectedSource === AudioSourceType.MICROPHONE ? 'Microphone' : 'Tab'}`}
                        </button>
                    )}

                    {(audioCapture.isReady || sessionActive) && (
                        <button
                            className={`btn ${sessionActive ? 'btn-danger' : 'btn-primary'}`}
                            onClick={sessionActive ? handleStopInterview : handleStartInterview}
                            disabled={isRequesting}
                        >
                            {sessionActive ? (
                                <>
                                    <span className="recording-dot"></span>
                                    Stop Interview
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="10" />
                                    </svg>
                                    Start Interview
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Audio Level Visualizer */}
                {audioCapture.isRecording && (
                    <div className="audio-visualizer">
                        <div
                            className="audio-level"
                            style={{ width: `${audioCapture.audioLevel * 100}%` }}
                        />
                    </div>
                )}

                {/* Recording Status */}
                {sessionActive && (
                    <div className="recording-status">
                        <div className="recording-indicator">
                            <span className="pulse-dot"></span>
                            <span>Recording...</span>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {audioCapture.error && (
                    <div className="error-message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {audioCapture.error}
                    </div>
                )}

                {/* Tip */}
                {!sessionActive && (
                    <div className="audio-tip">
                        <strong>Tip:</strong> {selectedSource === AudioSourceType.TAB
                            ? 'Select "Browser Tab" to capture audio from your meeting app (Zoom, Meet, etc.). Make sure to check "Share audio" when selecting the tab!'
                            : 'For best results, speak clearly and ensure your microphone is close to the audio source.'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AudioCapture;
