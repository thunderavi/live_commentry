import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommentaryBox.css';

const CommentaryBox = ({ commentary, latestCommentary, connected, error, match }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

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
        return '📢';
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

  // Get innings data - matching backend structure
  const innings1 = match?.innings1Score || match?.scores?.[0] || {};
  const innings2 = match?.innings2Score || match?.scores?.[1] || {};
  const currentInningsNumber = match?.currentInnings || 1;
  const currentInnings = currentInningsNumber === 1 ? innings1 : innings2;

  // Get completed players and current player
  const completedPlayers = currentInnings?.completedPlayers || [];
  const currentPlayer = currentInnings?.currentPlayer || null;

  return (
    <div className="commentary-box">
      {/* HEADER with Commentator Icon and Audio Controls */}
      <div className="commentary-header">
        <div className="commentator-section">
          <div className="commentator-avatar">
            <div className="avatar-icon">🎙️</div>
            {isPlaying && (
              <>
                <div className="sound-wave wave-1"></div>
                <div className="sound-wave wave-2"></div>
                <div className="sound-wave wave-3"></div>
              </>
            )}
          </div>
          <div className="commentator-info">
            <h3>AI Commentator</h3>
            <span className={`status-badge ${connected ? 'live' : 'offline'}`}>
              {connected ? '● LIVE' : '● OFFLINE'}
            </span>
          </div>
        </div>

        <div className="audio-controls-top">
          <button 
            className="audio-btn"
            onClick={isPlaying ? stopAudio : () => latestCommentary?.audioUrl && playAudio(latestCommentary.audioUrl, 'latest')}
            disabled={!latestCommentary?.audioUrl}
            title={isPlaying ? "Stop Audio" : "Play Latest"}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="volume-wrapper">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider-top"
            />
            <span className="volume-percentage">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* MAIN HORIZONTAL CONTENT */}
      <div className="commentary-main-horizontal">
        {/* TEAM SCORE BOX */}
        <div className="score-box">
          <div className="score-box-header">
            <img 
              src={currentInningsNumber === 1 ? match?.team1?.logo : match?.team2?.logo} 
              alt="Team Logo"
              className="team-logo"
            />
            <div className="team-info">
              <h4>{currentInningsNumber === 1 ? match?.team1?.name : match?.team2?.name}</h4>
              <span className="innings-label">{currentInningsNumber === 1 ? '1st' : '2nd'} Inn</span>
            </div>
          </div>
          <div className="score-display">
            <div className="score-big">{currentInnings.runs || 0}/{currentInnings.wickets || 0}</div>
            <div className="score-meta">
              <span>Ov: {currentInnings.overs || '0.0'}</span>
              <span className="separator">•</span>
              <span>RR: {currentInnings.runRate?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* PLAYERS BOX */}
        <div className="players-box">
          <div className="players-box-header">
            <span>🏏 Batsmen</span>
          </div>
          <div className="players-horizontal">
            {currentPlayer && (
              <div className="player-card current">
                <img 
                  src={currentPlayer.player?.photo || '/default-player.png'} 
                  alt={currentPlayer.player?.playerName}
                  className="player-img"
                />
                <span className="player-name-horizontal">
                  {currentPlayer.player?.playerName || 'Current'} ⭐
                </span>
              </div>
            )}

            {completedPlayers && completedPlayers.slice(0, 5).map((cp, idx) => {
              const playerName = cp.player?.playerName || cp.player?.name || 'Unknown';
              const playerPhoto = cp.player?.photo || '/default-player.png';
              return (
                <div key={idx} className="player-card">
                  <img 
                    src={playerPhoto} 
                    alt={playerName}
                    className="player-img"
                  />
                  <span className="player-name-horizontal">{playerName}</span>
                </div>
              );
            })}

            {!currentPlayer && (!completedPlayers || completedPlayers.length === 0) && (
              <div className="no-players-horizontal">
                <span>⏳ Waiting for players...</span>
              </div>
            )}
          </div>
        </div>

        
        {/* COMMENTARY CARDS BOX */}
        <div className="commentary-cards-box">
          <div className="commentary-cards-header">
            <span>📢 Commentary Feed</span>
          </div>
          <div className="commentary-cards-horizontal">
            {commentary.length === 0 ? (
              <div className="no-commentary-horizontal">
                <p>⏳ Waiting for commentary...</p>
              </div>
            ) : (
              commentary.slice(0, 6).map((item, index) => (
                <div
                  key={item.id || index}
                  className={`commentary-card ${getPriorityClass(item.priority)}`}
                >
                  <div className="card-header-mini">
                    <span className="card-icon">{getEventIcon(item.eventType)}</span>
                    <span className="card-time">{formatTime(item.createdAt)}</span>
                  </div>
                  <div className="card-text">{item.text}</div>
                  <div className="card-footer-mini">
                    <span className={`card-type ${item.eventType.toLowerCase()}`}>
                      {item.eventType}
                    </span>
                    {item.audioUrl && (
                      <button
                        className={`card-audio-btn ${currentAudio === item.id && isPlaying ? 'playing' : ''}`}
                        onClick={() => {
                          if (currentAudio === item.id && isPlaying) {
                            stopAudio();
                          } else {
                            playAudio(item.audioUrl, item.id);
                          }
                        }}
                      >
                        {currentAudio === item.id && isPlaying ? '⏸️' : '▶️'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentaryBox;