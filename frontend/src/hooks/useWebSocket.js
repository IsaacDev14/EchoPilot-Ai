/**
 * useWebSocket Hook
 * Manages WebSocket connection for real-time interview streaming.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getWebSocketUrl } from '../services/api';

export const WebSocketStatus = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
};

export function useWebSocket() {
    const [status, setStatus] = useState(WebSocketStatus.DISCONNECTED);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const messageHandlersRef = useRef({});

    // Register message handlers
    const onMessage = useCallback((type, handler) => {
        messageHandlersRef.current[type] = handler;
        return () => {
            delete messageHandlersRef.current[type];
        };
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setStatus(WebSocketStatus.CONNECTING);
        setError(null);

        try {
            const ws = new WebSocket(getWebSocketUrl());
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setStatus(WebSocketStatus.CONNECTED);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastMessage(message);

                    // Call registered handler for this message type
                    const handler = messageHandlersRef.current[message.type];
                    if (handler) {
                        handler(message);
                    }

                    // Also call 'all' handler if registered
                    const allHandler = messageHandlersRef.current['all'];
                    if (allHandler) {
                        allHandler(message);
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('WebSocket connection error');
                setStatus(WebSocketStatus.ERROR);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setStatus(WebSocketStatus.DISCONNECTED);
                wsRef.current = null;

                // Auto-reconnect after 3 seconds if not intentional close
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError(err.message);
            setStatus(WebSocketStatus.ERROR);
        }
    }, []);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnect');
            wsRef.current = null;
        }

        setStatus(WebSocketStatus.DISCONNECTED);
    }, []);

    // Send message through WebSocket
    const send = useCallback((type, data = {}) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({ type, ...data }));
            return true;
        } catch (err) {
            console.error('Failed to send WebSocket message:', err);
            return false;
        }
    }, []);

    // Start interview session
    const startSession = useCallback(() => {
        return send('start_session');
    }, [send]);

    // End interview session
    const endSession = useCallback(() => {
        return send('end_session');
    }, [send]);

    // Send audio chunk
    const sendAudioChunk = useCallback((base64Audio) => {
        return send('audio_chunk', { data: base64Audio });
    }, [send]);

    // Request answer generation
    const generateAnswer = useCallback((question) => {
        return send('generate_answer', { question });
    }, [send]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        status,
        lastMessage,
        error,
        isConnected: status === WebSocketStatus.CONNECTED,
        connect,
        disconnect,
        send,
        onMessage,
        startSession,
        endSession,
        sendAudioChunk,
        generateAnswer,
    };
}

export default useWebSocket;
