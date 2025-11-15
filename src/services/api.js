import axios from 'axios';

// Base API URL - Change this to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// MATCH APIs
// ============================================

export const matchAPI = {
  // Get all matches
  getAllMatches: () => api.get('/matches'),

  // Get single match by ID
  getMatchById: (matchId) => api.get(`/matches/${matchId}`),

  // Create new match
  createMatch: (matchData) => api.post('/matches', matchData),

  // Select player
  selectPlayer: (matchId, playerId) => 
    api.post(`/matches/${matchId}/select-player`, { playerId }),

  // Score runs
  scoreRuns: (matchId, runs) => 
    api.post(`/matches/${matchId}/score-runs`, { runs }),

  // Score extra
  scoreExtra: (matchId, type, runs) => 
    api.post(`/matches/${matchId}/score-extra`, { type, runs }),

  // Player out
  playerOut: (matchId, dismissalType, fielderName) => 
    api.post(`/matches/${matchId}/player-out`, { dismissalType, fielderName }),

  // End innings
  endInnings: (matchId) => 
    api.post(`/matches/${matchId}/end-innings`),
};

// ============================================
// COMMENTARY APIs
// ============================================

export const commentaryAPI = {
  // Generate commentary with audio
  generateCommentaryWithAudio: (matchId, eventType, eventData, voice = 'alloy') =>
    api.post('/commentary/generate-with-audio', {
      matchId,
      eventType,
      eventData,
      voice,
    }),

  // Get match commentary history
  getMatchCommentary: (matchId, limit = 20, eventType = null) => {
    const params = { limit };
    if (eventType) params.eventType = eventType;
    return api.get(`/commentary/match/${matchId}`, { params });
  },

  // Get SSE stream URL
  getStreamURL: (matchId) => `${API_BASE_URL}/commentary/stream/${matchId}`,
};

// ============================================
// AUTH APIs (if needed)
// ============================================

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  checkAuth: () => api.get('/auth/check'),
};

export default api;