import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import NotificationItem from '../notification/NotificationItem';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationPage.css';
import { GATEWAY_URL, MEDIA_SERVICE_URL } from "../config/api.js";

export default function NotificationPage() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const stompRef = useRef(null);

  const handleBackHome = () => {
    navigate('/');
  };

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      // const res = await axios.get(`http://10.144.122.245:8082/notifications/user/${userId}`);
      const res = await axios.get(`${GATEWAY_URL}/notifications/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!userId || stompRef.current) return;

    const client = new Client({
      // webSocketFactory: () => new SockJS('http://10.144.122.245:8082/ws'),
      webSocketFactory: () => new SockJS('http://10.144.2.1:8088/ws'),
      connectHeaders: {
        userId: userId, // 把 userId 放到 header 里
        // 'Authorization': `Bearer ${accessToken}`
      },
      debug: str => console.log('[STOMP]', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          const newNotification = JSON.parse(message.body);
          setNotifications(prev => [newNotification, ...prev]);
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame.headers['message']);
      }
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [userId]);

  const sorted = [...notifications].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'unread' ? -1 : 1;
  });

  const filtered = sorted.filter(n =>
    statusFilter === 'all' || n.status === statusFilter
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="notification-page">
      {/* Header */}
      <div className="notification-header">
        <div className="header-left">
          {/* <button
            onClick={handleBackHome}
            className="back-button"
          >
            ← Back
          </button> */}
          <div className="page-title">
            <div className="title-icon">🔔</div>
            <h1>Notification Center</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>
        {/* <div className="user-info">
          <div className="user-avatar">👤</div>
          <span>User: {userId}</span>
        </div> */}
      </div>

      {/* Main Content */}
      <div className="notification-content">
        <div className="content-header">
          <div className="title-with-refresh">
            <h2 className="section-title">📬 My Notifications</h2>
            <button
              onClick={fetchNotifications}
              className="refresh-button"
              title="Refresh notifications"
            >
              <span className="refresh-icon">↻</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          <div className="stats">
            <span className="stat-item">
              <span className="stat-number">{notifications.length}</span>
              <span className="stat-label">Total</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{unreadCount}</span>
              <span className="stat-label">Unread</span>
            </span>
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="notifications-container">
          {paginated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No notifications yet</h3>
              <p>Your notifications will appear here when available</p>
            </div>
          ) : (
            <div className="notifications-grid">
              {paginated.map(n => (
                <NotificationItem key={n.id} notification={n} refresh={fetchNotifications} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              ← Previous
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`page-number ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
