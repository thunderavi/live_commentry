import React from 'react';
import '../styles/Scoreboard.css';

const Scoreboard = ({ match, scoreUpdate }) => {
  if (!match) {
    return (
      <div className="scoreboard">
        <p>No match data available</p>
      </div>
    );
  }

  // Get innings data
  const innings1 = match.innings1Score || match.scores?.[0] || {};
  const innings2 = match.innings2Score || match.scores?.[1] || {};
  
  // Determine current innings
  const currentInningsNumber = match.currentInnings || 1;
  const currentInnings = currentInningsNumber === 1 ? innings1 : innings2;

  // ✅ Merge scoreUpdate with match data (prefer fresh data)
  const displayScore = {
    runs: scoreUpdate?.score?.runs ?? currentInnings.runs ?? 0,
    wickets: scoreUpdate?.score?.wickets ?? currentInnings.wickets ?? 0,
    overs: scoreUpdate?.score?.overs ?? currentInnings.overs ?? '0.0',
    runRate: scoreUpdate?.score?.runRate ?? currentInnings.runRate ?? 0,
    fours: scoreUpdate?.score?.fours ?? currentInnings.fours ?? 0,
    sixes: scoreUpdate?.score?.sixes ?? currentInnings.sixes ?? 0,
    balls: currentInnings.balls ?? 0,
    currentOver: currentInnings.currentOver ?? []
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <div className="teams">
          <div className="team">
            <img src={match.team1?.logo} alt={match.team1?.name} className="team-logo" />
            <span className="team-name">{match.team1?.name}</span>
          </div>
          <span className="vs">vs</span>
          <div className="team">
            <img src={match.team2?.logo} alt={match.team2?.name} className="team-logo" />
            <span className="team-name">{match.team2?.name}</span>
          </div>
        </div>
        
        {/* ✅ Current Batting Team Indicator */}
        <div className="batting-indicator">
          <span className="batting-label">Batting:</span>
          <span className="batting-team">
            {currentInningsNumber === 1 ? match.battingFirst?.name : match.fieldingFirst?.name}
          </span>
        </div>
      </div>

      <div className="scoreboard-main">
        <div className="score-display">
          <div className="score-big">
            {displayScore.runs}/{displayScore.wickets}
          </div>
          <div className="overs">
            Overs: {displayScore.overs}
          </div>
          <div className="balls-count">
            ({displayScore.balls} balls)
          </div>
        </div>

        <div className="score-details">
          <div className="stat">
            <span className="stat-label">Run Rate:</span>
            <span className="stat-value">{Number(displayScore.runRate).toFixed(2)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Fours:</span>
            <span className="stat-value four-value">{displayScore.fours}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Sixes:</span>
            <span className="stat-value six-value">{displayScore.sixes}</span>
          </div>
        </div>

        {/* Current Over */}
        {displayScore.currentOver && displayScore.currentOver.length > 0 && (
          <div className="current-over">
            <span className="over-label">This Over:</span>
            <div className="over-balls">
              {displayScore.currentOver.map((ball, index) => (
                <span 
                  key={index} 
                  className={`ball ${
                    ball === 'W' ? 'wicket' : 
                    ball === 6 ? 'six' : 
                    ball === 4 ? 'four' : 
                    ball === 0 ? 'dot' : ''
                  }`}
                >
                  {ball}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Innings Status */}
        <div className="innings-status">
          <span className="status-badge status-live">{match.status?.toUpperCase()}</span>
          <span className="innings-badge">
            {currentInningsNumber === 1 ? '1st' : '2nd'} Innings
          </span>
        </div>

        {/* Target Info (for 2nd innings) */}
        {currentInningsNumber === 2 && innings2.target && match.status === 'live' && (
          <div className="target-info">
            <div className="target">
              <span className="target-label">Target:</span>
              <span className="target-value">{innings2.target}</span>
            </div>
            <div className="required">
              <span className="required-label">Need:</span>
              <span className="required-value">
                {Math.max(0, innings2.target - displayScore.runs)} runs from {Math.max(0, (120 - displayScore.balls))} balls
              </span>
            </div>
          </div>
        )}

        {/* Match Result */}
        {match.status === 'completed' && match.resultText && (
          <div className="match-result">
            <div className="result-trophy">🏆</div>
            <div className="result-text">{match.resultText}</div>
            {match.winner && (
              <div className="winner-name">{match.winner.name}</div>
            )}
          </div>
        )}
      </div>

      {/* Innings Summary */}
      <div className="innings-summary">
        <div className={`innings-box ${currentInningsNumber === 1 ? 'active' : ''}`}>
          <div className="innings-title">1st Innings</div>
          <div className="innings-team">{match.battingFirst?.name}</div>
          <div className="innings-score">
            {innings1.runs || 0}/{innings1.wickets || 0} ({innings1.overs || '0.0'})
          </div>
          <div className="innings-extras">
            {innings1.fours || 0} x 4s, {innings1.sixes || 0} x 6s
          </div>
        </div>
        
        <div className={`innings-box ${currentInningsNumber === 2 ? 'active' : match.status === 'setup' ? 'inactive' : ''}`}>
          <div className="innings-title">2nd Innings</div>
          {match.status === 'setup' ? (
            <>
              <div className="innings-team">{match.fieldingFirst?.name}</div>
              <div className="innings-score inactive-text">Yet to bat</div>
            </>
          ) : (
            <>
              <div className="innings-team">{match.fieldingFirst?.name}</div>
              <div className="innings-score">
                {innings2.runs || 0}/{innings2.wickets || 0} ({innings2.overs || '0.0'})
              </div>
              <div className="innings-extras">
                {innings2.fours || 0} x 4s, {innings2.sixes || 0} x 6s
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;