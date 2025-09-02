import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const scoresRef = ref(db, 'leaderboard');
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val() || {};
      // data: { Circus: { team1: {score, createdAt}, ... }, ... }
      setScores(data);
    });
    return () => unsubscribe();
  }, []);

  // Group scores by game
  const games = ['Circus', 'Labyrinth', 'Cabin', 'Sharpshooters'];
  const grouped = {};
  games.forEach(game => {
    const gameData = scores && scores[game] ? scores[game] : {};
    const arr = Object.entries(gameData).map(([name, entry]) => ({ name, ...entry }));
    // For Sharpshooters, sort by score descending (higher is better), for others, sort by time ascending (lower is better)
    arr.sort((a, b) => {
      if (game === 'Sharpshooters') {
        return b.score - a.score;
      } else {
        // Try to parse time as mm:ss or as float seconds
        const parseTime = t => {
          if (typeof t === 'number') return t;
          if (typeof t === 'string' && t.includes(':')) {
            const [m, s] = t.split(':').map(Number);
            return m * 60 + s;
          }
          return parseFloat(t) || 0;
        };
        return parseTime(a.score) - parseTime(b.score);
      }
    });
    grouped[game] = arr.slice(0, 10);
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 32 }}>
      <div style={{ width: '100%', display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        {games.map(game => {
          let fontFamily = '';
          if (game === 'Circus') fontFamily = 'CircusFont';
          else if (game === 'Labyrinth') fontFamily = 'LabyrinthFont';
          else if (game === 'Cabin') fontFamily = 'CabinFont';
          else if (game === 'Sharpshooters') fontFamily = 'SharpshootersFont';

          // Determine columns and subtitle
          let col1 = '', col2 = '', subtitle = '';
          if (game === 'Sharpshooters') {
            col1 = 'Player Name';
            col2 = 'Score';
            subtitle = '30s Time Trial';
          } else {
            col1 = 'Team Name';
            col2 = 'Time of Escape';
          }

          // Set color for each game title
          let color = '';
          if (game === 'Circus') color = '#e53935'; // Red
          else if (game === 'Labyrinth') color = '#6b8e23'; // Moss green
          else if (game === 'Cabin') color = '#9b59b6'; // Purple
          else if (game === 'Sharpshooters') color = '#2196f3'; // Blue

          return (
            <div key={game} style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ textAlign: 'center', marginBottom: 8, fontFamily, fontSize: '2.8rem', letterSpacing: '0.05em', color }}>{game}</h3>
              {subtitle && (
                <div style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: 8, fontWeight: 400, opacity: 0.8 }}>{subtitle}</div>
              )}
              <table style={{ width: '100%' }}>
                <tbody>
                  {grouped[game].length === 0 ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center' }}>No scores</td></tr>
                  ) : (
                    grouped[game].slice(0, 20).map(({ name, score }, idx) => (
                      <tr key={name}>
                        <td style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>
                          <span style={{ fontWeight: 700, marginRight: 8 }}>{idx + 1}.</span>{name}
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px 8px', fontVariantNumeric: 'tabular-nums' }}>{score}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
