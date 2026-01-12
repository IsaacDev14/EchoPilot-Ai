/**
 * TopBar Component
 * Top navigation bar with search and user actions
 */

import { useTheme } from '../context/ThemeContext';
import { useInterview } from '../context/InterviewContext';
import './TopBar.css';

function TopBar({ title, subtitle }) {
    const { theme, toggleTheme } = useTheme();
    const { backendStatus, wsStatus } = useInterview();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-title">
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>
            </div>

            <div className="topbar-right">
                {/* Search */}
                <div className="topbar-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder="Search..." />
                </div>

                {/* Status indicators */}
                <div className="topbar-status">
                    <div className={`status-badge ${backendStatus === 'connected' ? 'connected' : ''}`}>
                        <span className="status-dot"></span>
                        API
                    </div>
                    <div className={`status-badge ${wsStatus === 'connected' ? 'connected' : ''}`}>
                        <span className="status-dot"></span>
                        WS
                    </div>
                </div>

                {/* Theme toggle */}
                <button className="topbar-btn" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'dark' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>

                {/* User avatar */}
                <button className="topbar-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default TopBar;
