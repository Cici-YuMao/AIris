import React from 'react';
import './Logo.css';

function AirisLogo({ size = 'medium', showText = true, animated = false }) {
  const sizeClass = `logo-${size}`;
  const animatedClass = animated ? 'logo-animated' : '';

  return (
    <div className={`airis-logo ${sizeClass} ${animatedClass}`}>
      <div className="logo-icon">
        <div className="heart-shape">
          <div className="heart-left"></div>
          <div className="heart-right"></div>
          <div className="heart-sparkle heart-sparkle-1">✨</div>
          <div className="heart-sparkle heart-sparkle-2">💫</div>
        </div>
      </div>
      {showText && (
        <div className="logo-text" style={{ textAlign: 'left', alignItems: 'flex-start', display: 'flex', flexDirection: 'column', marginLeft: '1.2em', marginTop: '1.1em' }}>
          <span className="logo-tagline" style={{
            fontSize: '0.95rem',
            fontWeight: 500,
            fontStyle: 'italic',
            color: '#6c757d',
            opacity: 0.7,
            textShadow: '0 2px 8px #fff6, 0 1px 0 #fff',
            lineHeight: 1.32,
            textAlign: 'left',
            display: 'block',
            whiteSpace: 'pre-line',
            marginLeft: 0,
            letterSpacing: '0.01em',
          }}>
            AI-powered Smart Matchmaking Platform{"\n"}Making connections simple and natural
          </span>
        </div>
      )}
    </div>
  );
}

export default AirisLogo;
