import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { matchAPI } from '../services/match.js';
import AirisLogo from '../components/Logo/AirisLogo.jsx';
import UserPhotosCard from '../components/UserPhotosCard.jsx';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendUsers, setRecommendUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendUsers();
  }, []);

  const loadRecommendUsers = async () => {
    setLoading(true);
    try {
      console.log('开始加载推荐用户...');
      // 如果用户已登录，尝试获取推荐用户，否则获取热门用户
      let response;
      if (isAuthenticated) {
        response = await matchAPI.getRecommendUsers();
        console.log('推荐用户API响应:', response);
      } else {
        response = await matchAPI.getHotUsers(6);
        console.log('热门用户API响应:', response);
      }
      
      if (response && response.success && response.data) {
        console.log('成功获取用户:', response.data.length, '个用户');
        setRecommendUsers(response.data.slice(0, 6));
      } else if (response && Array.isArray(response)) {
        // 直接返回数组的情况
        console.log('成功获取用户(数组格式):', response.length, '个用户');
        setRecommendUsers(response.slice(0, 6));
      } else {
        console.error('API返回失败:', response);
        setRecommendUsers([]);
      }
    } catch (error) {
      console.error('加载推荐用户失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      setRecommendUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = () => {
    navigate('/media');
  };

  const handleNotificationClick = () => {
    navigate('/notification');
  };

  const handleMatchClick = () => {
    navigate('/match');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="home-container">
      {/* Floating Hearts Background */}
      <div className="floating-hearts">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="floating-heart">💕</div>
        ))}
      </div>
      <div className="home-content">
        <div className="welcome-section">
          {/* <div className="welcome-logo">
            <AirisLogo size="large" showText={true} animated={true} />
          </div> */}
          <h1 className="home-title">
            Welcome back, {user?.name || user?.username}!
          </h1>
          <p className="home-subtitle">
            Discover interesting people and start a wonderful encounter ✨
          </p>
          <div className="welcome-decoration">
            <div className="floating-heart">💕</div>
            <div className="floating-heart">💖</div>
            <div className="floating-heart">💝</div>
          </div>
        </div>
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{user?.likeCount || 0}</div>
            <div className="stat-label">Likes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.commentCount || 0}</div>
            <div className="stat-label">Comments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{user?.popularity || 0}</div>
            <div className="stat-label">Popularity</div>
          </div>
        </div>
        <div className="quick-actions">
          <h2>Quick Navigation</h2>
          <div className="button-container">
            <button 
              className="nav-button match-button" 
              onClick={handleMatchClick}
            >
              <div className="button-icon">🔍</div>
              <div className="button-text">Discover</div>
              <div className="button-desc">Find new friends</div>
            </button>
            <button 
              className="nav-button notification-button" 
              onClick={handleNotificationClick}
            >
              <div className="button-icon">🔔</div>
              <div className="button-text">Notifications</div>
              <div className="button-desc">View messages</div>
            </button>
            <button 
              className="nav-button media-button" 
              onClick={handleMediaClick}
            >
              <div className="button-icon">📺</div>
              <div className="button-text">Media</div>
              <div className="button-desc">Manage photos</div>
            </button>
            <button 
              className="nav-button profile-button" 
              onClick={handleProfileClick}
            >
              <div className="button-icon">👤</div>
              <div className="button-text">Profile</div>
              <div className="button-desc">Edit personal info</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
