/**
 * TranscriptionPanel Component
 * Displays real-time transcription of the interview.
 */

import { useEffect, useRef } from 'react';
import { useInterview } from '../context/InterviewContext';
import './TranscriptionPanel.css';

function TranscriptionPanel() {
    const { transcription, interimTranscription, sessionActive, clearSession } = useInterview();
    const containerRef = useRef(null);

    // Auto-scroll to bottom when new transcription arrives
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcription, interimTranscription]);

    const hasContent = transcription || interimTranscription;

    return (
        <div className="transcription-panel panel">
            <div className="panel-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <h3>Live Transcription</h3>

                {hasContent && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={clearSession}
                        title="Clear transcription"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="panel-body transcription-body" ref={containerRef}>
                {!hasContent ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💬</div>
                        <p>
                            {sessionActive
                                ? 'Listening for speech...'
                                : 'Start an interview to see transcription here'}
                        </p>
                        {sessionActive && (
                            <div className="listening-indicator">
                                <span className="listening-dot"></span>
                                <span className="listening-dot"></span>
                                <span className="listening-dot"></span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="transcription-content">
                        {/* Final transcription */}
                        {transcription && (
                            <div className="transcription-text">
                                {transcription.split('\n\n').map((paragraph, i) => (
                                    <p key={i} className="transcription-paragraph">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Interim (partial) transcription */}
                        {interimTranscription && (
                            <p className="transcription-interim">
                                {interimTranscription}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {sessionActive && (
                <div className="transcription-footer">
                    <div className="transcription-live-indicator">
                        <span className="live-dot"></span>
                        <span>Live</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TranscriptionPanel;
