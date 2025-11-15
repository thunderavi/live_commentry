import React, { useState } from 'react';
import { matchAPI } from '../services/api';
import '../styles/MatchControls.css';

const MatchControls = ({ matchId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleScoreRuns = async (runs) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await matchAPI.scoreRuns(matchId, runs);
      setMessage(`✅ ${runs} run(s) scored!`);
      if (onUpdate) onUpdate(response.data);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Error scoring runs'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerOut = async () => {
    if (!confirm('Mark current player as OUT?')) return;
    
    setLoading(true);
    setMessage('');
    try {
      const response = await matchAPI.playerOut(matchId, 'caught', 'Fielder');
      setMessage('✅ Player out!');
      if (onUpdate) onUpdate(response.data);
      
      if (response.data.shouldEndInnings) {
        setMessage(`⚠️ ${response.data.endReason}`);
      }
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Error marking player out'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExtra = async (type) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await matchAPI.scoreExtra(matchId, type, 1);
      setMessage(`✅ ${type.toUpperCase()} scored!`);
      if (onUpdate) onUpdate(response.data);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Error scoring extra'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-controls">
      <h3>Match Controls</h3>
      
      {message && (
        <div className={`message ${message.startsWith('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Run Scoring Buttons */}
      <div className="controls-section">
        <h4>Score Runs</h4>
        <div className="button-grid">
          <button
            onClick={() => handleScoreRuns(0)}
            disabled={loading}
            className="btn btn-dot"
          >
            Dot Ball
          </button>
          <button
            onClick={() => handleScoreRuns(1)}
            disabled={loading}
            className="btn btn-runs"
          >
            1 Run
          </button>
          <button
            onClick={() => handleScoreRuns(2)}
            disabled={loading}
            className="btn btn-runs"
          >
            2 Runs
          </button>
          <button
            onClick={() => handleScoreRuns(3)}
            disabled={loading}
            className="btn btn-runs"
          >
            3 Runs
          </button>
          <button
            onClick={() => handleScoreRuns(4)}
            disabled={loading}
            className="btn btn-four"
          >
            🎯 FOUR
          </button>
          <button
            onClick={() => handleScoreRuns(6)}
            disabled={loading}
            className="btn btn-six"
          >
            🚀 SIX
          </button>
        </div>
      </div>

      {/* Wicket Button */}
      <div className="controls-section">
        <h4>Wicket</h4>
        <button
          onClick={handlePlayerOut}
          disabled={loading}
          className="btn btn-wicket"
        >
          🏏 WICKET
        </button>
      </div>

      {/* Extras */}
      <div className="controls-section">
        <h4>Extras</h4>
        <div className="button-grid">
          <button
            onClick={() => handleExtra('wide')}
            disabled={loading}
            className="btn btn-extra"
          >
            Wide
          </button>
          <button
            onClick={() => handleExtra('noball')}
            disabled={loading}
            className="btn btn-extra"
          >
            No Ball
          </button>
          <button
            onClick={() => handleExtra('bye')}
            disabled={loading}
            className="btn btn-extra"
          >
            Bye
          </button>
          <button
            onClick={() => handleExtra('legbye')}
            disabled={loading}
            className="btn btn-extra"
          >
            Leg Bye
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default MatchControls;