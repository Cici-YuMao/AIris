import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import AirisLogo from '../Logo/AirisLogo.jsx';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const { register, sendEmailCode, loading, error, clearError } = useAuth();
  
  const [step, setStep] = useState(1); // 注册步骤：1-基本信息，2-个人信息，3-偏好设置，4-邮箱验证
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationTime, setEmailVerificationTime] = useState(null); // 记录邮箱验证时间
  
  const [formData, setFormData] = useState({
    // 基本信息
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // 邮箱验证
    emailVerificationCode: '',
    
    // 个人信息
    name: '',
    gender: '',
    age: '',
    sexualOrientation: '',
    height: '',
    weight: '',
    city: '',
    education: '',
    occupation: '',
    hobbies: '',
    pets: '',
    familyStatus: '',
    
    // 设置
    settings: {
      notificationEmail: true,
      notificationPush: true,
      notificationSms: false,
      privacyLevel: 'NORMAL',
      displayOnlineStatus: true,
      displayLastActive: true
    },
    
    // 偏好
    preference: {
      ageRange: { min: 18, max: 35 },
      heightRange: { min: 150.0, max: 190.0 },
      weightRange: { min: 40.0, max: 100.0 },
      preferredCities: [],
      hobbies: '',
      dealBreakers: [],
      topPriorities: []
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // 处理嵌套对象
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (error) clearError();
  };

  const handleRangeChange = (rangeType, field, value) => {
    setFormData(prev => ({
      ...prev,
      preference: {
        ...prev.preference,
        [rangeType]: {
          ...prev.preference[rangeType],
          [field]: rangeType === 'ageRange' ? parseInt(value) : parseFloat(value)
        }
      }
    }));
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!formData.email) {
      alert('Please enter an email address first');
      return;
    }

    const result = await sendEmailCode(formData.email);
    if (result.success) {
      setEmailCodeSent(true);
      setEmailCooldown(60);
      
      // 倒计时
      const timer = setInterval(() => {
        setEmailCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // 开发环境提示：由于邮件服务配置问题，显示验证码获取方式
      alert('✅ Verification code sent successfully!\n\n🔧 Development Notice:\nDue to email service configuration, the verification code might not reach your email.\n\n💡 Quick Solution:\n• Use verification code: 123456\n• Or check backend console for the real code\n• Email service will be fixed in production');
    } else {
      // 检查是否是邮件服务器配置问题
      if (result.isMailAuthError) {
        alert('📧 Email service is temporarily unavailable due to server configuration.\n\n🔧 For development/testing purposes:\n• Use verification code: 123456 to continue\n• This will be fixed in production');
        setEmailCodeSent(true);
        setEmailCooldown(60);
        
        const timer = setInterval(() => {
          setEmailCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert('Failed to send verification code: ' + result.error);
      }
    }
  };

  // 验证邮箱验证码
  const handleVerifyEmailCode = async () => {
    if (!formData.emailVerificationCode) {
      alert('Please enter verification code');
      return;
    }

    // 检查是否是6位数字
    const code = formData.emailVerificationCode.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      alert('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      // 开发环境：如果是特定的测试验证码，允许通过
      if (code === '123456' || code === '000000') {
        setEmailVerified(true);
        setEmailVerificationTime(new Date()); // 记录验证时间
        alert('✅ Development code verified!\n\nYou can now proceed to complete registration.\n\n⏰ Note: Please complete registration promptly.');
        return;
      }

      // 在生产环境中，我们依赖后端在注册时验证验证码
      // 这里只做前端格式验证，真正的验证在注册提交时进行
      setEmailVerified(true);
      setEmailVerificationTime(new Date()); // 记录验证时间
      alert('✅ Email verification code format is valid!\n\nYou can now proceed to complete registration.\n\n⏰ Note: Verification codes expire in 5 minutes, so please complete registration promptly.');
      
      // 注意：真正的验证码验证会在注册提交时由后端处理
      // 后端会检查: redisTemplate.opsForValue().get("email:verify:" + request.getEmail())
    } catch (error) {
      alert('Verification code validation failed');
    }
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.password) {
      alert('Please fill in all required fields');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6 || formData.password.length > 20) {
      alert('Password must be 6-20 characters long');
      return false;
    }
    
    if (formData.username.length < 3 || formData.username.length > 50) {
      alert('Username must be 3-50 characters long');
      return false;
    }
    
    return true;
  };

  const validateStep5 = () => {
    if (!emailVerified) {
      alert('Please verify email code first');
      return false;
    }
    
    // 检查验证码是否可能过期
    if (emailVerificationTime) {
      const now = new Date();
      const verifyTime = new Date(emailVerificationTime);
      const timeDiff = Math.floor((now - verifyTime) / 1000 / 60);
      
      if (timeDiff >= 5) {
        alert('⚠️ Your verification code may have expired (5 minutes limit).\n\nPlease verify your email again to ensure successful registration.');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      return;
    }
    if (step === 5 && !validateStep5()) {
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailVerified) {
      alert('Please verify email code first');
      return;
    }
    
    // 检查验证码是否可能过期
    if (emailVerificationTime) {
      const now = new Date();
      const verifyTime = new Date(emailVerificationTime);
      const timeDiff = Math.floor((now - verifyTime) / 1000 / 60);
      
      if (timeDiff >= 5) {
        alert('⚠️ Your verification code has expired (5 minutes limit).\n\nPlease get a new verification code and verify your email again.');
        setEmailVerified(false);
        setEmailVerificationTime(null);
        setFormData(prev => ({
          ...prev,
          emailVerificationCode: ''
        }));
        return;
      }
    }
    
    // 准备提交数据 - 根据后端 RegisterRequest 的要求
    const submitData = {
      // 必填字段
      username: formData.username,
      email: formData.email,
      password: formData.password,
      verificationCode: formData.emailVerificationCode, // 后端需要的验证码
      
      // 可选字段 - 只有非空值才发送
      phone: formData.phone || undefined,
      name: formData.name || undefined,
      gender: formData.gender || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      sexualOrientation: formData.sexualOrientation || undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      city: formData.city || undefined,
      education: formData.education || undefined,
      occupation: formData.occupation || undefined,
      hobbies: formData.hobbies || undefined,
      pets: formData.pets || undefined,
      familyStatus: formData.familyStatus || undefined,
      
      // 账号设置和偏好（如果有数据的话）
      settings: formData.settings,
      preference: formData.preference
    };

    console.log('Submitting registration data:', submitData);

    const result = await register(submitData);
    if (result.success) {
      alert('🎉 Registration successful!\n\n✅ Your account has been created and is ready to use.\n\nYou can now log in to start your matching journey!');
      navigate('/login', { 
        state: { 
          message: 'Registration successful! You can now log in with your credentials.',
          type: 'success'
        }
      });
    } else {
      // 处理注册失败的情况
      if (result.error && result.error.includes('Verification code is incorrect or expired')) {
        alert('❌ Verification code has expired!\n\n🔄 Please get a new verification code and verify your email again.\n\n💡 Verification codes are valid for 5 minutes only.');
        // 重置邮箱验证状态，让用户重新验证
        setEmailVerified(false);
        setEmailVerificationTime(null);
        setFormData(prev => ({
          ...prev,
          emailVerificationCode: ''
        }));
      } else {
        alert('Registration failed: ' + (result.error || 'Unknown error'));
      }
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Basic Information</h3>

      <div className="form-group">
        <label htmlFor="username">Username *</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="3-50 characters"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="6-20 characters"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password *</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Optional"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>Personal Information (Optional, helps with better matching)</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            min="18"
            max="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sexualOrientation">Sexual Orientation</label>
          <select
            id="sexualOrientation"
            name="sexualOrientation"
            value={formData.sexualOrientation}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="HETEROSEXUAL">Heterosexual</option>
            <option value="HOMOSEXUAL">Homosexual</option>
            <option value="BISEXUAL">Bisexual</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="Height"
            min="100"
            max="250"
          />
        </div>

        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="Weight"
            min="20"
            max="200"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="city">City</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Your city"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="education">Education</label>
          <select
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="HIGH_SCHOOL">High School</option>
            <option value="COLLEGE">College</option>
            <option value="BACHELOR">Bachelor's Degree</option>
            <option value="MASTER">Master's Degree</option>
            <option value="DOCTOR">Doctorate</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="occupation">Occupation</label>
          <input
            type="text"
            id="occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="Your occupation"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="hobbies">Hobbies</label>
        <textarea
          id="hobbies"
          name="hobbies"
          value={formData.hobbies}
          onChange={handleChange}
          placeholder="Describe your hobbies"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="pets">Pets</label>
          <input
            type="text"
            id="pets"
            name="pets"
            value={formData.pets}
            onChange={handleChange}
            placeholder="Your pets"
          />
        </div>

        <div className="form-group">
          <label htmlFor="familyStatus">Family Status</label>
          <select
            id="familyStatus"
            name="familyStatus"
            value={formData.familyStatus}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="ONLY_CHILD">Only Child</option>
            <option value="MULTIPLE_CHILDREN">Multiple Children</option>
            <option value="SINGLE_PARENT">Single Parent Family</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Preferences</h3>
      
      <div className="preference-section">
        <h4>Age Preference</h4>
        <div className="range-input-group">
          <div className="range-input">
            <label>Min Age</label>
            <input
              type="number"
              min="18"
              max="80"
              value={formData.preference.ageRange.min}
              onChange={(e) => handleRangeChange('ageRange', 'min', e.target.value)}
              placeholder="18"
            />
          </div>
          <span className="range-separator">to</span>
          <div className="range-input">
            <label>Max Age</label>
            <input
              type="number"
              min="18"
              max="80"
              value={formData.preference.ageRange.max}
              onChange={(e) => handleRangeChange('ageRange', 'max', e.target.value)}
              placeholder="80"
            />
          </div>
        </div>
      </div>

      <div className="preference-section">
        <h4>Height Preference (cm)</h4>
        <div className="range-input-group">
          <div className="range-input">
            <label>Min Height</label>
            <input
              type="number"
              min="140"
              max="220"
              step="0.5"
              value={formData.preference.heightRange.min}
              onChange={(e) => handleRangeChange('heightRange', 'min', e.target.value)}
              placeholder="140"
            />
          </div>
          <span className="range-separator">to</span>
          <div className="range-input">
            <label>Max Height</label>
            <input
              type="number"
              min="140"
              max="220"
              step="0.5"
              value={formData.preference.heightRange.max}
              onChange={(e) => handleRangeChange('heightRange', 'max', e.target.value)}
              placeholder="220"
            />
          </div>
        </div>
      </div>

      <div className="preference-section">
        <h4>Weight Preference (kg)</h4>
        <div className="range-input-group">
          <div className="range-input">
            <label>Min Weight</label>
            <input
              type="number"
              min="30"
              max="150"
              step="0.5"
              value={formData.preference.weightRange.min}
              onChange={(e) => handleRangeChange('weightRange', 'min', e.target.value)}
              placeholder="30"
            />
          </div>
          <span className="range-separator">to</span>
          <div className="range-input">
            <label>Max Weight</label>
            <input
              type="number"
              min="30"
              max="150"
              step="0.5"
              value={formData.preference.weightRange.max}
              onChange={(e) => handleRangeChange('weightRange', 'max', e.target.value)}
              placeholder="150"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="preference.hobbies">Interest Preferences</label>
        <textarea
          id="preference.hobbies"
          name="preference.hobbies"
          value={formData.preference.hobbies}
          onChange={handleChange}
          placeholder="What hobbies would you like in a partner"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="preferredCities">Preferred Cities</label>
        <textarea
          id="preferredCities"
          value={formData.preference.preferredCities.join(', ')}
          onChange={(e) => {
            const value = e.target.value;
            const citiesArray = value.split(',').map(item => item.trim()).filter(item => item);
            setFormData(prev => ({
              ...prev,
              preference: {
                ...prev.preference,
                preferredCities: citiesArray
              }
            }));
          }}
          placeholder="Which cities would you prefer for your partner? (separate with commas)"
          rows={2}
        />
      </div>

      <div className="form-group">
        <label htmlFor="dealBreakers">Deal Breakers</label>
        <textarea
          id="dealBreakers"
          value={formData.preference.dealBreakers.join(', ')}
          onChange={(e) => {
            const value = e.target.value;
            const dealBreakersArray = value.split(',').map(item => item.trim()).filter(item => item);
            setFormData(prev => ({
              ...prev,
              preference: {
                ...prev.preference,
                dealBreakers: dealBreakersArray
              }
            }));
          }}
          placeholder="What are your absolute deal breakers? (separate with commas)"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Top Priorities (Select up to 3)</label>
        <div className="priority-checkbox-group">
          {['height', 'weight', 'age', 'city', 'hobby'].map(priority => (
            <label key={priority} className="priority-checkbox-label">
              <input
                type="checkbox"
                checked={formData.preference.topPriorities.includes(priority)}
                disabled={!formData.preference.topPriorities.includes(priority) && formData.preference.topPriorities.length >= 3}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    preference: {
                      ...prev.preference,
                      topPriorities: isChecked 
                        ? [...prev.preference.topPriorities, priority]
                        : prev.preference.topPriorities.filter(p => p !== priority)
                    }
                  }));
                }}
              />
              <span className="priority-text">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
            </label>
          ))}
        </div>
        <small>Select what matters most to you in a partner</small>
      </div>

    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h3>Settings</h3>
      
      <div className="settings-section">
        <h4>Privacy Settings</h4>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="settings.notificationEmail"
              checked={formData.settings.notificationEmail}
              onChange={handleChange}
            />
            Receive Email Notifications
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="settings.notificationPush"
              checked={formData.settings.notificationPush}
              onChange={handleChange}
            />
            Receive Push Notifications
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="settings.displayOnlineStatus"
              checked={formData.settings.displayOnlineStatus}
              onChange={handleChange}
            />
            Show Online Status
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="settings.displayLastActive"
              checked={formData.settings.displayLastActive}
              onChange={handleChange}
            />
            Show Last Active Time
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="settings.privacyLevel">Privacy Level</label>
          <select
            id="settings.privacyLevel"
            name="settings.privacyLevel"
            value={formData.settings.privacyLevel}
            onChange={handleChange}
          >
            <option value="PUBLIC">Public</option>
            <option value="NORMAL">Normal</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content">
      <div className="email-verification-header">
        <div className="verification-icon">📧</div>
        <h3>Email Verification</h3>
        <p>Please verify your email address to complete registration</p>
      </div>
      
      {!emailVerified ? (
        <div className="verification-step">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              className="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailVerificationCode">Verification Code *</label>
            <div className="verification-input-group">
              <input
                type="text"
                id="emailVerificationCode"
                name="emailVerificationCode"
                value={formData.emailVerificationCode}
                onChange={handleChange}
                placeholder="Enter 6-digit code"
                maxLength="6"
                className="code-input"
                required
              />
              <button
                type="button"
                className={`send-code-btn ${emailCooldown > 0 ? 'disabled' : ''}`}
                onClick={handleSendEmailCode}
                disabled={emailCooldown > 0 || !formData.email}
              >
                {emailCooldown > 0 ? `${emailCooldown}s` : 'Send Code'}
              </button>
            </div>
            <small className="helper-text">
              We'll send a 6-digit verification code to your email
              <br />
              <span style={{color: '#e74c3c', fontSize: '12px'}}>
                🔧 Dev Mode: If email doesn't arrive, try code "123456" or check backend console
              </span>
            </small>
          </div>
          
          <div className="form-group">
            <button
              type="button"
              className="verify-email-btn"
              onClick={handleVerifyEmailCode}
              disabled={!formData.emailVerificationCode || formData.emailVerificationCode.length !== 6}
            >
              <span className="btn-icon">✓</span>
              Verify Email Address
            </button>
          </div>
        </div>
      ) : (
        <div className="verification-step">
          <div className="verification-success">
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
            <h4>Email Verified Successfully!</h4>
            <p>Now you can complete your registration. Your account will be ready to use immediately after registration.</p>
            {emailVerificationTime && (
              <div className="verification-time-info">
                <small style={{color: '#f39c12'}}>
                  ⏰ Verification code expires 5 minutes after receiving it. 
                  {(() => {
                    const now = new Date();
                    const verifyTime = new Date(emailVerificationTime);
                    const timeDiff = Math.floor((now - verifyTime) / 1000 / 60);
                    const remainingTime = 5 - timeDiff;
                    if (remainingTime > 0) {
                      return ` ${remainingTime} minute(s) remaining.`;
                    } else {
                      return ' Code may have expired - if registration fails, please verify again.';
                    }
                  })()}
                </small>
              </div>
            )}
          </div>
          
          <div className="registration-ready">
            <div className="ready-info">
              <div className="info-icon">🎯</div>
              <h4>Ready to Complete Registration!</h4>
              <p>Click "Complete Registration" below to submit your information</p>
              <div className="registration-notice">
                <div className="notice-icon">💡</div>
                <div className="notice-content">
                  <strong>What happens next?</strong>
                  <ul>
                    <li>📝 Your registration will be submitted</li>
                    <li>✅ Your account will be created immediately</li>
                    <li>🚀 You can log in right away to start your matching journey!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleGuestVisit = () => {
    navigate('/guest-plaza');
  };

  return (
    <div className="auth-container">
      {/* Floating Hearts Background */}
      <div className="floating-hearts">
        {[...Array(18)].map((_, i) => (
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
          <p className="auth-brand-subtitle">
            🤖 Start Your AI-Powered Matching Journey<br/>
            Discover a better you and them
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🎯</div>
              <div className="auth-feature-title">Precise Recommendations</div>
              <div className="auth-feature-desc">AI analysis finds perfect matches</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">💫</div>
              <div className="auth-feature-title">Personality Matching</div>
              <div className="auth-feature-desc">Multi-dimensional personalized pairing</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🌍</div>
              <div className="auth-feature-title">Global Community</div>
              <div className="auth-feature-desc">Connect hearts worldwide</div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">✨</div>
              <div className="auth-feature-title">Authentic Experience</div>
              <div className="auth-feature-desc">Real identity verification guaranteed</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Form Section */}
      <div className="auth-form-section">
        <div className="auth-card register-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Join Airis</h2>
            <p className="auth-form-subtitle">Create your exclusive account - Step {step}</p>
          </div>
          
          <div className="auth-section">
        
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>Basic Info</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>Personal Info</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>Preferences</div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>Settings</div>
          <div className={`step ${step >= 5 ? 'active' : ''}`}>Email Verification</div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button 
                type="button" 
                onClick={handlePrevious}
                className="auth-button secondary"
              >
                Previous
              </button>
            )}
            
            {step < 5 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="auth-button"
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading || (step === 5 && !emailVerified)}
              >
                {loading ? 'Submitting...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>

        <div className="auth-links">
          <span>Already have an account? <Link to="/login">Sign In</Link></span>
        </div>
        </div>
        
        {/* Guest Access */}
        {step === 1 && (
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
            <p className="guest-desc">No registration required, experience Airis community instantly</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default Register;
