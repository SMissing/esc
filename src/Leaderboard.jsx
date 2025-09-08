import React, { useEffect, useState, useRef } from 'react';
import NewTeamModal from './components/NewTeamModal';
import WordSwapList from './WordSwapList';
import './shinyText.css';

import './metallicPaint.css';
import './newRowHighlight.css';
// import './medalHighlight.css';
import { db } from './firebase';
import { ref, onValue } from 'firebase/database';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Leaderboard() {
  // Track if this is the first mount (refresh)
  const isFirstMount = useRef(true);
  const [scores, setScores] = useState([]);
  const [justPosted, setJustPosted] = useState(null); // { game, team }
  const rowRefs = useRef({});
  const [showSharpshooters, setShowSharpshooters] = useState(() => (localStorage.getItem('leaderboardView') === 'sharpshooters'));

  // Listen for changes to localStorage from other tabs/windows
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'leaderboardView') {
        setShowSharpshooters(e.newValue === 'sharpshooters');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  // Remove default body margin/padding for full-width TV display
  useEffect(() => {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflowX = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.boxSizing = 'border-box';
  }, []);

  useEffect(() => {
    const scoresRef = ref(db, 'leaderboard');
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val() || {};
      setScores(data);
    });
    return () => unsubscribe();
  }, []);

  // Listen for new post signal from admin via Firebase
  useEffect(() => {
    const latestTeamRef = ref(db, 'latestTeamPosted');
    const unsubscribe = onValue(latestTeamRef, (snapshot) => {
      const obj = snapshot.val();
      if (isFirstMount.current) {
        // On first mount (refresh), do not show modal/highlight
        isFirstMount.current = false;
        setJustPosted(null);
        return;
      }
      if (obj && obj.team && obj.game) {
        setJustPosted(obj);
      } else {
        setJustPosted(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Only show escape rooms or sharpshooters based on toggle
  const games = showSharpshooters ? ['Sharpshooters'] : ['Circus', 'Labyrinth', 'Cabin'];
  const grouped = {};
  games.forEach(game => {
    const gameData = scores && scores[game] ? scores[game] : {};
    const arr = Object.entries(gameData).map(([name, entry]) => ({ name, ...entry }));
    arr.sort((a, b) => {
      if (game === 'Sharpshooters') {
        return b.score - a.score;
      } else {
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
  grouped[game] = arr;
  });

  // Scroll to latest team row when scores or latestTeam changes
  // Scroll to the just posted team and keep highlight for 5 minutes or until a new post
  useEffect(() => {
    let timeoutId;
    if (justPosted && rowRefs.current[`${justPosted.game}-${justPosted.team}`]) {
      rowRefs.current[`${justPosted.game}-${justPosted.team}`].scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after 5 minutes
      timeoutId = setTimeout(() => {
        setJustPosted(null);
        localStorage.removeItem('latestTeamPosted');
      }, 5 * 60 * 1000);
    }
    // If a new post is made, clear previous highlight immediately
    const handleStorage = () => {
      const raw = localStorage.getItem('latestTeamPosted');
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          if (!justPosted || obj.team !== justPosted.team || obj.game !== justPosted.game) {
            setJustPosted(obj);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [justPosted, scores, games]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({});

  useEffect(() => {
    if (justPosted) {
      // Find score for the posted team
      const game = justPosted.game;
      const team = justPosted.team;
      const entry = scores[game]?.[team];
      let score = entry?.score || '00:00';
      // Get color and fontFamily
      let color = '#fff', fontFamily = 'Bebas Neue, sans-serif';
      if (game === 'Circus') { color = '#FF4A47FF'; fontFamily = 'CircusFont'; }
      else if (game === 'Labyrinth') { color = '#93C72CFF'; fontFamily = 'LabyrinthFont'; }
      else if (game === 'Cabin') { color = '#CC67F4FF'; fontFamily = 'CabinFont'; }
      else if (game === 'Sharpshooters') { color = '#2196f3'; fontFamily = 'SharpshootersFont'; }
      setModalProps({ open: true, game, team, score, color, fontFamily, onClose: () => setShowModal(false) });
      setShowModal(true);
    }
  }, [justPosted, scores]);

  return (
    <>
      {showModal && (
        <NewTeamModal {...modalProps} />
      )}
  <div style={{ minHeight: '100vh', background: '#141414FF', margin: 0, padding: 0, width: '100vw', overflow: 'auto', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 1 }}>
  {/* Sticky Top Banner */}
  <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100vw',
        left: 0,
        background: 'rgba(24,24,24,0.98)',
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: 0,
        padding: '36px 0 24px 0', // Increased padding for TV
        borderBottom: '4px solid #222',
        margin: 0,
        boxShadow: 'none',
        maxWidth: '100vw',
      }}>
        {games.map(game => {
          let fontFamily = '';
          if (game === 'Circus') fontFamily = 'CircusFont';
          else if (game === 'Labyrinth') fontFamily = 'LabyrinthFont';
          else if (game === 'Cabin') fontFamily = 'CabinFont';
          else if (game === 'Sharpshooters') fontFamily = 'SharpshootersFont';

          let color = '';
          if (game === 'Circus') color = '#FF4A47FF';
          else if (game === 'Labyrinth') color = '#93C72CFF';
          else if (game === 'Cabin') color = '#CC67F4FF';
          else if (game === 'Sharpshooters') color = '#2196f3';

          return (
            <div key={game} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <span
                style={{ fontFamily, fontSize: '11rem', letterSpacing: '0.07em', color, fontWeight: 700 }}
              >
                {game}
              </span>
            </div>
          );
        })}
      </div>
      {/* Main Content */}
  <div style={{ position: 'relative', width: '100vw', marginTop: 0, padding: 0, maxWidth: '100vw' }}>
    <div style={{ width: '100vw', display: 'flex', gap: 64, justifyContent: 'space-evenly', alignItems: 'flex-start', padding: 0, maxWidth: '100vw', position: 'relative', zIndex: 1 }}>
  {games.map(game => {
          let fontFamily = '';
          if (game === 'Circus') fontFamily = 'CircusFont';
          else if (game === 'Labyrinth') fontFamily = 'LabyrinthFont';
          else if (game === 'Cabin') fontFamily = 'CabinFont';
          else if (game === 'Sharpshooters') fontFamily = 'SharpshootersFont';

          let color = '';
          if (game === 'Circus') color = '#FF4A47FF';
          else if (game === 'Labyrinth') color = '#93C72CFF';
          else if (game === 'Cabin') color = '#CC67F4FF';
          else if (game === 'Sharpshooters') color = '#2196f3';

          let subtitle = '';
          if (game === 'Sharpshooters') subtitle = '30s Time Trial';

          return (
            <div key={game} style={{ flex: 1, minWidth: 0, padding: 0, background: 'none', boxShadow: 'none' }}>
              {subtitle && (
                <div style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: 18, fontWeight: 400, opacity: 0.13 }}>{subtitle}</div>
              )}
              <TableContainer sx={{ background: 'rgba(24,24,28,0.7)', boxShadow: 'none', maxHeight: 1800, minHeight: 900, overflow: 'auto', borderRadius: 24 }}>
                <Table stickyHeader size="small" aria-label={`${game} leaderboard`} sx={{ background: 'transparent', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem' }}>
                  <TableHead>
                    {/* Header Row (sticky) */}
                    <TableRow sx={{ position: 'sticky', top: 0, zIndex: 120 }}>
                      <TableCell sx={{ color: '#FFF5DAFF', fontWeight: 700, fontSize: '2.8rem', background: 'rgba(34,34,34,0.96)', fontFamily: 'Bebas Neue, sans-serif', padding: '32px 32px' }}>Place</TableCell>
                      <TableCell sx={{ color, fontWeight: 700, fontSize: '2.8rem', background: 'rgba(34,34,34,0.96)', fontFamily: 'Bebas Neue, sans-serif', padding: '32px 32px' }}>Name</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '2.8rem', background: 'rgba(34,34,34,0.96)', textAlign: 'right', fontFamily: 'Bebas Neue, sans-serif', padding: '32px 32px' }}>{game === 'Sharpshooters' ? 'Score' : 'Time'}</TableCell>
                    </TableRow>
                    {/* Top 3 Rows (not sticky, just follow header) with tie handling */}
                    {(() => {
                      let lastScore = null;
                      let place = 1;
                      return grouped[game].slice(0, 3).map(({ name, score }, idx, arr) => {
                        let metallicClass = '';
                        if (idx === 0) metallicClass = 'metallic-gold';
                        else if (idx === 1) metallicClass = 'metallic-silver';
                        else if (idx === 2) metallicClass = 'metallic-bronze';
                        const rowBg = idx % 2 === 0 ? 'rgba(24,24,28,0.92)' : 'rgba(66,66,66,0.7)';
                        // Compare score/time for ties
                        let displayPlace = place;
                        if (lastScore !== null) {
                          if (score !== lastScore) {
                            place = idx + 1;
                            displayPlace = place;
                          }
                        }
                        lastScore = score;
                        const isNew = justPosted && justPosted.game === game && justPosted.team === name;
                        let highlightClass = '';
                        if (isNew) {
                          if (game === 'Circus') highlightClass = 'new-row-highlight highlight-circus';
                          else if (game === 'Labyrinth') highlightClass = 'new-row-highlight highlight-labyrinth';
                          else if (game === 'Cabin') highlightClass = 'new-row-highlight highlight-cabin';
                          else if (game === 'Sharpshooters') highlightClass = 'new-row-highlight highlight-sharpshooters';
                        }
                        return (
                          <TableRow
                            key={name}
                            ref={el => {
                              if (el) rowRefs.current[`${game}-${name}`] = el;
                            }}
                            className={highlightClass}
                            sx={{ backgroundColor: rowBg, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', padding: '28px 32px' }}
                          >
                            <TableCell sx={{ color: '#fff', fontWeight: 700, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', background: rowBg }}>{displayPlace}</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 500, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', background: rowBg }}>
                              <span className={metallicClass}>{name}</span>
                            </TableCell>
                            <TableCell sx={{ color: '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', background: rowBg }}>{score}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableHead>
                  <TableBody>
                    {grouped[game].length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: 'center', color: '#bbb', background: 'rgba(24,24,28,0.5)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem' }}>No scores</TableCell>
                      </TableRow>
                    ) : (
                      (() => {
                        let lastScore = grouped[game][2] ? grouped[game][2].score : null;
                        let place = 4;
                        return grouped[game].slice(3).map(({ name, score }, idx) => {
                          const rowIdx = idx + 4;
                          const rowBg = (rowIdx - 1) % 2 === 0 ? 'rgba(24,24,28,0.5)' : 'rgba(66,66,66,0.3)';
                          let displayPlace = place;
                          if (lastScore !== null) {
                            if (score !== lastScore) {
                              place = rowIdx;
                              displayPlace = place;
                            }
                          }
                          lastScore = score;
                          const isNew = justPosted && justPosted.game === game && justPosted.team === name;
                          let highlightClass = '';
                          if (isNew) {
                            if (game === 'Circus') highlightClass = 'new-row-highlight highlight-circus';
                            else if (game === 'Labyrinth') highlightClass = 'new-row-highlight highlight-labyrinth';
                            else if (game === 'Cabin') highlightClass = 'new-row-highlight highlight-cabin';
                            else if (game === 'Sharpshooters') highlightClass = 'new-row-highlight highlight-sharpshooters';
                          }
                          return (
                            <TableRow
                              key={name}
                              ref={el => {
                                if (el) rowRefs.current[`${game}-${name}`] = el;
                              }}
                              className={highlightClass}
                              sx={{ backgroundColor: rowBg, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', padding: '24px 32px' }}
                            >
                              <TableCell sx={{ color: '#fff', fontWeight: 700, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}>{displayPlace}</TableCell>
                              <TableCell sx={{ color: '#fff', fontWeight: 500, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}>{name}</TableCell>
                              <TableCell sx={{ color: '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem' }}>{score}</TableCell>
                            </TableRow>
                          );
                        });
                      })()
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          );
        })}
      </div>
    </div>
    {/* Bottom Banner */}
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100vw',
      zIndex: 100,
      background: '#18181c',
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 0,
      padding: '32px 0 24px 96px',
      borderTop: '4px solid #222',
      margin: 0,
      boxShadow: 'none',
      maxWidth: '100vw',
      minHeight: '220px',
      opacity: 1,
      position: 'relative',
    }}>
  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '5.2rem', color: '#FFF5DA', fontWeight: 700, marginRight: 48, letterSpacing: '0.01em' }}>
        We Escaped the:
      </span>
      <WordSwapList
        texts={["Circus", "Labyrinth", "Cabin"]}
        rotationInterval={2000}
        mainClassName=""
        splitLevelClassName=""
        elementLevelClassName=""
        animate={{ y: 0, opacity: 1 }}
        initial={{ y: "100%", opacity: 0 }}
        exit={{ y: "-120%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '8.2rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          minWidth: 380,
          display: 'inline-block',
          textAlign: 'left',
        }}
      />
      {/* Version label in bottom right, always spaced from screen edge */}
      <span style={{
        position: 'fixed',
        right: '48px',
        bottom: '32px',
        fontSize: '2.2rem',
        color: '#bbb',
        opacity: 0.7,
        fontFamily: 'Bebas Neue, sans-serif',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'transparent',
        padding: '8px 24px',
        borderRadius: '12px',
      }}>
        Alpha 0.0.5
      </span>
    </div>
      </div>
    </>
  );
}
