import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import AirisLogo from '../Logo/AirisLogo.jsx';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/match', label: 'Discover', icon: '💝' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/notification', label: 'Notifications', icon: '🔔' },
    { path: '/media', label: 'Media', icon: '📱' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <AirisLogo size="small" showText={true} />
          </Link>
        </div>

        <div className="nav-menu">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user?.name || user?.username}</span>
          </div>
          <div>
          <button onClick={logout} className="logout-btn">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
