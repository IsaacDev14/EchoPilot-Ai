/**
 * Sidebar Component
 * Main navigation sidebar for the dashboard
 */

import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

function Sidebar({ activeView, onViewChange }) {
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'sessions', label: 'Interview Sessions', icon: 'sessions' },
        { id: 'resumes', label: 'CVs / Resumes', icon: 'file' },
    ];

    const getIcon = (name) => {
        switch (name) {
            case 'home':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                );
            case 'sessions':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                );
            case 'file':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="15" fill="#3b82f6" />
                            <circle cx="16" cy="16" r="10" fill="var(--color-bg-secondary, #111)" />
                            <rect x="10" y="11" width="2" height="10" rx="1" fill="#3b82f6" />
                            <rect x="13" y="8" width="2" height="16" rx="1" fill="#3b82f6" />
                            <rect x="16" y="6" width="2" height="20" rx="1" fill="#3b82f6" />
                            <rect x="19" y="8" width="2" height="16" rx="1" fill="#3b82f6" />
                            <rect x="22" y="11" width="2" height="10" rx="1" fill="#3b82f6" />
                        </svg>
                    </div>
                    <span className="logo-text">EchoPilot</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                    >
                        {getIcon(item.icon)}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="sidebar-footer">
                {/* Theme Toggle */}
                <button className="nav-item" onClick={toggleTheme}>
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
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* Support */}
                <button className="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Email Support</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
