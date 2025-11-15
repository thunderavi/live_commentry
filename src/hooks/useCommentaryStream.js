import { useState, useEffect, useCallback, useRef } from 'react';
import { commentaryService } from '../services/commentaryService';

export function useCommentaryStream(matchId) {
  const [connected, setConnected] = useState(false);
  const [commentary, setCommentary] = useState([]);
  const [latestCommentary, setLatestCommentary] = useState(null);
  const [scoreUpdate, setScoreUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('CLOSED');

  const audioRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const playNextAudioRef = useRef(null);
  const isConnectingRef = useRef(false);
  const hasInitializedRef = useRef(false); // ✅ Track if connection was initialized

  // Play next audio in queue
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioUrl = audioQueueRef.current.shift();
    
    console.log('▶️ Playing audio:', audioUrl);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');
    
    const fullUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${SERVER_BASE}${audioUrl}`;
    
    audio.src = fullUrl;
    audio.volume = 1.0;

    audio.onended = () => {
      console.log('✅ Audio finished');
      playNextAudioRef.current?.();
    };

    audio.onerror = (err) => {
      console.error('❌ Audio playback error:', err);
      playNextAudioRef.current?.();
    };

    audio.play().catch(err => {
      console.error('❌ Failed to play audio:', err);
      playNextAudioRef.current?.();
    });
  }, []);

  useEffect(() => {
    playNextAudioRef.current = playNextAudio;
  }, [playNextAudio]);

  const queueAudio = useCallback((audioUrl) => {
    console.log('🔊 Queueing audio:', audioUrl);
    audioQueueRef.current.push(audioUrl);
    
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  }, [playNextAudio]);

  const handleEvent = useCallback((data) => {
    console.log('🎙️ Commentary Hook received:', data.type);

    switch (data.type) {
      case 'connected': {
        setConnected(true);
        setConnectionState('OPEN');
        setError(null);
        console.log('✅ Connected to match:', data.matchId);
        break;
      }

      case 'score_update': {
        console.log('📊 Score update:', data.score);
        setScoreUpdate(data);
        break;
      }

      case 'commentary': {
        console.log('🎙️ Commentary received:', data.commentary.text);
        const newCommentary = data.commentary;
        
        setCommentary(prev => [newCommentary, ...prev].slice(0, 50));
        setLatestCommentary(newCommentary);
        
        if (newCommentary.audioUrl && newCommentary.hasAudio !== false) {
          queueAudio(newCommentary.audioUrl);
        } else {
          console.log('ℹ️ No audio available for this commentary');
        }
        
        setError(null);
        break;
      }

      case 'wicket': {
        console.log('🎯 Wicket!', data);
        setScoreUpdate(data);
        break;
      }

      case 'error': {
        console.warn('⚠️ Server error:', data.message);
        if (data.severity === 'error') {
          setError(data.message);
        } else if (data.severity === 'warning') {
          setError(data.message);
          setTimeout(() => setError(null), 5000);
        }
        break;
      }

      default: {
        console.log('📡 Unknown event type:', data.type);
        break;
      }
    }
  }, [queueAudio]);

  const handleError = useCallback((err) => {
    console.error('❌ Commentary stream error:', err);
    setError('Connection lost. Reconnecting...');
    setConnected(false);
    setConnectionState('ERROR');
  }, []);

  // ✅ Connect to stream - FIXED: No synchronous setState
  useEffect(() => {
    if (!matchId) {
      console.log('⚠️ No matchId provided');
      return;
    }

    // ✅ Prevent duplicate connections
    if (isConnectingRef.current) {
      console.log('⏳ Connection already in progress, skipping...');
      return;
    }

    // ✅ Check if already connected to this match
    const currentMatchId = commentaryService.getCurrentMatchId();
    if (currentMatchId === matchId && commentaryService.isConnected() && hasInitializedRef.current) {
      console.log('✅ Already connected to this match');
      return; // ✅ Don't call setState - let the interval update it
    }

    isConnectingRef.current = true;
    hasInitializedRef.current = true;
    console.log('🔌 Connecting to commentary stream for match:', matchId);
    
    commentaryService.connectToMatch(matchId, handleEvent, handleError);

    // Reset connecting flag after connection attempt
    const connectingTimeout = setTimeout(() => {
      isConnectingRef.current = false;
    }, 1000);

    // ✅ Update connection state periodically (async - safe in effect)
    const stateInterval = setInterval(() => {
      const state = commentaryService.getState();
      const isConnected = state === 'OPEN';
      
      // Only update state if it changed
      setConnectionState(prevState => prevState !== state ? state : prevState);
      setConnected(prevConnected => prevConnected !== isConnected ? isConnected : prevConnected);
    }, 2000);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting from commentary stream');
      clearTimeout(connectingTimeout);
      clearInterval(stateInterval);
      isConnectingRef.current = false;
      hasInitializedRef.current = false;
      commentaryService.disconnect();
      
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };
  }, [matchId, handleEvent, handleError]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    setError(null);
    isConnectingRef.current = false;
    hasInitializedRef.current = false;
    commentaryService.disconnect();
    
    if (matchId) {
      setTimeout(() => {
        hasInitializedRef.current = true;
        commentaryService.connectToMatch(matchId, handleEvent, handleError);
      }, 500);
    }
  }, [matchId, handleEvent, handleError]);

  // Clear commentary history
  const clearCommentary = useCallback(() => {
    setCommentary([]);
    setLatestCommentary(null);
  }, []);

  return {
    connected,
    commentary,
    latestCommentary,
    scoreUpdate,
    error,
    connectionState,
    reconnect,
    clearCommentary,
  };
}

export default useCommentaryStream;