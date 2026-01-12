/**
 * EchoPilot - AI Interview Assistant
 * Main Application with Dashboard Layout
 */

import { useState } from 'react';
import { InterviewProvider, useInterview } from './context/InterviewContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import CVUpload from './components/CVUpload';
import InterviewSetup from './components/InterviewSetup';
import InterviewSession from './components/InterviewSession';
import './styles/index.css';
import './App.css';

function Dashboard() {
  const { cvContext } = useInterview();
  const [activeView, setActiveView] = useState('home');
  const [showSetup, setShowSetup] = useState(false);
  const [inSession, setInSession] = useState(false);
  const [sessionSettings, setSessionSettings] = useState(null);

  const getViewInfo = () => {
    switch (activeView) {
      case 'home':
        return { title: 'Home', subtitle: 'Welcome back to EchoPilot' };
      case 'sessions':
        return { title: 'Interview Sessions', subtitle: 'View past sessions and recordings' };
      case 'resumes':
        return { title: 'CVs / Resumes', subtitle: 'Manage your uploaded resumes' };
      default:
        return { title: 'Home', subtitle: '' };
    }
  };

  const viewInfo = getViewInfo();

  const handleStartSession = (settings) => {
    setSessionSettings(settings);
    setInSession(true);
    setShowSetup(false);
  };

  const handleExitSession = () => {
    setInSession(false);
    setSessionSettings(null);
  };

  // If in active session, show full-screen session view
  if (inSession && sessionSettings) {
    return (
      <InterviewSession
        settings={sessionSettings}
        onExit={handleExitSession}
      />
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView onStartInterview={() => setShowSetup(true)} />;
      case 'sessions':
        return (
          <div className="view-content">
            <header className="view-header">
              <h1>Interview Sessions</h1>
              <p className="view-subtitle">View past sessions and recordings</p>
            </header>
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h3>No sessions yet</h3>
              <p>Start your first interview to see it here</p>
              <button className="btn btn-primary" onClick={() => setShowSetup(true)}>
                Start Interview
              </button>
            </div>
          </div>
        );
      case 'resumes':
        return (
          <div className="view-content">
            <header className="view-header">
              <h1>CVs / Resumes</h1>
              <p className="view-subtitle">Manage your uploaded resumes</p>
            </header>
            <div className="resume-section">
              <CVUpload />
            </div>
          </div>
        );
      default:
        return <HomeView onStartInterview={() => setShowSetup(true)} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">
        <TopBar title={viewInfo.title} subtitle={viewInfo.subtitle} />
        <div className="main-view">
          {renderView()}
        </div>
      </main>

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
    <ThemeProvider>
      <InterviewProvider>
        <Dashboard />
      </InterviewProvider>
    </ThemeProvider>
  );
}

export default App;
