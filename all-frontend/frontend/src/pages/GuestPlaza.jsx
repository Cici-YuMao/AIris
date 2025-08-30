import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AirisLogo from '../components/Logo/AirisLogo.jsx';
import UserPhotosCard from '../components/UserPhotosCard.jsx';
import { guestAPI } from '../services/guest.js';
import './GuestPlaza.css';

const GuestPlaza = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]); // 存储所有用户数据
  const [displayUsers, setDisplayUsers] = useState([]); // 存储展示的匿名化用户

  useEffect(() => {
    loadGuestData();
  }, []);

  // 计算真实统计数据
  const calculateStats = (users) => {
    if (!users || users.length === 0) {
      return {
        onlineCount: 0,
        cityCount: 0,
        hobbyCount: 0,
        totalUsers: 0
      };
    }

    // 计算在线用户数（基于真实在线状态或随机生成的状态）
    const onlineCount = users.filter(user => user.online).length;
    
    // 计算覆盖城市数（去重）
    const uniqueCities = new Set(users.map(user => user.city).filter(city => city && city !== '未知城市'));
    const cityCount = uniqueCities.size;
    
    // 计算兴趣标签总数（去重）
    const allHobbies = users.flatMap(user => user.hobbies || []).filter(hobby => hobby && hobby !== '未知');
    const uniqueHobbies = new Set(allHobbies);
    const hobbyCount = uniqueHobbies.size;
    
    return {
      onlineCount,
      cityCount, 
      hobbyCount,
      totalUsers: users.length
    };
  };

  // 匿名化用户数据
  const anonymizeUser = (user, index) => {
    // 匿名化头像（使用emoji）
    const avatars = ['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🏫', '👩‍🍳', '👨‍⚕️', '👩‍🔬', '👨‍🎤', '👩‍🎓', '👨‍🌾'];
    
    // 使用真实职业数据作为昵称，如果没有职业信息则使用备用职业
    const fallbackProfessions = ['商务经理', '程序员', '艺术家', '教师', '主厨', '医生', '科研员', '音乐人', '学者', '农艺师'];

    return {
      id: `guest_${index + 1}`,
      avatar: avatars[index % avatars.length],
      nickname: user.occupation || fallbackProfessions[index % fallbackProfessions.length], // 直接使用真实职业
      age: user.age, // 直接使用真实年龄数据
      city: user.city,
      hobbies: user.hobbies?.slice(0, 3) || ['No info'], // 使用真实兴趣爱好，取前3个
      online: user.online !== undefined ? user.online : Math.random() > 0.5 // 使用真实在线状态
    };
  };

  const loadGuestData = async () => {
    try {
      console.log('🔍 开始加载真实用户数据...');
      const users = await guestAPI.getHotUsers(); // 获取热门用户
      
      if (users && users.length > 0) {
        console.log('✅ 成功获取后端数据:', users.length, '个用户');
        console.log('📊 用户数据样例:', users[0]);
        setAllUsers(users);
        
        // 只展示前12个用户，并进行匿名化处理
        const usersToDisplay = users.slice(0, 12);
        const anonymizedUsers = usersToDisplay.map((user, index) => anonymizeUser(user, index));
        setDisplayUsers(anonymizedUsers);
        
        console.log('🎉 真实数据处理完成!', anonymizedUsers);
      } else {
        throw new Error('后端返回空数据');
      }
    } catch (error) {
      console.error('❌ 无法获取后端数据:', error.message);
      console.log('💡 加载失败，请检查后端服务状态');
      
      // 清空数据，不使用临时数据
      setAllUsers([]);
      setDisplayUsers([]);
    }
  };

  const handleJoinNow = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="guest-plaza">
      {/* Background Animation */}
      <div className="floating-hearts">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="floating-heart">💕</div>
        ))}
      </div>

      {/* Header */}
      <header className="guest-header">
        <div className="header-content">
          <div className="brand-section">
            <AirisLogo size="medium" />
            <div className="brand-info">
              <h1 className="plaza-title">Airis Guest Plaza</h1>
              <p className="plaza-subtitle">🤖 Experience the magic of AI-powered smart matching</p>
              <div className="live-stats">
                <span className="live-indicator">🔴 Live</span>
                <span className="online-count">
                  {calculateStats(allUsers).onlineCount} online
                </span>
              </div>
            </div>
          </div>
          <div className="auth-buttons">
            <button className="login-btn" onClick={handleLogin}>
              🔑 Login
            </button>
            <button className="join-btn" onClick={handleJoinNow}>
              ✨ Join Airis
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="guest-main">
        {/* Featured Users */}
        <section className="featured-section">
          <h2>✨ Featured Users</h2>
          <p className="section-desc">
            Showcase from real user data 
            {allUsers.length > 0 && (
              <span className="user-count-badge">
                {allUsers.length} users loaded
              </span>
            )}
          </p>
          
          {displayUsers.length > 0 ? (
            <>
              <div className="stats-bar">
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-text">Active Users</span>
                  <span className="stat-number">{calculateStats(allUsers).onlineCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🌍</span>
                  <span className="stat-text">Cities</span>
                  <span className="stat-number">{calculateStats(allUsers).cityCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">💝</span>
                  <span className="stat-text">Interests</span>
                  <span className="stat-number">{calculateStats(allUsers).hobbyCount}</span>
                </div>
              </div>
              
              <div className="users-grid">
                {displayUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-header">
                      <div className="user-avatar">
                        {user.avatar}
                        {user.online && <div className="online-indicator"></div>}
                      </div>
                      <div className="user-info">
                        <h3>{user.nickname}</h3>
                        <p>{user.age} · {user.city}</p>
                      </div>
                    </div>
                    <div className="user-hobbies">
                      {user.hobbies.map((hobby, index) => (
                        <span key={index} className="hobby-tag">{hobby}</span>
                      ))}
                    </div>
                    <div className="user-actions">
                      <button className="view-btn" disabled>
                        👀 View Profile
                      </button>
                      <span className="guest-hint">Login required</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="load-more-section">
                <p className="load-more-hint">Discover more amazing people...</p>
                <button className="load-more-btn" onClick={handleJoinNow}>
                  ✨ Sign Up for More
                </button>
              </div>
            </>
          ) : (
            <div className="loading-state">
              <div className="loading-animation">
                <div className="loading-spinner"></div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="loading-message">
                <h3>🔌 Connecting to backend service...</h3>
                <p>Fetching real user data from http://10.144.2.1:8081</p>
                <p>If this takes too long, please check if the backend service is running</p>
                <button 
                  className="retry-btn" 
                  onClick={loadGuestData}
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Features Showcase */}
        <section className="features-section">
          <h2>🚀 Airis Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Smart Match</h3>
              <p>Deep learning algorithms analyze your preferences and personality to recommend the best matches for you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>Personality Analysis</h3>
              <p>Multi-dimensional personality tests help you understand yourself and find truly compatible partners.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌈</div>
              <h3>Interest Matching</h3>
              <p>Smart recommendations based on shared interests, making conversations easy from the very first message.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy Protection</h3>
              <p>Strict privacy protection mechanisms ensure your personal information is safe and secure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Real-time Chat</h3>
              <p>Seamless instant messaging experience, supporting text, images, voice, and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎉</div>
              <h3>Social Events</h3>
              <p>Rich online and offline events to meet interesting people in a relaxed atmosphere.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>🌟 Start Your Journey of Attraction</h2>
            <p>Join Airis and let AI help you find your perfect match</p>
            <div className="cta-buttons">
              <button className="primary-cta" onClick={handleJoinNow}>
                🚀 Register Now
              </button>
              <button className="secondary-cta" onClick={handleLogin}>
                🔑 Already have an account? Login
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="guest-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <AirisLogo size="small" />
            <span>Airis - AI-powered Smart Matchmaking Platform</span>
          </div>
          <div className="footer-links">
            <a href="#about">About Us</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestPlaza;
