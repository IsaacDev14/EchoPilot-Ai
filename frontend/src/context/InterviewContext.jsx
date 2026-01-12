/**
 * InterviewContext
 * Global state management for the interview session.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cvApi, checkHealth } from '../services/api';
import { useWebSocket, WebSocketStatus } from '../hooks/useWebSocket';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
    // Backend status
    const [backendStatus, setBackendStatus] = useState('checking');

    // CV state
    const [cvContext, setCvContext] = useState({
        hasCV: false,
        filename: null,
        summary: null,
    });

    // Transcription state
    const [transcription, setTranscription] = useState('');
    const [interimTranscription, setInterimTranscription] = useState('');

    // AI Response state
    const [aiResponse, setAiResponse] = useState({
        question: '',
        answer: '',
        keyPoints: [],
        isGenerating: false,
    });

    // Session state
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // WebSocket
    const ws = useWebSocket();

    // Check backend health on mount
    useEffect(() => {
        const check = async () => {
            const healthy = await checkHealth();
            setBackendStatus(healthy ? 'connected' : 'disconnected');
        };
        check();

        // Check periodically
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load CV context on mount
    useEffect(() => {
        loadCvContext();
    }, []);

    // Register WebSocket message handlers
    useEffect(() => {
        if (!ws.isConnected) return;

        // Transcription handler
        const unsubTranscription = ws.onMessage('transcription', (msg) => {
            if (msg.is_final) {
                setTranscription(prev => {
                    const newText = prev ? `${prev}\n\n${msg.text}` : msg.text;
                    return newText;
                });
                setInterimTranscription('');
            } else {
                setInterimTranscription(msg.text);
            }
        });

        // AI response handler
        const unsubAiResponse = ws.onMessage('ai_response', (msg) => {
            setAiResponse({
                question: msg.question || '',
                answer: msg.text || '',
                keyPoints: msg.key_points || [],
                isGenerating: !msg.is_complete,
            });
        });

        // Status handler
        const unsubStatus = ws.onMessage('status', (msg) => {
            console.log('Status:', msg.status, msg.message);
            if (msg.status === 'session_started') {
                setSessionActive(true);
            } else if (msg.status === 'session_ended') {
                setSessionActive(false);
            }
        });

        // Error handler
        const unsubError = ws.onMessage('error', (msg) => {
            console.error('WebSocket error:', msg.message);
        });

        return () => {
            unsubTranscription();
            unsubAiResponse();
            unsubStatus();
            unsubError();
        };
    }, [ws.isConnected, ws.onMessage]);

    // Load CV context from backend
    const loadCvContext = useCallback(async () => {
        try {
            const context = await cvApi.getContext();
            setCvContext({
                hasCV: context.has_cv,
                filename: context.filename,
                summary: context.summary,
                extractedText: context.extracted_text,
                uploadedAt: context.uploaded_at,
            });
        } catch (err) {
            console.error('Failed to load CV context:', err);
        }
    }, []);

    // Upload CV
    const uploadCV = useCallback(async (file) => {
        try {
            const result = await cvApi.upload(file);
            setCvContext({
                hasCV: true,
                filename: result.filename,
                summary: result.summary,
                extractedText: result.extracted_text,
            });
            return { success: true, data: result };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, []);

    // Clear CV
    const clearCV = useCallback(async () => {
        try {
            await cvApi.clear();
            setCvContext({
                hasCV: false,
                filename: null,
                summary: null,
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, []);

    // Start interview session
    const startInterview = useCallback(async () => {
        // Connect WebSocket if not connected
        if (!ws.isConnected) {
            ws.connect();
            // Wait for connection
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Start session
        ws.startSession();
        setTranscription('');
        setInterimTranscription('');
        setAiResponse({ question: '', answer: '', keyPoints: [], isGenerating: false });
    }, [ws]);

    // End interview session
    const endInterview = useCallback(() => {
        ws.endSession();
        setSessionActive(false);
    }, [ws]);

    // Clear current session data
    const clearSession = useCallback(() => {
        setTranscription('');
        setInterimTranscription('');
        setAiResponse({ question: '', answer: '', keyPoints: [], isGenerating: false });
    }, []);

    // Request answer generation for a specific question
    const requestAnswer = useCallback((question) => {
        if (ws.isConnected && question) {
            setAiResponse(prev => ({ ...prev, isGenerating: true }));
            ws.generateAnswer(question);
        }
    }, [ws]);

    const value = {
        // Backend
        backendStatus,

        // CV
        cvContext,
        uploadCV,
        clearCV,
        loadCvContext,

        // WebSocket
        wsStatus: ws.status,
        isConnected: ws.isConnected,
        connect: ws.connect,
        disconnect: ws.disconnect,
        sendAudioChunk: ws.sendAudioChunk,

        // Session
        sessionActive,
        sessionId,
        startInterview,
        endInterview,
        clearSession,

        // Transcription
        transcription,
        interimTranscription,

        // AI Response
        aiResponse,
        requestAnswer,
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
}

export function useInterview() {
    const context = useContext(InterviewContext);
    if (!context) {
        throw new Error('useInterview must be used within InterviewProvider');
    }
    return context;
}

export default InterviewContext;
