import React, { useEffect, useState } from 'react';
import { FlapDisplay, Presets } from 'react-split-flap-effect';
import './NewTeamModal.css';

export default function NewTeamModal({ open, game, team, score, color, fontFamily, photo, onClose }) {
  // Displayed MM and SS for the split-flap
  const [displayMinutes, setDisplayMinutes] = useState('00');
  const [displaySeconds, setDisplaySeconds] = useState('00');
  const [animating, setAnimating] = useState(true);
  const [phase, setPhase] = useState('rolling'); // 'rolling' | 'final'

  useEffect(() => {
    if (!open) {
      setDisplayMinutes('00');
      setDisplaySeconds('00');
      setAnimating(false);
      setPhase('rolling');
      return;
    }

    // Parse final score (MM:SS) safely
    const safeScore = typeof score === 'string' ? score : '00:00';
    const parts = safeScore.split(':');
    const finalMm = (parts[0] || '00').padStart(2, '0');
    const finalSs = (parts[1] || '00').padStart(2, '0');

    // Phase 1: suspense roll – random MM:SS for ~7 seconds
    setPhase('rolling');
    setAnimating(true);

    const randomInterval = setInterval(() => {
      const mm = Math.floor(Math.random() * 60); // 00–59 minutes
      const ss = Math.floor(Math.random() * 60); // 00–59 seconds
      setDisplayMinutes(String(mm).padStart(2, '0'));
      setDisplaySeconds(String(ss).padStart(2, '0'));
    }, 120);

    // After 7 seconds, lock to final time
    const revealTimeout = setTimeout(() => {
      clearInterval(randomInterval);
      setDisplayMinutes(finalMm);
      setDisplaySeconds(finalSs);
      setPhase('final');
      setAnimating(false);
    }, 7000);

    // Auto-close after 16 seconds so the window never gets stuck
    const autoCloseTimeout = setTimeout(() => {
      if (onClose) onClose();
    }, 16000);

    return () => {
      clearInterval(randomInterval);
      clearTimeout(revealTimeout);
      clearTimeout(autoCloseTimeout);
    };
  }, [open, score, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#050509',
        }}
      >
        {/* Top 2/3: Photo (keeps full image, no squash) */}
        <div
          style={{
            height: '66%',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {photo ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
              }}
            >
              <img
                src={photo}
                alt={`${team} - ${game}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#777',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '2.5rem',
              }}
            >
              No photo captured
            </div>
          )}
        </div>

        {/* Bottom 1/3: Dark panel with countdown / final time */}
        <div
          style={{
            height: '34%',
            background: 'rgba(5,5,12,0.98)',
            borderTop: '2px solid #111',
            display: 'flex',
            alignItems: 'stretch',
            padding: '24px 40px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Game & team */}
          <div
            style={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: '4.6rem',
                color,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {game}
            </div>
            <div
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '3.8rem',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {team}
            </div>
          </div>

          {/* Right: Split-flap countdown / time */}
          <div
            style={{
              flex: 1.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlapDisplay
                value={displayMinutes}
                length={2}
                chars={Presets.NUM}
                timing={animating ? 120 : 0}
                hinge={true}
                padChar="0"
                padMode="auto"
                className="splitflap-modal large-flap"
                style={{ fontSize: '140px', height: '190px' }}
              />
              <FlapDisplay
                value=":"
                length={1}
                chars=":"
                className="splitflap-modal large-flap colon-flap"
                padChar=":"
                style={{ fontSize: '140px', height: '190px' }}
              />
              <FlapDisplay
                value={displaySeconds}
                length={2}
                chars={Presets.NUM}
                timing={animating ? 120 : 0}
                hinge={true}
                padChar="0"
                padMode="auto"
                className="splitflap-modal large-flap"
                style={{ fontSize: '140px', height: '190px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
