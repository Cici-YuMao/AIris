import React, { useState, useEffect } from 'react';
import { matchAPI } from '../../services/match.js';
import { interactionAPI } from '../../services/interaction.js';
import { useAuth } from '../../context/AuthContext.js';
import UserPhotosCard from '../UserPhotosCard.jsx';
import './Match.css';

function MatchPage() {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hot');

  useEffect(() => {
    loadUsers();
  }, [activeTab, isAuthenticated]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      switch (activeTab) {
        case 'hot':
          response = await matchAPI.getHotUsers(20);
          break;
        case 'recommend':
          if (!isAuthenticated) {
            setError('Please log in to view recommended users');
            return;
          }
          response = await matchAPI.getRecommendUsers();
          break;
        case 'highly-matched':
          if (!isAuthenticated) {
            setError('Please log in to view highly matched users');
            return;
          }
          response = await matchAPI.getHighlyMatchedUsers();
          break;
        default:
          response = [];
      }

      if (response && response.success && response.data) {
        console.log(`${activeTab} - Successfully fetched users:`, response.data.length);
        setUsers(response.data);
      } else if (response && Array.isArray(response)) {
        // Direct array return (e.g., hot users API)
        console.log(`${activeTab} - Successfully fetched users (array):`, response.length);
        setUsers(response);
      } else {
        console.error('Failed to load users:', response?.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('API error:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId) => {
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }

    try {
      await interactionAPI.likeUser(userId);
      // Update local state
      setUsers(users.map(user =>
        user.userInfo.id === userId
          ? { ...user, userInfo: { ...user.userInfo, likeCount: (user.userInfo.likeCount || 0) + 1 } }
          : user
      ));
    } catch (error) {
      alert('Failed to like: ' + error.message);
    }
  };

  const handleNext = () => {
    // Simple next user function - reload or remove current user
    loadUsers();
  };

  return (
    <div className="match-page" style={{ background: '#f3eaff', minHeight: '100vh' }}>
      <div className="page-header">
        <h1>💕 Discover Connections</h1>
        <p style={{ textAlign: "center" }}>Find like-minded people</p>

        <div className="match-tabs">
          <button
            className={activeTab === 'hot' ? 'active' : ''}
            onClick={() => setActiveTab('hot')}
          >
            🔥 Hot Users
          </button>
          <button
            className={activeTab === 'recommend' ? 'active' : ''}
            onClick={() => setActiveTab('recommend')}
            disabled={!isAuthenticated}
          >
            ✨ Recommended for You
          </button>
          <button
            className={activeTab === 'highly-matched' ? 'active' : ''}
            onClick={() => setActiveTab('highly-matched')}
            disabled={!isAuthenticated}
          >
            💯 Highly Matched
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadUsers}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="users-grid">
            {users.length > 0 ? (
              users.map(user => (
                <UserPhotosCard
                  key={user.userInfo.id}
                  user={user}
                  onLike={() => handleLike(user.userInfo.id)}
                  onNext={handleNext}
                  showActions={isAuthenticated}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>No user data</p>
                <button onClick={loadUsers}>Refresh</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchPage;
