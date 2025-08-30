import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import AirisLogo from '../Logo/AirisLogo.jsx';
import './AccountActivation.css';

const AccountActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activateAccount } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleActivation = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setStatus('error');
        setMessage('Activation link is invalid - missing activation code');
        return;
      }

      try {
        // 调用API激活账号
        const response = await fetch(`http://10.144.2.1:8081/api/v1/auth/activate?code=${code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const responseText = await response.text();
          setStatus('success');
          setMessage('Account activated successfully!');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Account activated successfully! You can now log in to start your matching journey.',
                type: 'success'
              }
            });
          }, 3000);
        } else {
          const errorData = await response.text();
          setStatus('error');
          setMessage(errorData || 'Activation failed - the activation code may be expired or invalid');
        }
        
      } catch (error) {
        console.error('Activation error:', error);
        setStatus('error');
        setMessage('Activation failed - please check your internet connection and try again');
      }
    };

    handleActivation();
  }, [searchParams, navigate]);

  return (
    <div className="activation-container">
      {/* Floating Hearts Background */}
      <div className="floating-hearts">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="floating-heart">💕</div>
        ))}
      </div>

      <div className="activation-card">
        <div className="activation-header">
          <AirisLogo size="medium" />
          <h1 className="activation-title">Airis</h1>
        </div>

        {status === 'loading' && (
          <div className="loading-state">
            <div className="spinner-container">
              <div className="spinner"></div>
              <div className="spinner-glow"></div>
            </div>
            <h2>Activating Your Account...</h2>
            <p>Please wait while we verify your activation link</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="success-state">
            <div className="success-animation">
              <div className="success-icon">✅</div>
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix"></div>
                </div>
              </div>
            </div>
            <h2>Activation Successful!</h2>
            <p>{message}</p>
            <div className="countdown-info">
              <p>Redirecting to login page in 3 seconds...</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
            <button 
              className="action-button success-button"
              onClick={() => navigate('/login')}
            >
              <span className="btn-icon">🚀</span>
              Login Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <div className="error-animation">
              <div className="error-icon">❌</div>
              <div className="error-pulse"></div>
            </div>
            <h2>Activation Failed</h2>
            <p>{message}</p>
            <div className="error-actions">
              <button 
                className="action-button retry-button"
                onClick={() => navigate('/register')}
              >
                <span className="btn-icon">🔄</span>
                Register Again
              </button>
              <button 
                className="action-button secondary-button"
                onClick={() => navigate('/login')}
              >
                <span className="btn-icon">🔑</span>
                Try Login
              </button>
            </div>
            <div className="help-info">
              <p>Need help? Contact support at <a href="mailto:support@airis.com">support@airis.com</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountActivation;
