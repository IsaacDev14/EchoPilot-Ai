/**
 * Header Component
 * Application header with branding and status indicators.
 */

import { useInterview } from '../context/InterviewContext';
import './Header.css';

function Header() {
    const { backendStatus, wsStatus, sessionActive } = useInterview();

    return (
        <header className="header">
            <div className="header-brand">
                <div className="header-logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" strokeWidth="2" />
                        <circle cx="16" cy="16" r="8" fill="url(#logo-gradient)" />
                        <circle cx="16" cy="16" r="4" fill="#0a0a0f" />
                        <defs>
                            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                                <stop stopColor="#6366f1" />
                                <stop offset="1" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="header-title">
                    <h1>EchoPilot</h1>
                    <span className="header-tagline">AI Interview Assistant</span>
                </div>
            </div>

            <div className="header-status">
                {sessionActive && (
                    <div className="session-indicator">
                        <span className="recording-dot"></span>
                        <span>Interview Active</span>
                    </div>
                )}

                <div className="status-indicators">
                    <div className={`status-indicator ${backendStatus}`}>
                        <span className={`status-dot ${backendStatus}`}></span>
                        <span>API</span>
                    </div>

                    <div className={`status-indicator ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                        <span className={`status-dot ${wsStatus === 'connected' ? 'connected' : 'disconnected'}`}></span>
                        <span>WS</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
