import React, { useState } from 'react';
import { db } from './firebase';
import { ref, set } from 'firebase/database';

const GAMES = [
  { key: 'Circus', label: 'Circus' },
  { key: 'Labyrinth', label: 'Labyrinth' },
  { key: 'Cabin', label: 'Cabin' },
  { key: 'Sharpshooters', label: 'Sharpshooters' },
];

export default function Admin() {
  const [selected, setSelected] = useState('Circus');
  const [teamName, setTeamName] = useState('');
  const [escapeTime, setEscapeTime] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
    setMessage('Posted!');
    setTeamName('');
    setEscapeTime('');
    setPlayerName('');
    setScore('');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    setMessage('Page refreshed!');
  };

  return (
    <div key={refreshKey} style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#222', borderRadius: 12, color: '#fff' }}>
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
          <button type="button" onClick={handleRefresh} style={{ flex: 1, padding: '10px 0', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}>Refresh Page</button>
        </div>
      </form>
      {message && <p style={{ marginTop: 18, textAlign: 'center', color: '#ffd700', fontWeight: 500 }}>{message}</p>}
    </div>
  );
}
