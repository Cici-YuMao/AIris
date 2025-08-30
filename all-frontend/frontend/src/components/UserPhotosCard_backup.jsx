import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserPhotosCard.css';

const UserPhotosCard = ({ user, onLike, onNext, showActions = true }        {/* 用户统计 */}
        {user.userInfo && (
          <div className="user-stats">
            <span className="stat">
              ❤️ {user.userInfo.likeCount || 0}
            </span>
            <span className="stat">
              💬 {user.userInfo.commentCount || 0}
            </span>
            <span className="stat">
              🔥 {user.userInfo.popularity || 0}
            </span>
          </div>
        )} navigate = useNavigate();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // 获取用户的所有照片
  const photos = user.photoUrls || [];
  const hasMultiplePhotos = photos.length > 1;

  // 切换到下一张照片
  const nextPhoto = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  // 切换到上一张照片
  const prevPhoto = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  // 跳转到指定照片
  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index);
  };

  // 计算年龄显示
  const getAge = () => {
    if (user.userInfo?.age) return `${user.userInfo.age} years old`;
    if (user.age) return `${user.age} years old`;
    return '';
  };

  // 获取城市信息
  const getCity = () => {
    return user.userInfo?.city || user.city || '';
  };

  // 获取用户名
  const getUserName = () => {
    return user.userInfo?.name || user.userInfo?.username || user.nickname || 'Anonymous User';
  };

  // 获取工作信息
  const getOccupation = () => {
    return user.userInfo?.occupation || user.occupation || '';
  };

  // 点击用户信息进入详情页
  const handleUserClick = (e) => {
    e.stopPropagation(); // 防止事件冒泡
    const userId = user.id || user.userInfo?.id || user.userId;
    console.log('UserPhotosCard - Clicking user:', { userId, user });
    if (userId) {
      navigate(`/user/${userId}`);
    } else {
      console.error('UserPhotosCard - No userId found in user object:', user);
    }
  };

  // 获取兴趣爱好
  const getHobbies = () => {
    if (user.userInfo?.hobbies) {
      return typeof user.userInfo.hobbies === 'string' 
        ? user.userInfo.hobbies.split(',').map(h => h.trim()).slice(0, 3)
        : user.userInfo.hobbies.slice(0, 3);
    }
    if (user.hobbies) {
      return Array.isArray(user.hobbies) ? user.hobbies.slice(0, 3) : [user.hobbies];
    }
    return [];
  };

  return (
    <div className="user-photos-card">
      {/* 主要照片区域 */}
      <div className="photos-container">
        {photos.length > 0 ? (
          <>
            {/* 主照片 */}
            <div className="main-photo-wrapper">
              <img 
                src={photos[currentPhotoIndex]} 
                alt={`${getUserName()}'s photo`}
                className="main-photo upper-body-focus"
                onClick={nextPhoto}
              />
              
              {/* 导航按钮 */}
              {hasMultiplePhotos && (
                <>
                  <button className="photo-nav prev" onClick={prevPhoto}>
                    ‹
                  </button>
                  <button className="photo-nav next" onClick={nextPhoto}>
                    ›
                  </button>
                </>
              )}
              
              {/* 照片指示器 */}
              {hasMultiplePhotos && (
                <div className="photo-indicators">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentPhotoIndex ? 'active' : ''}`}
                      onClick={() => goToPhoto(index)}
                    />
                  ))}
                </div>
              )}
              
              {/* 在线状态 */}
              {(user.online || user.userInfo?.online) && (
                <div className="online-badge">
                  <span className="online-dot"></span>
                  Online
                </div>
              )}
            </div>

            {/* 缩略图预览 */}
            {hasMultiplePhotos && showAllPhotos && (
              <div className="photo-thumbnails">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className={`thumbnail upper-body-focus ${index === currentPhotoIndex ? 'active' : ''}`}
                    onClick={() => goToPhoto(index)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // 默认头像
          <div className="default-avatar">
            <span className="avatar-emoji">{user.avatar || '👤'}</span>
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="user-info" onClick={handleUserClick}>
        <div className="user-header">
          <h3 className="user-name">{getUserName()}</h3>
          <div className="user-meta">
            {getAge() && <span className="age">{getAge()}</span>}
            {getCity() && <span className="city">{getCity()}</span>}
            {getOccupation() && <span className="occupation">{getOccupation()}</span>}
          </div>
        </div>

        {/* 兴趣爱好标签 */}
        {getHobbies().length > 0 && (
          <div className="hobbies">
            {getHobbies().map((hobby, index) => (
              <span key={index} className="hobby-tag">
                {hobby}
              </span>
            ))}
          </div>
        )}

        {/* 照片数量提示 */}
        {hasMultiplePhotos && (
          <div className="photos-info">
            <button 
              className="photos-count"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllPhotos(!showAllPhotos);
              }}
            >
              📷 {photos.length} photos
              {showAllPhotos ? ' ▼' : ' ▶'}
            </button>
          </div>
        )}

        {/* 用户统计 */}
        {user.userInfo && (
          <div className="user-stats">
            <span className="stat">
              ❤️ {user.userInfo.likeCount || 0}
            </span>
            <span className="stat">
              � {user.userInfo.commentCount || 0}
            </span>
            <span className="stat">
              �🔥 {user.userInfo.popularity || 0}
            </span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {showActions && (
        <div className="card-actions">
          <button className="action-btn pass" onClick={onNext}>
            👋 Next
          </button>
          <button className="action-btn like" onClick={onLike}>
            ❤️ Like
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPhotosCard;
