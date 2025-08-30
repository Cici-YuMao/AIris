import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
      
      // Use match API to get user details (backend returns MatchUserDetailResponse directly)
      const response = await matchAPI.getUserDetail(userId);
      console.log('Match API response:', response);
      
      if (response && (response.userInfo || response.id)) {
        // Backend returns user detail object directly, not wrapped response
        console.log('User detail loaded successfully:', response);
        setUserDetail(response);
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid user detail format');
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timeout. Please check your connection or try again later.');
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to load user details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    try {
      // Navigate directly to chat page, backend will handle conversation creation logic
      navigate(`/chat/${userId}`);
    } catch (err) {
      alert('Failed to start conversation');
    }
  };

  const handleLike = async () => {
    try {
      await interactionAPI.like(userId);
      alert('Like sent successfully!');
    } catch (err) {
      alert('Failed to send like');
    }
  };

  // Helper function to get user info
  const getUserInfo = () => {
    return userDetail?.userInfo || {};
  };

  // Helper function to get user preferences
  const getUserPreference = () => {
    return userDetail?.userPreference || {};
  };

  // Get user display name
  const getUserDisplayName = () => {
    const userInfo = getUserInfo();
    return userInfo.name || userInfo.username || 'Anonymous User';
  };

  // Get user photos
  const getUserPhotos = () => {
    return userDetail?.photoUrls || [];
  };

  const nextPhoto = () => {
    const photos = getUserPhotos();
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    const photos = getUserPhotos();
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Profile...</h2>
          <p>Please wait while we fetch the user details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-detail-page">
        <div className="error-container">
          <div className="error-icon">😕</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/match')} className="back-button">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="user-detail-page">
        <div className="error-container">
          <div className="error-icon">👤</div>
          <h2>Profile Not Available</h2>
          <p>This user profile is currently unavailable</p>
          <button onClick={() => navigate('/match')} className="back-button">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const userInfo = getUserInfo();
  const userPreference = getUserPreference();
  const photos = getUserPhotos();

  return (
    <div className="user-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/match')} className="back-btn">
          <span className="back-icon">←</span>
          Back to Browse
        </button>
        <div className="header-actions">
          <button onClick={handleLike} className="action-btn like-btn">
            <span>❤️</span>
            Send Like
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left Column - Photos */}
        <div className="photo-section">
          <div className="main-photo-container">
            {photos.length > 0 ? (
              <>
                <img 
                  src={photos[currentPhotoIndex]} 
                  alt={`${getUserDisplayName()}'s photo`}
                  className="main-photo upper-body-focus"
                />
                
                {photos.length > 1 && (
                  <>
                    <button className="photo-nav prev" onClick={prevPhoto}>‹</button>
                    <button className="photo-nav next" onClick={nextPhoto}>›</button>
                    
                    <div className="photo-indicators">
                      {photos.map((_, index) => (
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

          {/* Photo Gallery */}
          {photos.length > 1 && (
            <div className="photo-gallery">
              {photos.map((photo, index) => (
                <div 
                  key={index}
                  className={`gallery-item ${index === currentPhotoIndex ? 'active' : ''}`}
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <img src={photo} alt={`Photo ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - User Information */}
        <div className="info-section">
          {/* User Header */}
          <div className="user-header">
            <div className="user-title">
              <h1 className="user-name">{getUserDisplayName()}</h1>
              <div className="user-status">
                {userInfo.age && <span className="age">{userInfo.age} years old</span>}
                {(userInfo.online || userDetail.online) && (
                  <span className="online-status">
                    <span className="status-dot"></span>
                    Online
                  </span>
                )}
              </div>
            </div>
            
            {/* User Stats */}
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{userInfo.popularity || 0}</span>
                <span className="stat-label">Popularity</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❤️</span>
                <span className="stat-value">{userInfo.likeCount || 0}</span>
                <span className="stat-label">Likes</span>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="info-card">
            <h3 className="card-title">
              <span className="title-icon">ℹ️</span>
              Basic Information
            </h3>
            <div className="info-grid">
              {userInfo.gender && (
                <div className="info-item">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{userInfo.gender === 'MALE' ? 'Male' : userInfo.gender === 'FEMALE' ? 'Female' : userInfo.gender}</span>
                </div>
              )}
              {userInfo.height && (
                <div className="info-item">
                  <span className="info-label">Height</span>
                  <span className="info-value">{userInfo.height} cm</span>
                </div>
              )}
              {userInfo.city && (
                <div className="info-item">
                  <span className="info-label">City</span>
                  <span className="info-value">{userInfo.city}</span>
                </div>
              )}
              {userInfo.occupation && (
                <div className="info-item">
                  <span className="info-label">Occupation</span>
                  <span className="info-value">{userInfo.occupation}</span>
                </div>
              )}
              {userInfo.education && (
                <div className="info-item">
                  <span className="info-label">Education</span>
                  <span className="info-value">{userInfo.education}</span>
                </div>
              )}
              {userInfo.income && (
                <div className="info-item">
                  <span className="info-label">Income</span>
                  <span className="info-value">{userInfo.income}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          {(userInfo.bio || userInfo.hobbies || userInfo.personality || userInfo.lifestyle) && (
            <div className="info-card">
              <h3 className="card-title">
                <span className="title-icon">📝</span>
                About Me
              </h3>
              <div className="about-content">
                {userInfo.bio && (
                  <div className="about-item">
                    <h4>Biography</h4>
                    <p>{userInfo.bio}</p>
                  </div>
                )}
                {userInfo.hobbies && (
                  <div className="about-item">
                    <h4>Hobbies & Interests</h4>
                    <div className="tags">
                      {(typeof userInfo.hobbies === 'string' 
                        ? userInfo.hobbies.split(',').map(h => h.trim())
                        : Array.isArray(userInfo.hobbies) ? userInfo.hobbies : [userInfo.hobbies]
                      ).map((hobby, index) => (
                        <span key={index} className="tag">{hobby}</span>
                      ))}
                    </div>
                  </div>
                )}
                {userInfo.personality && (
                  <div className="about-item">
                    <h4>Personality</h4>
                    <p>{userInfo.personality}</p>
                  </div>
                )}
                {userInfo.lifestyle && (
                  <div className="about-item">
                    <h4>Lifestyle</h4>
                    <p>{userInfo.lifestyle}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          {(userPreference.ageRange || userPreference.heightRange || userPreference.cityPreference || 
            userPreference.occupationPreference || userPreference.educationPreference || userPreference.incomePreference ||
            userPreference.topPriorities?.length > 0 || userPreference.dealBreakers?.length > 0) && (
            <div className="info-card">
              <h3 className="card-title">
                <span className="title-icon">💝</span>
                Preferences
              </h3>
              <div className="preferences-content">
                {userPreference.ageRange && (
                  <div className="preference-item">
                    <span className="pref-label">Age Preference</span>
                    <span className="pref-value">{userPreference.ageRange}</span>
                  </div>
                )}
                {userPreference.heightRange && (
                  <div className="preference-item">
                    <span className="pref-label">Height Preference</span>
                    <span className="pref-value">{userPreference.heightRange}</span>
                  </div>
                )}
                {userPreference.cityPreference && (
                  <div className="preference-item">
                    <span className="pref-label">Location Preference</span>
                    <span className="pref-value">{userPreference.cityPreference}</span>
                  </div>
                )}
                {userPreference.occupationPreference && (
                  <div className="preference-item">
                    <span className="pref-label">Career Preference</span>
                    <span className="pref-value">{userPreference.occupationPreference}</span>
                  </div>
                )}
                {userPreference.educationPreference && (
                  <div className="preference-item">
                    <span className="pref-label">Education Preference</span>
                    <span className="pref-value">{userPreference.educationPreference}</span>
                  </div>
                )}
                {userPreference.incomePreference && (
                  <div className="preference-item">
                    <span className="pref-label">Income Preference</span>
                    <span className="pref-value">{userPreference.incomePreference}</span>
                  </div>
                )}

                {userPreference.topPriorities?.length > 0 && (
                  <div className="preference-group">
                    <h4>Top Priorities</h4>
                    <div className="priority-tags">
                      {userPreference.topPriorities.map((priority, index) => (
                        <span key={index} className="priority-tag">
                          {priority === 'height' ? 'Height' :
                           priority === 'weight' ? 'Weight' :
                           priority === 'age' ? 'Age' :
                           priority === 'city' ? 'Location' :
                           priority === 'hobby' ? 'Hobbies' :
                           priority === 'education' ? 'Education' :
                           priority === 'occupation' ? 'Career' :
                           priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {userPreference.dealBreakers?.length > 0 && (
                  <div className="preference-group">
                    <h4>Deal Breakers</h4>
                    <div className="dealbreaker-list">
                      {userPreference.dealBreakers.map((dealbreaker, index) => (
                        <span key={index} className="dealbreaker-item">• {dealbreaker}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-section">
            <button onClick={handleStartConversation} className="start-chat-btn">
              <span className="btn-icon">💬</span>
              Start Conversation
            </button>
            <div className="secondary-actions">
              <button onClick={handleLike} className="secondary-btn like">
                <span className="btn-icon">❤️</span>
                Send Like
              </button>
              <button onClick={() => navigate('/match')} className="secondary-btn back">
                <span className="btn-icon">🔍</span>
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailPage;
