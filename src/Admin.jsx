import React, { useState } from 'react';
import { db } from './firebase';
import { ref, set } from 'firebase/database';


const GAMES = [
  { key: 'Circus', label: 'Circus' },
  { key: 'Labyrinth', label: 'Labyrinth' },
  { key: 'Cabin', label: 'Cabin' },
  { key: 'Sharpshooters', label: 'Sharpshooters' },
];


import './RockerToggle.css';

export default function Admin() {
  // Handler to close the modal manually (clear modal/highlight on leaderboard)
  const handleCloseModal = async () => {
    await set(ref(db, 'latestTeamPosted'), null);
    setMessage('Modal closed!');
  };
  // Handler to reset highlights (clear modal/highlight on leaderboard)
  const handleResetHighlights = async () => {
    await set(ref(db, 'latestTeamPosted'), null);
    setMessage('Highlights reset!');
  };
  // Only one useState for selected activity
  const [leaderboardView, setLeaderboardView] = useState(() => localStorage.getItem('leaderboardView') || 'escape');

  // Update localStorage and state for leaderboard view
  const handleLeaderboardToggle = (checked) => {
    const view = checked ? 'sharpshooters' : 'escape';
    setLeaderboardView(view);
    localStorage.setItem('leaderboardView', view);
  };
  const [selected, setSelected] = useState(''); // room or sharpshooters
  const [teamName, setTeamName] = useState('');
  const [escapeTime, setEscapeTime] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState('');
  const [message, setMessage] = useState('');

  const handlePost = async (e) => {
    e.preventDefault();
    let path = `leaderboard/${selected}`;
    let data, key;
    if (selected === 'Sharpshooters') {
      if (!playerName || !score) {
        setMessage('Player name and score required.');
        return;
      }
      key = playerName;
      data = { score: Number(score), createdAt: Date.now() };
    } else {
      if (!teamName || !escapeTime) {
        setMessage('Team name and time of escape required.');
        return;
      }
      key = teamName;
      data = { score: escapeTime, createdAt: Date.now() };
    }
  await set(ref(db, `${path}/${key}`), data);
  // Signal to leaderboard which team/activity was just posted (cross-device)
  await set(ref(db, 'latestTeamPosted'), { game: selected, team: key });
  setMessage('Posted!');
  setTeamName('');
  setEscapeTime('');
  setPlayerName('');
  setScore('');
  };


  // Set glow color based on selected activity
  let glow = '';
  if (selected === 'Circus') glow = '0 0 48px 12px #e53935, 0 0 8px 2px #e53935';
  else if (selected === 'Labyrinth') glow = '0 0 48px 12px #6b8e23, 0 0 8px 2px #6b8e23';
  else if (selected === 'Cabin') glow = '0 0 48px 12px #9b59b6, 0 0 8px 2px #9b59b6';
  else if (selected === 'Sharpshooters') glow = '0 0 48px 12px #2196f3, 0 0 8px 2px #2196f3';

  return (
    <>
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleResetHighlights}
          style={{
            fontSize: '1rem',
            padding: '6px 16px',
            borderRadius: '6px',
            background: '#222',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            opacity: 0.85,
          }}
        >
          Reset Highlights
        </button>
        <button
          onClick={handleCloseModal}
          style={{
            fontSize: '1rem',
            padding: '6px 16px',
            borderRadius: '6px',
            background: '#e53935',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            opacity: 0.85,
          }}
        >
          Close Finish Time
        </button>
      </div>
      {/* Cool toggle in top right */}
      <div className="rocker-toggle-container">
        <label className="rocker">
          <input
            type="checkbox"
            checked={leaderboardView === 'sharpshooters'}
            onChange={e => handleLeaderboardToggle(e.target.checked)}
            aria-checked={leaderboardView === 'sharpshooters'}
          />
          <span className="switch-left">ESC</span>
          <span className="switch-right">SS</span>
        </label>
      </div>
      <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#222', borderRadius: 12, color: '#fff', boxShadow: glow, position: 'relative' }}>
      {/* Activity selection */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {GAMES.map(g => (
          <button
            key={g.key}
            onClick={() => setSelected(g.key)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: selected === g.key ? '#444' : '#333',
              color: selected === g.key ? '#fff' : '#bbb',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              outline: selected === g.key ? '2px solid #fff' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {!selected ? (
        <div style={{ textAlign: 'center', color: '#ffd700', fontWeight: 500, marginTop: 32 }}>
          Please select an activity above to begin.
        </div>
      ) : (
        <form onSubmit={handlePost}>
          {selected === 'Sharpshooters' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label>Player Name:<br />
                  <input value={playerName} onChange={e => setPlayerName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', marginTop: 4 }} />
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Score:<br />
                  <input type="number" value={score} onChange={e => setScore(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', marginTop: 4 }} />
                </label>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label>Team Name:<br />
                  <input value={teamName} onChange={e => setTeamName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', marginTop: 4 }} />
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Time of Escape:<br />
                  <input value={escapeTime} onChange={e => setEscapeTime(e.target.value)} placeholder="e.g. 42:15" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', marginTop: 4 }} />
                </label>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" style={{ flex: 1, padding: '10px 0', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}>Post</button>
          </div>
        </form>
      )}

      {message && <p style={{ marginTop: 18, textAlign: 'center', color: '#ffd700', fontWeight: 500 }}>{message}</p>}
    </div>
    </>
  );
}
