/**
 * useAudioCapture Hook
 * Handles audio capture from microphone AND browser tab/screen using MediaRecorder API.
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

export const AudioSourceType = {
    MICROPHONE: 'microphone',
    TAB: 'tab',
    BOTH: 'both', // Mix microphone + tab audio
};

export function useAudioCapture({ onAudioChunk, chunkIntervalMs = 500 }) {
    const [status, setStatus] = useState(AudioCaptureStatus.IDLE);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [audioSource, setAudioSource] = useState(AudioSourceType.MICROPHONE);
    const [tabName, setTabName] = useState(null);

    const micStreamRef = useRef(null);
    const tabStreamRef = useRef(null);
    const combinedStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Request microphone access
    const requestMicrophoneAccess = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });
            micStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('Failed to access microphone:', err);
            throw err;
        }
    }, []);

    // Request tab/screen audio access
    const requestTabAccess = useCallback(async () => {
        try {
            // Use getDisplayMedia to capture tab/window audio
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'browser' }, // Prefer browser tab
                audio: true, // Capture audio from the tab
                selfBrowserSurface: 'include', // Allow capturing current tab
                systemAudio: 'include', // Include system audio if available
            });

            // Check if audio track exists
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                // Stop video tracks since we don't need them
                stream.getVideoTracks().forEach(track => track.stop());
                throw new Error('No audio track found. Make sure to check "Share audio" when selecting the tab.');
            }

            // Stop video tracks - we only need audio
            stream.getVideoTracks().forEach(track => track.stop());

            // Get tab name from track label
            const audioTrack = audioTracks[0];
            setTabName(audioTrack.label || 'Selected Tab');

            tabStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('Failed to access tab audio:', err);
            throw err;
        }
    }, []);

    // Request audio access based on selected source
    const requestAccess = useCallback(async (sourceType = AudioSourceType.MICROPHONE) => {
        setStatus(AudioCaptureStatus.REQUESTING);
        setError(null);
        setAudioSource(sourceType);

        try {
            let activeStream = null;

            if (sourceType === AudioSourceType.MICROPHONE) {
                activeStream = await requestMicrophoneAccess();
            } else if (sourceType === AudioSourceType.TAB) {
                activeStream = await requestTabAccess();
            } else if (sourceType === AudioSourceType.BOTH) {
                // Get both streams
                const micStream = await requestMicrophoneAccess();
                const tabStream = await requestTabAccess();

                // Combine streams using AudioContext
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const destination = audioContext.createMediaStreamDestination();

                const micSource = audioContext.createMediaStreamSource(micStream);
                const tabSource = audioContext.createMediaStreamSource(tabStream);

                micSource.connect(destination);
                tabSource.connect(destination);

                activeStream = destination.stream;
                audioContextRef.current = audioContext;
            }

            combinedStreamRef.current = activeStream;

            // Set up audio visualization
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(activeStream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            setStatus(AudioCaptureStatus.READY);
            return true;
        } catch (err) {
            console.error('Failed to access audio:', err);
            setError(err.message || 'Failed to access audio source');
            setStatus(AudioCaptureStatus.ERROR);
            return false;
        }
    }, [requestMicrophoneAccess, requestTabAccess]);

    // Start recording
    const startRecording = useCallback(() => {
        if (!combinedStreamRef.current) {
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

            const mediaRecorder = new MediaRecorder(combinedStreamRef.current, options);
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

        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }

        if (tabStreamRef.current) {
            tabStreamRef.current.getTracks().forEach(track => track.stop());
            tabStreamRef.current = null;
        }

        if (combinedStreamRef.current) {
            combinedStreamRef.current.getTracks().forEach(track => track.stop());
            combinedStreamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setTabName(null);
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
        audioSource,
        tabName,
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
