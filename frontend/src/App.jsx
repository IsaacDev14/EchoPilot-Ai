/**
 * EchoPilot - Real-Time AI Interview Assistant
 * Main Application Component
 */

import { useState, useEffect } from 'react';
import { InterviewProvider, useInterview } from './context/InterviewContext';
import Header from './components/Header';
import InterviewSetup from './components/InterviewSetup';
import InterviewSession from './components/InterviewSession';
import CVUpload from './components/CVUpload';
import './styles/index.css';
import './styles/components.css';
import './App.css';

function AppContent() {
  const { backendStatus, cvContext } = useInterview();
  const [showSetup, setShowSetup] = useState(false);
  const [inSession, setInSession] = useState(false);
  const [sessionSettings, setSessionSettings] = useState(null);

  const handleStartSession = (settings) => {
    setSessionSettings(settings);
    setInSession(true);
    setShowSetup(false);
  };

  const handleExitSession = () => {
    setInSession(false);
    setSessionSettings(null);
  };

  // If in active session, show session view
  if (inSession && sessionSettings) {
    return (
      <InterviewSession
        settings={sessionSettings}
        onExit={handleExitSession}
      />
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="landing-content">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge">AI-Powered Interview Assistant</div>
            <h1 className="hero-title">
              Ace Your Next Interview with
              <span className="text-gradient"> EchoPilot</span>
            </h1>
            <p className="hero-subtitle">
              Real-time transcription and AI-powered answer suggestions
              to help you shine in any interview.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowSetup(true)}
                disabled={backendStatus !== 'connected'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Start Free Session
              </button>
              <button className="btn btn-secondary btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                Watch Demo
              </button>
            </div>

            {backendStatus !== 'connected' && (
              <div className="hero-notice">
                <span className="notice-icon">⚠️</span>
                Connecting to server...
              </div>
            )}
          </section>

          {/* Features Grid */}
          <section className="features-section">
            <h2 className="section-title">How It Works</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h3>Upload Resume</h3>
                <p>Add your CV so the AI can personalize answers based on your experience.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎤</div>
                <h3>Capture Audio</h3>
                <p>Select your browser tab or mic to capture the interview audio in real-time.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📝</div>
                <h3>Live Transcription</h3>
                <p>See what's being said instantly with our fast speech-to-text engine.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>AI Suggestions</h3>
                <p>Get context-aware answer suggestions when questions are detected.</p>
              </div>
            </div>
          </section>

          {/* Quick Resume Upload */}
          <section className="upload-section">
            <div className="upload-card">
              <CVUpload />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          <span className="text-gradient">EchoPilot</span> — Your AI Interview Co-Pilot
        </p>
        <p className="footer-hint">
          Upload your resume, start the interview, and get real-time answer suggestions
        </p>
      </footer>

      {/* Setup Wizard Modal */}
      <InterviewSetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onStart={handleStartSession}
      />
    </div>
  );
}

function App() {
  return (
    <InterviewProvider>
      <AppContent />
    </InterviewProvider>
  );
}

export default App;
