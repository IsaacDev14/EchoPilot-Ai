/**
 * Header Component
 * Application header with branding, status indicators, and theme toggle.
 */

import { useInterview } from '../context/InterviewContext';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

function Header() {
    const { backendStatus, wsStatus, sessionActive } = useInterview();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="header-brand">
                <div className="header-logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" strokeWidth="2" />
                        <circle cx="16" cy="16" r="8" fill="url(#logo-gradient)" />
                        <circle cx="16" cy="16" r="4" fill="var(--color-bg-primary)" />
                        <defs>
                            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                                <stop stopColor="#3b82f6" />
                                <stop offset="1" stopColor="#f97316" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="header-title">
                    <h1>EchoPilot</h1>
                    <span className="header-tagline">AI Interview Assistant</span>
                </div>
            </div>

            <div className="header-actions">
                {/* Theme Toggle */}
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>

                {/* Session Indicator */}
                {sessionActive && (
                    <div className="session-indicator">
                        <span className="recording-dot"></span>
                        <span>Interview Active</span>
                    </div>
                )}

                {/* Status Indicators */}
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
