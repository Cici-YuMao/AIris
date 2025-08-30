import React, { useState } from 'react';
import axios from 'axios';
import './NotificationItem.css';
import { GATEWAY_URL } from "../config/api.js";

export default function NotificationItem({ notification, refresh }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const markAsRead = () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.put(`${GATEWAY_URL}/notifications/${notification.id}/read`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(() => refresh())
      .catch(err => console.error('Failed to mark as read', err));
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.delete(`${GATEWAY_URL}/notifications/${notification.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(() => {
        refresh();
        setShowDeleteModal(false);
      })
      .catch(err => console.error('Failed to delete notification', err));
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className={`notification-item ${notification.status === 'unread' ? 'unread' : 'read'}`}>
      {/* Main Message Content - Primary Focus */}
      <div className="notification-main-content">
        <div className="notification-message-wrapper">
          <h3 className="notification-title">
            {notification.title || '📢 通知'}
          </h3>
          <p className="notification-message">{notification.content}</p>
        </div>
      </div>

      {/* Bottom Info: Channel + Time + Delete Button */}
      <div className="notification-bottom">
        <div className="notification-meta">
          <span className="notification-channel">
            {notification.channel}
          </span>
          <span className="notification-time">
            {new Date(notification.createdAt).toLocaleString()}
          </span>
        </div>
        {notification.status === 'read' && (
          <button
            onClick={handleDeleteClick}
            className="delete-button"
            title="Delete notification"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Action Button */}
      {notification.status === 'unread' && (
        <div className="notification-action">
          <button
            onClick={markAsRead}
            className="mark-read-button"
          >
            <span className="button-icon">✓</span>
            Mark as Read
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-icon">🗑️</div>
            <h3 className="delete-modal-title">Confirm Delete</h3>
            <p className="delete-modal-message">
              Are you sure you want to delete this notification?
              <br />
              <strong>"{notification.title || notification.content?.substring(0, 30) + '...'}"</strong>
              <br />
              <span className="delete-modal-warning">This action cannot be undone</span>
            </p>
            <div className="delete-modal-buttons">
              <button
                onClick={handleCancelDelete}
                className="delete-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="delete-modal-confirm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
