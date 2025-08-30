import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UploadPage from '../media/UploadPage';
import MediaCard from '../media/MediaCard';
import { useUser } from '../context/UserContext';
import '../styles/MediaPage.css';
import { GATEWAY_URL } from "../config/api.js";

export default function MediaPage() {
  const [mediaList, setMediaList] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { userId } = useUser();
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  const loadMedia = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await axios.get(`${GATEWAY_URL}/media?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setMediaList(res.data);
    } catch (err) {
      console.error('Failed to load media', err);
    }
  };

  const deleteMedia = async (id) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      await axios.delete(`${GATEWAY_URL}/media/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      loadMedia();
    } catch (err) {
      alert('Delete failed');
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const typeOrder = (type) => {
    if (type?.startsWith('image')) return 0;
    if (type?.startsWith('video')) return 1;
    return 2;
  };

  const sortedMedia = [...mediaList].sort((a, b) => typeOrder(a.fileType) - typeOrder(b.fileType));

  const filteredMedia = sortedMedia.filter(media => {
    const matchesSearch = media.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && media.isPublic === true) ||
      (filter === 'private' && media.isPublic === false);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const paginatedMedia = filteredMedia.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const publicCount = mediaList.filter(m => m.isPublic === true).length;
  const privateCount = mediaList.filter(m => m.isPublic === false).length;

  return (
    <div className="media-page">
      {/* Header */}
      <div className="media-header">
        <div className="header-left">
          {/* <button
            onClick={handleBackHome}
            className="back-button"
          >
            ← Back
          </button> */}
          <div className="page-title">
            <div className="title-icon">🎬</div>
            <h1>Media Center</h1>
          </div>
        </div>
        {/* <div className="user-info">
          <div className="user-avatar">👤</div>
          <span>User: {userId}</span>
        </div> */}
      </div>

      {/* Main Content */}
      <div className="media-content">
        {/* Upload Section */}
        <div className="upload-section">
          <h2 className="upload-title">📤 Upload Your Personal Photos</h2>
          <div className="upload-guidelines">
            <p>Images will be reviewed by AI.</p>
            <p>⚠️ Please do not use other people's photos.</p>
            <p>⚠️ Please do not upload violent, graphic, or inappropriate content.</p>
          </div>
          <UploadPage onUploadSuccess={loadMedia} accept="image/*" />
        </div>

        {/* Media Files Section */}
        <div className="media-files-section">
          <div className="title-with-refresh">
            <h2 className="section-title">📁 My Media Files</h2>
            <button
              onClick={loadMedia}
              className="refresh-button"
              title="Refresh media files"
            >
              <span className="refresh-icon">↻</span>
            </button>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-filter-group">
              <input
                type="text"
                placeholder="🔍 Search by file name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Files</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
            <div className="stats">
              <span className="stat-item">
                <span className="stat-number">{mediaList.length}</span>
                <span className="stat-label">Total</span>
              </span>
              <span className="stat-item">
                <span className="stat-number">{publicCount}</span>
                <span className="stat-label">Public</span>
              </span>
              <span className="stat-item">
                <span className="stat-number">{privateCount}</span>
                <span className="stat-label">Private</span>
              </span>
            </div>
          </div>

          {/* Media Grid */}
          <div className="media-grid">
            {paginatedMedia.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <div className="empty-message">No media files found</div>
              </div>
            ) : (
              paginatedMedia.map(media => (
                <MediaCard key={media.id} media={media} onDelete={deleteMedia} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
