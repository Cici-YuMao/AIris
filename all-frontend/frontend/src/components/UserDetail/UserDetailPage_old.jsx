import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/user.js';
import { matchAPI } from '../../services/match.js';
import { interactionAPI } from '../../services/interaction.js';
import './UserDetailPage.css';

function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching user detail for userId:', userId);
      
      // 使用匹配API获取用户详情（后端直接返回MatchUserDetailResponse对象）
      const response = await matchAPI.getUserDetail(userId);
      console.log('Match API response:', response);
      
      if (response && (response.userInfo || response.id)) {
        // 后端直接返回用户详情对象，不是包装的响应
        console.log('User detail loaded successfully:', response);
        setUserDetail(response);
      } else {
        console.error('Invalid response format:', response);
        setError('用户详情格式错误');
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('请求超时，请检查网络连接或稍后重试');
      } else if (err.response?.status === 404) {
        setError('用户不存在');
      } else {
        setError('获取用户详情失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    try {
      // 直接导航到聊天页面，后端会处理创建对话逻辑
      navigate(`/chat/${userId}`);
    } catch (err) {
      alert('Failed to start conversation');
      console.error('Error starting conversation:', err);
    }
  };

  const handleLike = async () => {
    try {
      const response = await interactionAPI.likeUser(userId);
      if (response.success) {
        alert('👍 Like sent!');
      } else {
        alert('Failed to send like: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to send like');
      console.error('Error sending like:', err);
    }
  };

  const handleBlock = async () => {
    if (window.confirm('Are you sure you want to block this user?')) {
      try {
        const response = await interactionAPI.blockUser(userId);
        if (response.success) {
          alert('User blocked successfully');
          navigate(-1);
        } else {
          alert('Failed to block user: ' + (response.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Failed to block user');
        console.error('Error blocking user:', err);
      }
    }
  };

  const nextPhoto = () => {
    const photos = getUserPhotos();
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    const photos = getUserPhotos();
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? photos.length - 1 : prev - 1
      );
    }
  };

  const formatLastActive = (lastActive) => {
    const now = new Date();
    const diff = now - new Date(lastActive);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Active recently';
    if (hours < 24) return `Active ${hours}h ago`;
    if (days < 7) return `Active ${days}d ago`;
    return 'Active over a week ago';
  };

  const getEducationDisplay = (education) => {
    const educationMap = {
      'HIGH_SCHOOL': 'High School',
      'COLLEGE': 'College',
      'BACHELOR': "Bachelor's Degree",
      'MASTER': "Master's Degree",
      'DOCTOR': 'Doctorate'
    };
    return educationMap[education] || education;
  };

  const getGenderDisplay = (gender) => {
    return gender === 'MALE' ? 'Male' : gender === 'FEMALE' ? 'Female' : 'Other';
  };

  const getOrientationDisplay = (orientation) => {
    const orientationMap = {
      'HETEROSEXUAL': 'Straight',
      'HOMOSEXUAL': 'Gay/Lesbian',
      'BISEXUAL': 'Bisexual',
      'OTHER': 'Other'
    };
    return orientationMap[orientation] || orientation;
  };

  // 获取用户照片列表
  const getUserPhotos = () => {
    if (userDetail?.photoUrls && Array.isArray(userDetail.photoUrls)) {
      return userDetail.photoUrls;
    }
    if (userDetail?.photos && Array.isArray(userDetail.photos)) {
      return userDetail.photos;
    }
    return [];
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!userDetail) return 'Unknown User';
    return userDetail.userInfo?.name || userDetail.userInfo?.username || userDetail.name || userDetail.username || 'Unknown User';
  };

  // 获取用户基本信息
  const getUserInfo = () => {
    return userDetail?.userInfo || userDetail || {};
  };

  // 获取用户偏好信息
  const getUserPreference = () => {
    return userDetail?.userPreference || {};
  };

  // 获取用户头像
  const getUserAvatar = () => {
    const photos = getUserPhotos();
    if (photos.length > 0) return photos[0];
    return userDetail?.avatar || null;
  };

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="user-detail-page">
        <div className="error-container">
          <div className="error-icon">😔</div>
          <h3>Profile Not Found</h3>
          <p>{error || 'This user profile is not available'}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-page">
      {/* Header with back button */}
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <span className="back-icon">←</span>
          Back
        </button>
        <div className="header-actions">
          <button onClick={handleLike} className="action-btn like-btn">
            <span className="btn-icon">👍</span>
            Like
          </button>
          <button onClick={handleBlock} className="action-btn block-btn">
            <span className="btn-icon">🚫</span>
            Block
          </button>
        </div>
      </div>

      <div className="detail-content">
        {/* Photo Section */}
        <div className="photo-section">
          <div className="main-photo-container">
            {getUserPhotos().length > 0 ? (
              <>
                <img 
                  src={getUserPhotos()[currentPhotoIndex]} 
                  alt={`${getUserDisplayName()} - Photo ${currentPhotoIndex + 1}`}
                  className="main-photo upper-body-focus"
                />
                
                {getUserPhotos().length > 1 && (
                  <>
                    <button onClick={prevPhoto} className="photo-nav prev">
                      <span>‹</span>
                    </button>
                    <button onClick={nextPhoto} className="photo-nav next">
                      <span>›</span>
                    </button>
                    
                    <div className="photo-indicators">
                      {getUserPhotos().map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="no-photo">
                <div className="no-photo-icon">📷</div>
                <p>No photos available</p>
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          {getUserPhotos().length > 1 && (
            <div className="photo-thumbnails">
              {getUserPhotos().map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail upper-body-focus ${index === currentPhotoIndex ? 'active' : ''}`}
                  onClick={() => setCurrentPhotoIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* User Info Section */}
        <div className="info-section">
          {/* Basic Info */}
          <div className="basic-info-card">
            <div className="user-header">
              <div className="user-title">
                <h1>{getUserDisplayName()}</h1>
                <div className="status-info">
                  {getUserInfo().online ? (
                    <span className="status online">🟢 Online</span>
                  ) : (
                    <span className="status offline">
                      🔘 {getUserInfo().lastActive ? formatLastActive(getUserInfo().lastActive) : 'Recently active'}
                    </span>
                  )}
                  {getUserInfo().popularity && (
                    <span className="compatibility">
                      � 人气值: {getUserInfo().popularity}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {getUserInfo().bio && (
              <div className="bio-section">
                <h3>About Me</h3>
                <p className="bio-text">{getUserInfo().bio}</p>
              </div>
            )}

            <div className="basic-details">
              <div className="detail-row">
                <span className="label">年龄:</span>
                <span className="value">{getUserInfo().age}岁</span>
              </div>
              <div className="detail-row">
                <span className="label">性别:</span>
                <span className="value">{getGenderDisplay(getUserInfo().gender)}</span>
              </div>
              <div className="detail-row">
                <span className="label">性取向:</span>
                <span className="value">{getOrientationDisplay(getUserInfo().sexualOrientation)}</span>
              </div>
              <div className="detail-row">
                <span className="label">身高:</span>
                <span className="value">{getUserInfo().height} cm</span>
              </div>
              <div className="detail-row">
                <span className="label">体重:</span>
                <span className="value">{getUserInfo().weight ? `${getUserInfo().weight} kg` : '未填写'}</span>
              </div>
              <div className="detail-row">
                <span className="label">城市:</span>
                <span className="value">{getUserInfo().city}</span>
              </div>
              <div className="detail-row">
                <span className="label">教育程度:</span>
                <span className="value">{getEducationDisplay(getUserInfo().education)}</span>
              </div>
              <div className="detail-row">
                <span className="label">职业:</span>
                <span className="value">{getUserInfo().occupation}</span>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="detail-info-card">
            <h3>更多信息</h3>
            
            {getUserInfo().hobbies && (
              <div className="info-group">
                <h4>🎯 兴趣爱好</h4>
                <p>{getUserInfo().hobbies}</p>
              </div>
            )}

            {getUserInfo().pets && (
              <div className="info-group">
                <h4>🐾 宠物</h4>
                <p>{getUserInfo().pets}</p>
              </div>
            )}

            {getUserInfo().familyStatus && (
              <div className="info-group">
                <h4>👨‍👩‍👧‍👦 家庭状况</h4>
                <p>{getUserInfo().familyStatus === 'single' ? '单身' : 
                    getUserInfo().familyStatus === 'married' ? '已婚' : 
                    getUserInfo().familyStatus === 'divorced' ? '离异' : 
                    getUserInfo().familyStatus}</p>
              </div>
            )}

            {getUserInfo().likeCount !== undefined && (
              <div className="info-group">
                <h4>📊 用户统计</h4>
                <div className="user-stats-detail">
                  <span className="stat-item">❤️ 获赞: {getUserInfo().likeCount}</span>
                  <span className="stat-item">🔥 人气: {getUserInfo().popularity}</span>
                  {getUserInfo().commentCount !== undefined && (
                    <span className="stat-item">💬 评论: {getUserInfo().commentCount}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="preferences-card">
            <h3>偏好设置</h3>
            
            <div className="preference-group">
              <h4>📊 寻找条件</h4>
              <div className="preference-details">
                {getUserPreference().ageRange && (
                  <div className="pref-item">
                    <span className="pref-label">年龄范围:</span>
                    <span className="pref-value">{getUserPreference().ageRange.min} - {getUserPreference().ageRange.max} 岁</span>
                  </div>
                )}
                {getUserPreference().heightRange && (
                  <div className="pref-item">
                    <span className="pref-label">身高范围:</span>
                    <span className="pref-value">{getUserPreference().heightRange.min} - {getUserPreference().heightRange.max} cm</span>
                  </div>
                )}
                {getUserPreference().weightRange && (
                  <div className="pref-item">
                    <span className="pref-label">体重范围:</span>
                    <span className="pref-value">{getUserPreference().weightRange.min} - {getUserPreference().weightRange.max} kg</span>
                  </div>
                )}
                {getUserPreference().preferredCities?.length > 0 && (
                  <div className="pref-item">
                    <span className="pref-label">偏好城市:</span>
                    <span className="pref-value">{getUserPreference().preferredCities.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {getUserPreference().hobbies && (
              <div className="preference-group">
                <h4>🎯 兴趣偏好</h4>
                <p>{getUserPreference().hobbies}</p>
              </div>
            )}

            {getUserPreference().topPriorities?.length > 0 && (
              <div className="preference-group">
                <h4>⭐ 最看重的条件</h4>
                <div className="priority-tags">
                  {getUserPreference().topPriorities.map((priority, index) => (
                    <span key={index} className="priority-tag">
                      {priority === 'height' ? '身高' : 
                       priority === 'weight' ? '体重' :
                       priority === 'age' ? '年龄' :
                       priority === 'city' ? '城市' :
                       priority === 'hobby' ? '兴趣爱好' :
                       priority === 'education' ? '教育程度' :
                       priority === 'occupation' ? '职业' :
                       priority}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {getUserPreference().dealBreakers?.length > 0 && (
              <div className="preference-group">
                <h4>🚫 雷点</h4>
                <div className="dealbreaker-list">
                  {getUserPreference().dealBreakers.map((dealbreaker, index) => (
                    <span key={index} className="dealbreaker-item">• {dealbreaker}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-section">
            <button onClick={handleStartConversation} className="start-chat-btn">
              <span className="btn-icon">💬</span>
              开始对话
            </button>
            <div className="secondary-actions">
              <button onClick={handleLike} className="secondary-btn like">
                <span className="btn-icon">❤️</span>
                发送喜欢
              </button>
              <button onClick={() => navigate('/match')} className="secondary-btn back">
                <span className="btn-icon">🔍</span>
                继续浏览
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailPage;
