import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import AirisLogo from '../Logo/AirisLogo.jsx';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    identifier: '', // 可以是邮箱或用户名
    password: ''
  });

  const [activationMessage, setActivationMessage] = useState(null);

  useEffect(() => {
    // 检查是否有来自激活页面的消息
    if (location.state?.message) {
      setActivationMessage({
        text: location.state.message,
        type: location.state.type || 'info'
      });
      
      // 5秒后自动隐藏消息
      const timer = setTimeout(() => {
        setActivationMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      return;
    }

    const result = await login(formData.identifier, formData.password);
    console.log('login result', result);
    if (result.success) {
      navigate('/'); // 登录成功后跳转到首页
    }
  };

  const handleGuestVisit = () => {
    navigate('/guest-plaza');
  };

  return (
    <div className="auth-container">
      {/* Floating Hearts Background */}
      <div className="floating-hearts">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="floating-heart">💕</div>
        ))}
      </div>
      
      {/* Left Brand Section */}
      <div className="auth-brand-section">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <AirisLogo size="large" />
          </div>
          <h1 className="auth-brand-title">Airis</h1>
          <p className="auth-brand-slogan" style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            fontFamily: 'Montserrat, "Segoe UI", Arial, sans-serif',
            background: 'linear-gradient(90deg, #b388ff 0%, #f8bbd0 40%, #b2f7ef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 16px #fff6, 0 1px 0 #fff',
            marginBottom: '2.5rem',
            marginTop: '0.5rem',
            letterSpacing: '0.04em',
            filter: 'blur(0.1px) brightness(1.08)',
            opacity: 0.96,
            lineHeight: 1.5,
          }}>
            Dreamed by Algorithms, Awakened in the Iris
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🧠</div>
              <div className="auth-feature-title">Smart Algorithm</div>
              <div className="auth-feature-desc">Deep learning for accurate matches</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">💝</div>
              <div className="auth-feature-title">Real Connections</div>
              <div className="auth-feature-desc">Verified users, safe and reliable</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🌟</div>
              <div className="auth-feature-title">Interest Matching</div>
              <div className="auth-feature-desc">Chat easily with shared hobbies</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-title">Privacy Protection</div>
              <div className="auth-feature-desc">Strictly protect your personal info</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Form Section */}
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">Log in to your Airis account</p>
          </div>
          
          {activationMessage && (
            <div className={`activation-message ${activationMessage.type}`}>
              <div className="message-icon">
                {activationMessage.type === 'success' ? '✅' : 'ℹ️'}
              </div>
              <div className="message-content">
                <p>{activationMessage.text}</p>
              </div>
              <button 
                type="button" 
                className="message-close"
                onClick={() => setActivationMessage(null)}
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter email or username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>Don't have an account? <Link to="/register">Sign up now</Link></span>
        </div>
        
        {/* Guest Access */}
        <div className="guest-section">
          <div className="divider">
            <span>or</span>
          </div>
          <button 
            type="button" 
            className="guest-button"
            onClick={handleGuestVisit}
          >
            🌍 Enter Guest Plaza
          </button>
          <p className="guest-desc">No registration required, experience the Airis community now</p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
