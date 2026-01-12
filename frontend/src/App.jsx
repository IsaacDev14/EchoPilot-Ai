/**
 * EchoPilot - Real-Time AI Interview Assistant
 * Main Application Component
 */

import { InterviewProvider } from './context/InterviewContext';
import Header from './components/Header';
import CVUpload from './components/CVUpload';
import AudioCapture from './components/AudioCapture';
import TranscriptionPanel from './components/TranscriptionPanel';
import AnswerPanel from './components/AnswerPanel';
import './styles/index.css';
import './styles/components.css';
import './App.css';

function App() {
  return (
    <InterviewProvider>
      <div className="app">
        <Header />

        <main className="app-main">
          {/* Left Sidebar - Controls */}
          <aside className="app-sidebar">
            <CVUpload />
            <AudioCapture />
          </aside>

          {/* Main Content - Transcription & Answers */}
          <div className="app-content">
            <div className="content-grid">
              <TranscriptionPanel />
              <AnswerPanel />
            </div>
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
      </div>
    </InterviewProvider>
  );
}

export default App;
