import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommentaryBox.css';

const CommentaryBox = ({ commentary, latestCommentary, connected, error }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);
  const commentaryListRef = useRef(null);

  // Auto-scroll to latest commentary
  useEffect(() => {
    if (commentaryListRef.current && latestCommentary) {
      commentaryListRef.current.scrollTop = 0;
    }
  }, [latestCommentary]);

  // Handle audio playback
  const playAudio = (audioUrl, commentaryId) => {
    if (!audioUrl) return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;
    setCurrentAudio(commentaryId);
    setIsPlaying(true);

    audio.play();

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAudio(null);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get event icon
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'SIX':
        return '🚀';
      case 'FOUR':
        return '🎯';
      case 'WICKET':
        return '🏏';
      case 'DOT_BALL':
        return '⚪';
      case 'WIDE':
      case 'NO_BALL':
        return '🔴';
      default:
        return '🔢';
    }
  };

  // Get priority class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'commentary-item-critical';
      case 'high':
        return 'commentary-item-high';
      case 'medium':
        return 'commentary-item-medium';
      case 'low':
        return 'commentary-item-low';
      default:
        return '';
    }
  };

  return (
    <div className="commentary-box">
      <div className="commentary-header">
        <div className="header-left">
          <div className="commentator-logo">
            🎙️
            {isPlaying && (
              <>
                <div className="wave-indicator active"></div>
                <div className="wave-indicator active wave-2"></div>
              </>
            )}
          </div>
          <div className="header-title">
            <h2>Live Commentary</h2>
            <div className="header-subtitle">AI-Powered Match Analysis</div>
          </div>
        </div>
        <div className="connection-status">
          {connected ? (
            <span className="status-connected">● LIVE</span>
          ) : (
            <span className="status-disconnected">● OFFLINE</span>
          )}
        </div>
      </div>

      {/* Audio Controls */}
      <div className="audio-controls">
        {isPlaying ? (
          <button className="audio-control-btn" onClick={stopAudio} title="Stop Audio">
            ⏸️
          </button>
        ) : (
          <button 
            className="audio-control-btn" 
            onClick={() => latestCommentary?.audioUrl && playAudio(latestCommentary.audioUrl, 'latest')} 
            disabled={!latestCommentary?.audioUrl} 
            title="Play Latest"
          >
            ▶️
          </button>
        )}
        
        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <span className="volume-text">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="commentary-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Latest Commentary Highlight */}
      {latestCommentary && (
        <div className="latest-commentary">
          <div className="latest-icon">{getEventIcon(latestCommentary.eventType)}</div>
          <div className="latest-content">
            <div className="latest-text">{latestCommentary.text}</div>
            <div className="latest-footer">
              {latestCommentary.audioUrl && (
                <button
                  className={`audio-play-btn ${currentAudio === 'latest' && isPlaying ? 'playing' : ''}`}
                  onClick={() => {
                    if (currentAudio === 'latest' && isPlaying) {
                      stopAudio();
                    } else {
                      playAudio(latestCommentary.audioUrl, 'latest');
                    }
                  }}
                >
                  {currentAudio === 'latest' && isPlaying ? '⏸️ Stop' : '▶️ Play'}
                </button>
              )}
              {latestCommentary.isAIGenerated === false && (
                <span className="fallback-badge">Fallback</span>
              )}
              {!latestCommentary.audioUrl && (
                <span className="no-audio-badge">No Audio</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Commentary List */}
      <div className="commentary-list" ref={commentaryListRef}>
        {commentary.length === 0 ? (
          <div className="no-commentary">
            <p>⏳ Waiting for match commentary...</p>
            <p className="hint">Commentary will appear here as the match progresses.</p>
          </div>
        ) : (
          commentary.map((item, index) => (
            <div
              key={item.id || index}
              className={`commentary-item ${getPriorityClass(item.priority)}`}
            >
              <div className="commentary-meta">
                <span className="commentary-icon">{getEventIcon(item.eventType)}</span>
                <span className="commentary-time">{formatTime(item.createdAt)}</span>
                <span className={`commentary-type ${item.eventType.toLowerCase()}`}>
                  {item.eventType}
                </span>
                {item.audioUrl && (
                  <button
                    className={`item-audio-btn ${currentAudio === item.id && isPlaying ? 'playing' : ''}`}
                    onClick={() => {
                      if (currentAudio === item.id && isPlaying) {
                        stopAudio();
                      } else {
                        playAudio(item.audioUrl, item.id);
                      }
                    }}
                  >
                    {currentAudio === item.id && isPlaying ? '⏸️' : '🔊'}
                  </button>
                )}
                {item.isAIGenerated === false && (
                  <span className="fallback-indicator" title="Fallback commentary">
                    FB
                  </span>
                )}
              </div>
              <div className="commentary-text">{item.text}</div>
              {item.eventData && (
                <div className="commentary-context">
                  {item.eventData.teamScore && (
                    <span className="context-score">{item.eventData.teamScore}</span>
                  )}
                  {item.eventData.overNumber && (
                    <span className="context-over">Ov: {item.eventData.overNumber}</span>
                  )}
                  {item.eventData.batterName && (
                    <span className="context-player">{item.eventData.batterName}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentaryBox;