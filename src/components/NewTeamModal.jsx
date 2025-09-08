import React, { useEffect, useState } from 'react';
import { FlapDisplay, Presets } from 'react-split-flap-effect';
import './NewTeamModal.css';

export default function NewTeamModal({ open, game, team, score, color, fontFamily, onClose }) {
  const [displayScore, setDisplayScore] = useState('00:00');
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    if (!open) return;
    setDisplayScore('00:00');
    setAnimating(true);
    // Animate random numbers for 5 seconds, then show actual score for 5 seconds
    const randomInterval = setInterval(() => {
      setDisplayScore(
        score.length === 5
          ? `${Math.floor(Math.random()*60).toString().padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`
          : Math.floor(Math.random()*9999).toString()
      );
    }, 120);
    const showScoreTimeout = setTimeout(() => {
      clearInterval(randomInterval);
      setDisplayScore(score);
      setAnimating(false);
    }, 5000);
    return () => {
      clearInterval(randomInterval);
      clearTimeout(showScoreTimeout);
    };
  }, [open, score, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(24,24,28,0.96)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        background: '#18181c',
        borderRadius: 48,
        boxShadow: '0 16px 64px #000a',
        padding: '96px 128px',
        minWidth: 840,
        maxWidth: '95vw',
        textAlign: 'center',
        border: `8px solid ${color}`,
      }}>
        <div style={{
          fontFamily,
          fontSize: '6.4rem',
          color,
          fontWeight: 700,
          marginBottom: 48,
        }}>{game}</div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '5.2rem',
          color: '#fff',
          fontWeight: 700,
          marginBottom: 64,
        }}>{team}</div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          {displayScore.length === 5 && displayScore.includes(':') ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlapDisplay
                value={displayScore.split(':')[0]}
                length={2}
                chars={Presets.NUM}
                timing={animating ? 120 : 0}
                hinge={true}
                padChar={'0'}
                padMode={'auto'}
                className="splitflap-modal large-flap"
                style={{ fontSize: '128px', height: '180px' }}
              />
            <FlapDisplay
              value={":"}
              length={1}
              chars=":"
              className="splitflap-modal large-flap colon-flap"
              padChar=":"
              style={{ fontSize: '128px', height: '180px' }}
            />
              <FlapDisplay
                value={displayScore.split(':')[1]}
                length={2}
                chars={Presets.NUM}
                timing={animating ? 120 : 0}
                hinge={true}
                padChar={'0'}
                padMode={'auto'}
                className="splitflap-modal large-flap"
                style={{ fontSize: '128px', height: '180px' }}
              />
            </div>
          ) : (
            <FlapDisplay
              value={displayScore}
              length={displayScore.length}
              chars={Presets.NUM}
              timing={animating ? 120 : 0}
              hinge={true}
              padChar={'0'}
              padMode={'auto'}
              className="splitflap-modal large-flap"
              style={{ fontSize: '128px', height: '180px' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
