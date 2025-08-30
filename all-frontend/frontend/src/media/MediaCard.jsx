import React, { useState } from 'react';
import axios from 'axios';
import { GATEWAY_URL } from "../config/api.js";

export default function MediaCard({ media, onDelete }) {
  const isVideo = media.fileType && media.fileType.startsWith('video');
  const isImage = media.fileType && media.fileType.startsWith('image');

  const [isPublic, setIsPublic] = useState(media.isPublic);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const readableSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleString();
  };

  const updatePublicStatus = async (targetStatus) => {
    if (isToggling || targetStatus === isPublic) return;
    setIsToggling(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await axios.put(`${GATEWAY_URL}/media/${media.id}/visibility`, {
        isPublic: targetStatus,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setIsPublic(res.data.isPublic);
    } catch (err) {
      alert('❌ Failed to update public status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(media.id);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      padding: '1rem',
      borderRadius: '12px',
      width: '100%',
      maxWidth: 1000,
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.04)',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <div style={{ cursor: isImage ? 'pointer' : 'default', marginBottom: '0.8rem' }}>
        {isVideo ? (
          <video src={media.url} controls width="100%" style={{ borderRadius: 8 }} />
        ) : isImage ? (
          <img
            src={media.url}
            alt={media.fileName}
            width="100%"
            style={{ borderRadius: 8, objectFit: 'cover' }}
            onClick={() => window.open(media.url, '_blank')}
          />
        ) : (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>📄 Unsupported preview</p>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 'bold', fontSize: '1.05rem', margin: '6px 0' }}>{media.fileName}</p>
        <p style={{ margin: '6px 0', fontSize: '0.95rem', color: '#555' }}>{readableSize(media.fileSize)}</p>
        <p style={{ margin: '6px 0', fontSize: '0.95rem', color: '#555' }}>
          Uploaded at {formatDate(media.createdAt)}
        </p>

        <p style={{ margin: '6px 0', fontSize: '0.95rem', color: '#2c3e50' }}>
          <strong>AI Review Status:</strong>&nbsp;
          <span style={{
            padding: '0.1rem 0.5rem',
            backgroundColor: '#f9f9f9',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            color: media.moderationStatus === 'APPROVED' ? '#4caf50' :
              media.moderationStatus === 'REJECTED' ? '#c0392b' : '#f39c12',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            {media.moderationStatus}
          </span>
        </p>

        {media.moderationStatus === 'APPROVED' && (
          <div style={{
            margin: '6px 0',
            fontSize: '0.95rem',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <strong>Select Visibility:</strong>
            <div style={{
              flex: 1,
              display: 'flex',
              border: '1px solid #ccc',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#eaeaea',
              cursor: isToggling ? 'not-allowed' : 'pointer',
              height: '28px',
            }}>
              <div
                onClick={() => updatePublicStatus(true)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  padding: '0.25rem 0',
                  backgroundColor: isPublic ? '#cde8d3' : '#eaeaea',
                  color: isPublic ? '#2e7d32' : '#555',
                  fontWeight: isPublic ? 'bold' : 'normal',
                  transition: '0.2s'
                }}
              >
                Public
              </div>
              <div
                onClick={() => updatePublicStatus(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  padding: '0.25rem 0',
                  backgroundColor: !isPublic ? '#f6d3b3' : '#eaeaea',
                  color: !isPublic ? '#8e4b10' : '#555',
                  fontWeight: !isPublic ? 'bold' : 'normal',
                  transition: '0.2s'
                }}
              >
                Private
              </div>
            </div>
          </div>
        )}

        {media.dimensions?.width && media.dimensions?.height && (
          <p style={{ margin: '6px 0', fontSize: '0.85rem', color: '#888' }}>
            📐 {media.dimensions.width}×{media.dimensions.height}
          </p>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button
          onClick={handleDeleteClick}
          style={{
            backgroundColor: '#f4b0b0',
            color: '#a30000',
            border: 'none',
            padding: '0.6rem 1.6rem',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            maxWidth: '350px',
            width: '85%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#666', lineHeight: '1.4' }}>
              Are you sure you want to delete <strong>"{media.fileName}"</strong>?
              <br />
              <span style={{ fontSize: '0.9rem', color: '#999' }}>This action cannot be undone</span>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
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
