/**
 * AnswerPanel Component
 * Displays AI-generated answers with key points and TTS controls.
 */

import { useEffect, useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import { useTTS } from '../hooks/useTTS';
import './AnswerPanel.css';

function AnswerPanel() {
    const { aiResponse, requestAnswer } = useInterview();
    const tts = useTTS();
    const [copied, setCopied] = useState(false);

    // Load TTS voices on mount
    useEffect(() => {
        tts.loadVoices();
    }, []);

    const handleSpeak = () => {
        if (aiResponse.answer) {
            tts.speak(aiResponse.answer);
        }
    };

    const handleCopy = async () => {
        if (aiResponse.answer) {
            await navigator.clipboard.writeText(aiResponse.answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const hasAnswer = aiResponse.answer || aiResponse.isGenerating;

    return (
        <div className="answer-panel panel">
            <div className="panel-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3>AI Answer Suggestion</h3>

                {hasAnswer && (
                    <div className="answer-actions">
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={handleCopy}
                            title="Copy answer"
                        >
                            {copied ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                        </button>

                        <button
                            className={`btn btn-ghost btn-icon ${tts.isPlaying ? 'playing' : ''}`}
                            onClick={tts.isPlaying ? tts.stop : handleSpeak}
                            disabled={tts.isLoading || !aiResponse.answer}
                            title={tts.isPlaying ? 'Stop speaking' : 'Speak answer'}
                        >
                            {tts.isLoading ? (
                                <div className="spinner"></div>
                            ) : tts.isPlaying ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="panel-body">
                {!hasAnswer ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🤖</div>
                        <p>AI answer suggestions will appear here when questions are detected</p>
                    </div>
                ) : (
                    <div className="answer-content-wrapper">
                        {/* Question */}
                        {aiResponse.question && (
                            <div className="detected-question">
                                <span className="question-label">Detected Question:</span>
                                <p className="question-text">{aiResponse.question}</p>
                            </div>
                        )}

                        {/* Answer */}
                        <div className="answer-section">
                            {aiResponse.isGenerating && !aiResponse.answer ? (
                                <div className="generating-indicator">
                                    <div className="spinner"></div>
                                    <span>Generating answer...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="answer-content">
                                        {aiResponse.answer.split('\n').map((paragraph, i) => (
                                            paragraph.trim() && <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>

                                    {aiResponse.isGenerating && (
                                        <span className="typing-indicator">●</span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Key Points */}
                        {aiResponse.keyPoints?.length > 0 && (
                            <div className="key-points">
                                <h4>Key Points to Emphasize</h4>
                                <ul>
                                    {aiResponse.keyPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TTS Voice Selector */}
            {hasAnswer && tts.voices.length > 0 && (
                <div className="answer-footer">
                    <label className="voice-selector">
                        <span>Voice:</span>
                        <select
                            className="select"
                            value={tts.currentVoice}
                            onChange={(e) => tts.changeVoice(e.target.value)}
                        >
                            {tts.voices.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name} ({voice.gender})
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}

export default AnswerPanel;
