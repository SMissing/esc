import React, { useState } from 'react';
import { db, app } from './firebase';
import { ref, set } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import TimeScrollBar from './components/TimeScrollBar';
import PhotoCapture from './components/PhotoCapture';


const GAMES = [
  { key: 'Circus', label: 'Circus' },
  { key: 'Labyrinth', label: 'Labyrinth' },
  { key: 'Cabin', label: 'Cabin' },
];



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
  const [selected, setSelected] = useState(''); // escape room
  const [teamName, setTeamName] = useState('');
  const [escapeTime, setEscapeTime] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [pendingPost, setPendingPost] = useState(null); // Store form data while capturing photo

  const handlePost = async (e) => {
    e.preventDefault();
    if (!teamName || !escapeTime) {
      setMessage('Team name and time of escape required.');
      return;
    }
    // Store form data and show photo capture
    setPendingPost({ selected, teamName, escapeTime, customerEmail });
    setShowPhotoCapture(true);
  };

  const handlePhotoCaptured = async (photoData) => {
    setShowPhotoCapture(false);
    if (!pendingPost) return;

    const { selected, teamName, escapeTime, customerEmail } = pendingPost;
    let path = `leaderboard/${selected}`;
    let key = teamName;
    let data = { 
      score: escapeTime, 
      photo: photoData, // Store photo as base64
      createdAt: Date.now() 
    };
    
    await set(ref(db, `${path}/${key}`), data);
    // Signal to leaderboard which team/activity was just posted (cross-device)
    await set(ref(db, 'latestTeamPosted'), { 
      game: selected, 
      team: key,
      photo: photoData,
      score: escapeTime
    });
    
    // Send email to customer if email provided (non-blocking)
    if (customerEmail && customerEmail.trim()) {
      // Send email in background - don't block the UI
      (async () => {
        try {
          // Initialize Firebase Functions - specify region explicitly
          const functions = getFunctions(app, 'us-central1');
          const sendEscapePhoto = httpsCallable(functions, 'sendEscapePhoto');
          
          const result = await sendEscapePhoto({
            photoBase64: photoData,
            teamName,
            roomName: selected,
            escapeTime,
            customerEmail: customerEmail.trim(),
          });
          console.log('Email sent successfully:', result.data);
          // Update message if still on same page
          setMessage('Posted! ✓ Email sent');
        } catch (error) {
          console.error('Error sending email:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          // Email failure is non-critical - don't show error to user
          // The post was successful, that's what matters
        }
      })();
      setMessage('Posted! (Sending email...)');
    } else {
      setMessage('Posted!');
    }
    
    setTeamName('');
    setEscapeTime('');
    setCustomerEmail('');
    setPendingPost(null);
  };

  const handlePhotoCaptureCancel = () => {
    setShowPhotoCapture(false);
    setPendingPost(null);
  };


  // Set glow color based on selected activity
  let glow = '';
  if (selected === 'Circus') glow = '0 0 48px 12px #e53935, 0 0 8px 2px #e53935';
  else if (selected === 'Labyrinth') glow = '0 0 48px 12px #6b8e23, 0 0 8px 2px #6b8e23';
  else if (selected === 'Cabin') glow = '0 0 48px 12px #9b59b6, 0 0 8px 2px #9b59b6';

  return (
    <>
      {showPhotoCapture && (
        <PhotoCapture 
          onPhotoCapture={handlePhotoCaptured}
          onClose={handlePhotoCaptureCancel}
        />
      )}
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
      <div style={{ 
        width: '600px',
        minHeight: '650px',
        margin: '40px auto', 
        padding: '32px', 
        background: '#222', 
        borderRadius: '16px', 
        color: '#fff', 
        boxShadow: glow, 
        position: 'relative',
        border: '1px solid #333'
      }}>
      {/* Activity selection */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        {GAMES.map(g => (
          <button
            key={g.key}
            onClick={() => setSelected(g.key)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: selected === g.key ? '#444' : '#333',
              color: selected === g.key ? '#fff' : '#bbb',
              border: selected === g.key ? '2px solid #fff' : '2px solid #444',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.2rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {!selected ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#ffd700', 
          fontWeight: 500, 
          marginTop: '80px',
          fontSize: '1.2rem'
        }}>
          Please select an activity above to begin.
        </div>
      ) : (
        <form onSubmit={handlePost}>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#fff'
            }}>
              Team Name
            </label>
            <input 
              value={teamName} 
              onChange={e => setTeamName(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '8px', 
                border: '2px solid #444', 
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '1.1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4caf50'}
              onBlur={(e) => e.target.style.borderColor = '#444'}
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#fff'
            }}>
              Time of Escape
            </label>
            <TimeScrollBar 
              value={escapeTime} 
              onChange={setEscapeTime}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#fff'
            }}>
              Customer Email (Optional)
            </label>
            <input 
              type="email"
              value={customerEmail} 
              onChange={e => setCustomerEmail(e.target.value)} 
              placeholder="customer@example.com"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '8px', 
                border: '2px solid #444', 
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '1.1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4caf50'}
              onBlur={(e) => e.target.style.borderColor = '#444'}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button 
              type="submit" 
              style={{ 
                flex: 1, 
                padding: '14px 0', 
                background: '#4caf50', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '1.2rem', 
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#45a049'}
              onMouseLeave={(e) => e.target.style.background = '#4caf50'}
            >
              Post
            </button>
          </div>
        </form>
      )}

      {message && (
        <p style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          color: '#ffd700', 
          fontWeight: 500,
          fontSize: '1.1rem'
        }}>
          {message}
        </p>
      )}
    </div>
    </>
  );
}
