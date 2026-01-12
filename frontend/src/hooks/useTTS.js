/**
 * useTTS Hook
 * Handles text-to-speech playback.
 */

import { useState, useCallback, useRef } from 'react';
import { ttsApi } from '../services/api';

export const TTSStatus = {
    IDLE: 'idle',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error',
};

export function useTTS() {
    const [status, setStatus] = useState(TTSStatus.IDLE);
    const [error, setError] = useState(null);
    const [currentVoice, setCurrentVoice] = useState('en-US-AriaNeural');
    const [voices, setVoices] = useState([]);

    const audioRef = useRef(null);
    const audioUrlRef = useRef(null);

    // Load available voices
    const loadVoices = useCallback(async () => {
        try {
            const recommended = await ttsApi.getRecommendedVoices();
            setVoices(Object.entries(recommended).map(([key, value]) => ({
                id: key,
                ...value,
            })));
        } catch (err) {
            console.error('Failed to load voices:', err);
        }
    }, []);

    // Speak text
    const speak = useCallback(async (text, options = {}) => {
        if (!text?.trim()) return;

        // Stop any current playback
        stop();

        setStatus(TTSStatus.LOADING);
        setError(null);

        try {
            const audioBlob = await ttsApi.speak(text, {
                voice: options.voice || currentVoice,
                rate: options.rate,
                volume: options.volume,
            });

            // Create audio element
            const audioUrl = URL.createObjectURL(audioBlob);
            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setStatus(TTSStatus.PLAYING);
            audio.onpause = () => setStatus(TTSStatus.PAUSED);
            audio.onended = () => {
                setStatus(TTSStatus.IDLE);
                cleanup();
            };
            audio.onerror = (e) => {
                console.error('Audio playback error:', e);
                setError('Failed to play audio');
                setStatus(TTSStatus.ERROR);
                cleanup();
            };

            await audio.play();
        } catch (err) {
            console.error('TTS error:', err);
            setError(err.message);
            setStatus(TTSStatus.ERROR);
        }
    }, [currentVoice]);

    // Pause playback
    const pause = useCallback(() => {
        if (audioRef.current && status === TTSStatus.PLAYING) {
            audioRef.current.pause();
        }
    }, [status]);

    // Resume playback
    const resume = useCallback(() => {
        if (audioRef.current && status === TTSStatus.PAUSED) {
            audioRef.current.play();
        }
    }, [status]);

    // Stop playback
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        cleanup();
        setStatus(TTSStatus.IDLE);
    }, []);

    // Toggle play/pause
    const toggle = useCallback(() => {
        if (status === TTSStatus.PLAYING) {
            pause();
        } else if (status === TTSStatus.PAUSED) {
            resume();
        }
    }, [status, pause, resume]);

    // Cleanup audio resources
    const cleanup = useCallback(() => {
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        audioRef.current = null;
    }, []);

    // Change voice
    const changeVoice = useCallback((voiceId) => {
        setCurrentVoice(voiceId);
    }, []);

    return {
        status,
        error,
        isPlaying: status === TTSStatus.PLAYING,
        isLoading: status === TTSStatus.LOADING,
        currentVoice,
        voices,
        loadVoices,
        speak,
        pause,
        resume,
        stop,
        toggle,
        changeVoice,
    };
}

export default useTTS;
