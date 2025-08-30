import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './Auth.css';

function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1: 输入邮箱, 2: 输入验证码和新密码
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(null);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    const result = await forgotPassword(formData.email);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Verification code has been sent to your email' });
      setStep(2);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6 || formData.newPassword.length > 20) {
      setMessage({ type: 'error', text: 'Password must be 6-20 characters' });
      return;
    }

    setLoading(true);
    const result = await resetPassword(formData.code, formData.newPassword);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Password reset successful, please log in with your new password' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        
        {step === 1 ? (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter the code sent to your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="6-20 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="auth-button secondary"
              >
                Back
              </button>
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-links">
          <span>Remembered your password? <Link to="/login">Log in now</Link></span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
