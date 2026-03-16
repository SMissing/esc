import React, { useRef, useState, useEffect } from 'react';

export default function PhotoCapture({ onPhotoCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [showFileInput, setShowFileInput] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(window.isSecureContext);

  useEffect(() => {
    // Start camera when component mounts
    startCamera();
    return () => {
      // Cleanup: stop camera when component unmounts
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    // Check if we're in a secure context
    if (!window.isSecureContext && window.location.protocol !== 'https:') {
      setError('Camera requires HTTPS or localhost. Using HTTP over network is not supported. Please use file upload instead.');
      setShowFileInput(true);
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not available. Please use file upload instead.');
      setShowFileInput(true);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      setShowFileInput(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Unable to access camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in browser settings, or use file upload.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please use file upload instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use. Please close other apps using the camera, or use file upload.';
      } else if (err.name === 'SecurityError' || err.message?.includes('secure context')) {
        errorMessage += 'Camera requires HTTPS. Please use https:// instead of http://, or use file upload.';
      } else {
        errorMessage += 'Please check permissions and try again, or use file upload.';
      }
      setError(errorMessage);
      setShowFileInput(true);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoData);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      stopCamera();
      onPhotoCapture(capturedPhoto);
    }
  };

  const cancel = () => {
    stopCamera();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {error ? (
        <div style={{ color: '#fff', textAlign: 'center', padding: '20px', maxWidth: '600px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px', lineHeight: '1.6' }}>{error}</p>
          {showFileInput && (
            <div style={{ marginBottom: '20px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '14px 32px',
                  background: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '12px',
                  display: 'block',
                  width: '100%',
                }}
              >
                Choose Photo from Gallery
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={startCamera}
              style={{
                padding: '12px 24px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Try Camera Again
            </button>
            <button
              onClick={cancel}
              style={{
                padding: '12px 24px',
                background: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : capturedPhoto ? (
        // Preview captured photo
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '20px',
        }}>
          <img 
            src={capturedPhoto} 
            alt="Captured" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '70vh', 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }} 
          />
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={retakePhoto}
              style={{
                padding: '14px 32px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retake
            </button>
            <button
              onClick={confirmPhoto}
              style={{
                padding: '14px 32px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Use This Photo
            </button>
          </div>
        </div>
      ) : (
        // Camera view
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '800px',
            aspectRatio: '4/3',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '14px 32px',
                background: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Choose from Gallery
            </button>
            <button
              onClick={cancel}
              style={{
                padding: '14px 32px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              style={{
                padding: '14px 32px',
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Capture Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
