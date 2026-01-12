# EchoPilot - Real-Time AI Interview Assistant

A smart co-pilot for live interviews that captures audio, transcribes in real-time, and provides context-aware AI-generated answers using your CV/resume as context.

## Features

- 📄 **CV/Resume Context** - Upload your resume to personalize AI responses
- 🎤 **Real-Time Audio Capture** - Capture live audio from interviews
- 📝 **Instant Transcription** - Real-time speech-to-text using faster-whisper
- 🤖 **Context-Aware Answers** - AI-generated responses tailored to your background
- 🔊 **Text-to-Speech** - Natural voice output for AI answers
- 💡 **Answer Assistance** - Highlighted key points for natural responses
- 📚 **Interview History** - Save and review past interviews

## Tech Stack

- **Backend**: FastAPI, faster-whisper, Groq/OpenAI, edge-tts
- **Frontend**: React, Vite, Web Audio API
- **Database**: SQLite
- **Communication**: WebSockets

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Groq API key or OpenAI API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Usage

1. Open http://localhost:5173 in your browser
2. Upload your CV/resume
3. Click "Start Interview" to begin audio capture
4. Speak or play interview audio - watch real-time transcription appear
5. AI will automatically generate context-aware answer suggestions
6. Use TTS to hear the suggested answers

## Environment Variables

Create a `.env` file in the `backend` directory:

```
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional if using Groq
WHISPER_MODEL=base  # Options: tiny, base, small, medium, large
TTS_VOICE=en-US-AriaNeural
```

## License

MIT
