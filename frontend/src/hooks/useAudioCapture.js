/**
 * useAudioCapture Hook
 * Handles audio capture from microphone using MediaRecorder API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const AudioCaptureStatus = {
    IDLE: 'idle',
    REQUESTING: 'requesting',
    READY: 'ready',
    RECORDING: 'recording',
    PAUSED: 'paused',
    ERROR: 'error',
};

export function useAudioCapture({ onAudioChunk, chunkIntervalMs = 500 }) {
    const [status, setStatus] = useState(AudioCaptureStatus.IDLE);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Request microphone access
    const requestAccess = useCallback(async () => {
        setStatus(AudioCaptureStatus.REQUESTING);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            streamRef.current = stream;

            // Set up audio context for visualization
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            setStatus(AudioCaptureStatus.READY);
            return true;
        } catch (err) {
            console.error('Failed to access microphone:', err);
            setError(err.message || 'Failed to access microphone');
            setStatus(AudioCaptureStatus.ERROR);
            return false;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(() => {
        if (!streamRef.current) {
            console.error('No stream available');
            return false;
        }

        try {
            // Resume audio context if suspended
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }

            // Create MediaRecorder
            const options = { mimeType: 'audio/webm;codecs=opus' };

            // Fallback for browsers that don't support webm
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = '';
            }

            const mediaRecorder = new MediaRecorder(streamRef.current, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && onAudioChunk) {
                    // Convert blob to base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result.split(',')[1];
                        onAudioChunk(base64);
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setError('Recording error');
                setStatus(AudioCaptureStatus.ERROR);
            };

            // Start recording with chunk interval
            mediaRecorder.start(chunkIntervalMs);
            setStatus(AudioCaptureStatus.RECORDING);

            // Start audio level monitoring
            startAudioLevelMonitoring();

            return true;
        } catch (err) {
            console.error('Failed to start recording:', err);
            setError(err.message);
            setStatus(AudioCaptureStatus.ERROR);
            return false;
        }
    }, [onAudioChunk, chunkIntervalMs]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        // Stop audio level monitoring
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        setAudioLevel(0);
        setStatus(AudioCaptureStatus.READY);
    }, []);

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setStatus(AudioCaptureStatus.PAUSED);
        }
    }, []);

    // Resume recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setStatus(AudioCaptureStatus.RECORDING);
        }
    }, []);

    // Toggle recording
    const toggleRecording = useCallback(() => {
        if (status === AudioCaptureStatus.RECORDING) {
            stopRecording();
        } else if (status === AudioCaptureStatus.READY || status === AudioCaptureStatus.PAUSED) {
            startRecording();
        }
    }, [status, startRecording, stopRecording]);

    // Monitor audio level for visualization
    const startAudioLevelMonitoring = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateLevel = () => {
            if (status !== AudioCaptureStatus.RECORDING) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average level
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setAudioLevel(average / 255); // Normalize to 0-1

            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }, [status]);

    // Cleanup
    const cleanup = useCallback(() => {
        stopRecording();

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setStatus(AudioCaptureStatus.IDLE);
    }, [stopRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        status,
        error,
        audioLevel,
        isRecording: status === AudioCaptureStatus.RECORDING,
        isReady: status === AudioCaptureStatus.READY,
        requestAccess,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        toggleRecording,
        cleanup,
    };
}

export default useAudioCapture;
