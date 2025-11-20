import React, { useState, useEffect } from 'react';
import { matchAPI } from './services/api';
import { useCommentaryStream } from './hooks/useCommentaryStream';
import Scoreboard from './components/Scoreboard';
import CommentaryBox from './components/CommentaryBox';
import './App.css';

function App() {
  const [matchId, setMatchId] = useState('');
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use commentary stream hook
  const {
    connected,
    commentary,
    latestCommentary,
    scoreUpdate,
    error: streamError,
    connectionState,
    reconnect,
  } = useCommentaryStream(matchId);

  // Load match data
  const loadMatch = async (id) => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await matchAPI.getMatchById(id);
      setMatch(response.data.match);
      console.log('✅ Match loaded:', response.data.match);
    } catch (err) {
      console.error('❌ Failed to load match:', err);
      setError(err.response?.data?.message || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  // Handle match ID input
  const handleConnect = () => {
    if (matchId.trim()) {
      loadMatch(matchId.trim());
    }
  };

  // Auto-refresh match on score updates
  useEffect(() => {
    if (scoreUpdate && matchId) {
      console.log('🔄 Score update received, refreshing match data');
      loadMatch(matchId);
    }
  }, [scoreUpdate]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏏 CricketCast</h1>
        <p className="subtitle">  @ Powered by AI. Driven by Cricket.</p>
      </header>

      <main className="app-main">
        {/* Match Connection */}
        {!match && (
          <div className="connect-section">
            <div className="connect-box">
              <h2>Connect to a Match</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter Match ID"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                  className="match-input"
                />
                <button 
                  onClick={handleConnect}
                  disabled={loading || !matchId.trim()}
                  className="connect-button"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="helper-text">
                <p>💡 Enter a valid Match ID to start watching live commentary</p>
              </div>
            </div>
          </div>
        )}

        {/* Match Dashboard */}
        {match && (
          <>
            {/* Connection Info Bar */}
            <div className={`connection-bar ${connected ? 'connected' : 'disconnected'}`}>
              <div className="connection-info">
                <span className="status-dot"></span>
                <span className="status-text">
                  {connected ? '🟢 Connected to Live Stream' : '🔴 Disconnected'}
                </span>
                <span className="state-badge">{connectionState}</span>
              </div>
              <div className="connection-actions">
                <span className="match-id-display">Match: {matchId}</span>
                {!connected && (
                  <button onClick={reconnect} className="reconnect-btn">
                    🔄 Reconnect
                  </button>
                )}
                <button 
                  onClick={() => {
                    setMatch(null);
                    setMatchId('');
                  }}
                  className="disconnect-btn"
                >
                  ✕ Disconnect
                </button>
              </div>
            </div>

            {streamError && (
              <div className="stream-error">
                ⚠️ Stream Error: {streamError}
              </div>
            )}

            {/* HORIZONTAL LAYOUT: Scoreboard + Commentary */}
            <div className="dashboard-horizontal">
              {/* LEFT: Scoreboard Section */}
              <div className="scoreboard-section">
                <Scoreboard match={match} scoreUpdate={scoreUpdate} />
              </div>

              {/* RIGHT: Commentary Section */}
              <div className="commentary-section">
                <CommentaryBox 
                  commentary={commentary}
                  latestCommentary={latestCommentary}
                  connected={connected}
                  error={streamError}
                  match={match}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ using React + Vite | Gemini & TTS | By Avi Ranjan Prasad</p>
      </footer>
    </div>
  );
}

export default App;