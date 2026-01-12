/**
 * EchoPilot API Service
 * Handles all HTTP requests to the backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

/**
 * CV/Resume API
 */
export const cvApi = {
  /**
   * Upload a CV/Resume file
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload response
   */
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/cv/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload CV');
    }
    
    return response.json();
  },
  
  /**
   * Get current CV context
   * @returns {Promise<Object>} CV context
   */
  async getContext() {
    const response = await fetch(`${API_BASE_URL}/api/cv/context`);
    
    if (!response.ok) {
      throw new Error('Failed to get CV context');
    }
    
    return response.json();
  },
  
  /**
   * Clear CV context
   * @returns {Promise<Object>} Response
   */
  async clear() {
    const response = await fetch(`${API_BASE_URL}/api/cv/clear`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear CV');
    }
    
    return response.json();
  },
};

/**
 * Text-to-Speech API
 */
export const ttsApi = {
  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {Object} options - TTS options (voice, rate, volume)
   * @returns {Promise<Blob>} Audio blob
   */
  async speak(text, options = {}) {
    const response = await fetch(`${API_BASE_URL}/api/tts/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: options.voice,
        rate: options.rate,
        volume: options.volume,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }
    
    return response.blob();
  },
  
  /**
   * Get available TTS voices
   * @param {string} locale - Locale filter (default: 'en')
   * @returns {Promise<Array>} List of voices
   */
  async getVoices(locale = 'en') {
    const response = await fetch(`${API_BASE_URL}/api/tts/voices?locale=${locale}`);
    
    if (!response.ok) {
      throw new Error('Failed to get voices');
    }
    
    return response.json();
  },
  
  /**
   * Get recommended voices
   * @returns {Promise<Object>} Recommended voices
   */
  async getRecommendedVoices() {
    const response = await fetch(`${API_BASE_URL}/api/tts/voices/recommended`);
    
    if (!response.ok) {
      throw new Error('Failed to get recommended voices');
    }
    
    return response.json();
  },
};

/**
 * Interview History API
 */
export const historyApi = {
  /**
   * Get all interview sessions
   * @returns {Promise<Array>} List of sessions
   */
  async getSessions() {
    const response = await fetch(`${API_BASE_URL}/api/history`);
    
    if (!response.ok) {
      throw new Error('Failed to get sessions');
    }
    
    return response.json();
  },
  
  /**
   * Get a specific session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Session details
   */
  async getSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/history/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get session');
    }
    
    return response.json();
  },
  
  /**
   * Delete a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Response
   */
  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/history/${sessionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete session');
    }
    
    return response.json();
  },
  
  /**
   * Clear all sessions
   * @returns {Promise<Object>} Response
   */
  async clearAll() {
    const response = await fetch(`${API_BASE_URL}/api/history`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear sessions');
    }
    
    return response.json();
  },
};

/**
 * WebSocket URL for interview streaming
 */
export const getWebSocketUrl = () => `${WS_BASE_URL}/ws/interview`;

/**
 * Health check
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  cvApi,
  ttsApi,
  historyApi,
  getWebSocketUrl,
  checkHealth,
};
