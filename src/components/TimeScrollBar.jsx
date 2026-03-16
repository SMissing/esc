import React, { useState, useRef, useEffect } from 'react';

export default function TimeScrollBar({ value, onChange, style = {} }) {
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) return parseInt(parts[0]) || 0;
    }
    return 0;
  });
  const [seconds, setSeconds] = useState(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) return parseInt(parts[1]) || 0;
    }
    return 0;
  });
  const minutesRef = useRef(null);
  const secondsRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // Parse value when it changes externally
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        const newMinutes = parseInt(parts[0]) || 0;
        const newSeconds = parseInt(parts[1]) || 0;
        setMinutes(newMinutes);
        setSeconds(newSeconds);
        // Update scroll positions
        setTimeout(() => {
          if (minutesRef.current) {
            minutesRef.current.scrollTop = newMinutes * 50;
          }
          if (secondsRef.current) {
            secondsRef.current.scrollTop = newSeconds * 50;
          }
        }, 0);
      }
    } else {
      setMinutes(0);
      setSeconds(0);
    }
  }, [value]);

  // Update parent when time changes internally
  useEffect(() => {
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (formatted !== value) {
      isInternalUpdate.current = true;
      onChange(formatted);
    }
  }, [minutes, seconds]);

  const handleMinutesChange = (newMinutes) => {
    setMinutes(Math.max(0, Math.min(99, newMinutes)));
  };

  const handleSecondsChange = (newSeconds) => {
    setSeconds(Math.max(0, Math.min(59, newSeconds)));
  };

  const generateNumbers = (min, max) => {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  };

  const minutesList = generateNumbers(0, 99);
  const secondsList = generateNumbers(0, 59);

  const handleScroll = (ref, list, handler) => {
    if (!ref.current) return;
    const scrollTop = ref.current.scrollTop;
    const itemHeight = 50;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(list.length - 1, index));
    handler(list[clampedIndex]);
  };

  // Initialize scroll positions on mount
  useEffect(() => {
    if (minutesRef.current) {
      const itemHeight = 50;
      minutesRef.current.scrollTop = minutes * itemHeight;
    }
    if (secondsRef.current) {
      const itemHeight = 50;
      secondsRef.current.scrollTop = seconds * itemHeight;
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      background: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid #444',
      ...style 
    }}>
      {/* Minutes Scroll */}
      <div style={{ flex: 1, position: 'relative', height: '200px', overflow: 'hidden' }}>
        <div
          ref={minutesRef}
          onScroll={(e) => handleScroll(minutesRef, minutesList, handleMinutesChange)}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #1a1a1a',
          }}
          onWheel={(e) => {
            e.preventDefault();
            if (minutesRef.current) {
              minutesRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          <div style={{ paddingTop: '75px', paddingBottom: '75px' }}>
            {minutesList.map((num) => (
              <div
                key={num}
                style={{
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: minutes === num ? 700 : 400,
                  color: minutes === num ? '#fff' : '#888',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  handleMinutesChange(num);
                  if (minutesRef.current) {
                    minutesRef.current.scrollTo({ top: num * 50, behavior: 'smooth' });
                  }
                }}
              >
                {String(num).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        {/* Selection highlight overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '50px',
            transform: 'translateY(-50%)',
            borderTop: '2px solid #4caf50',
            borderBottom: '2px solid #4caf50',
            pointerEvents: 'none',
            background: 'rgba(76, 175, 80, 0.1)',
          }}
        />
      </div>

      {/* Separator */}
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', padding: '0 4px' }}>
        :
      </div>

      {/* Seconds Scroll */}
      <div style={{ flex: 1, position: 'relative', height: '200px', overflow: 'hidden' }}>
        <div
          ref={secondsRef}
          onScroll={(e) => handleScroll(secondsRef, secondsList, handleSecondsChange)}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #1a1a1a',
          }}
          onWheel={(e) => {
            e.preventDefault();
            if (secondsRef.current) {
              secondsRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          <div style={{ paddingTop: '75px', paddingBottom: '75px' }}>
            {secondsList.map((num) => (
              <div
                key={num}
                style={{
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: seconds === num ? 700 : 400,
                  color: seconds === num ? '#fff' : '#888',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  handleSecondsChange(num);
                  if (secondsRef.current) {
                    secondsRef.current.scrollTo({ top: num * 50, behavior: 'smooth' });
                  }
                }}
              >
                {String(num).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        {/* Selection highlight overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '50px',
            transform: 'translateY(-50%)',
            borderTop: '2px solid #4caf50',
            borderBottom: '2px solid #4caf50',
            pointerEvents: 'none',
            background: 'rgba(76, 175, 80, 0.1)',
          }}
        />
      </div>
    </div>
  );
}
