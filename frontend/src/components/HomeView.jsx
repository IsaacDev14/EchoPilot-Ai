/**
 * HomeView Component
 * Main dashboard home view with quick actions
 */

import { useState } from 'react';
import { useInterview } from '../context/InterviewContext';
import './HomeView.css';

function HomeView({ onStartInterview }) {
    const { backendStatus, wsStatus, cvContext } = useInterview();

    return (
        <div className="home-view">
            {/* Header */}
            <header className="view-header">
                <div>
                    <h1>Home</h1>
                    <p className="view-subtitle">Welcome back to EchoPilot</p>
                </div>
                <div className="status-badges">
                    <div className={`status-badge ${backendStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        API
                    </div>
                    <div className={`status-badge ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        WS
                    </div>
                </div>
            </header>

            {/* Quick Actions */}
            <section className="quick-actions">
                <div className="action-card primary" onClick={onStartInterview}>
                    <div className="action-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="action-content">
                            <h3>Upload Resume</h3>
                            <p>Add your CV for personalized AI responses</p>
                        </div>
                    </div>

                    <div className="action-card">
                        <div className="action-icon small">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            {/* Status Section */}
            <section className="dashboard-section">
                <h2>System Status</h2>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">Backend API</span>
                        <span className={`status-value ${backendStatus}`}>
                            {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">WebSocket</span>
                        <span className={`status-value ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                            {wsStatus === 'connected' ? 'Connected' : 'Ready'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Resume</span>
                        <span className={`status-value ${cvContext.hasCV ? 'connected' : ''}`}>
                            {cvContext.hasCV ? cvContext.filename : 'Not uploaded'}
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomeView;
