/**
 * HomeView Component
 * Main dashboard home view with quick actions
 */

import { useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import './HomeView.css';

function HomeView({ onStartInterview }) {
    const { cvContext } = useInterview();

    return (
        <div className="home-view">
            {/* Quick Actions */}
            <section className="quick-actions">
                <div className="action-card primary" onClick={onStartInterview}>
                    <div className="action-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <div className="action-content">
                        <h3>Start New Interview</h3>
                        <p>Begin a real-time AI-assisted interview session</p>
                    </div>
                    <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>

                <div className="action-cards-row">
                    <div className="action-card">
                        <div className="action-icon small">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="action-content">
                            <h3>Upload Resume</h3>
                            <p>Add your CV for personalized responses</p>
                        </div>
                    </div>

                    <div className="action-card">
                        <div className="action-icon small">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="action-content">
                            <h3>Recent Sessions</h3>
                            <p>View your past interview sessions</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <h2>Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">0</div>
                        <div className="stat-label">Total Sessions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">0h</div>
                        <div className="stat-label">Practice Time</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{cvContext.hasCV ? '1' : '0'}</div>
                        <div className="stat-label">Resumes</div>
                    </div>
                </div>
            </section>

            {/* Resume Preview */}
            {cvContext.hasCV && (
                <section className="resume-preview">
                    <h2>Active Resume</h2>
                    <div className="resume-card">
                        <div className="resume-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <div className="resume-info">
                            <span className="resume-name">{cvContext.filename}</span>
                            <span className="resume-status">Ready for interviews</span>
                        </div>
                        <button className="btn btn-ghost btn-sm">Change</button>
                    </div>
                </section>
            )}
        </div>
    );
}

export default HomeView;
