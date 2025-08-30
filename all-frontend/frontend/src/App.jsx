import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { UserContext } from './context/UserContext';

// 页面组件
import NotificationPage from './pages/NotificationPage';
import HomePage from './pages/HomePage';
import MediaPage from './pages/MediaPage';
import GuestPlaza from './pages/GuestPlaza.jsx';

// 认证组件
import Login from './components/Auth/Login.jsx';
import Register from './components/Auth/Register.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import AccountActivation from './components/Auth/AccountActivation.jsx';

// 功能组件
import MatchPage from './components/Match/MatchPage.jsx';
import Profile from './components/Profile/Profile.jsx';
import UserDetailPage from './components/UserDetail/UserDetailPage.jsx';
import ChatPage from './components/Chat/ChatPage.jsx';

// 导航组件
import Navigation from './components/Navigation/Navigation.jsx';

// 保护路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// 主路由组件
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {isAuthenticated && <Navigation />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/activate" element={<AccountActivation />} />
          <Route path="/guest-plaza" element={<GuestPlaza />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/user/:userId" element={<UserDetailPage />} />
          <Route path="/chat/:userId/:displayName" element={<ChatPage />} />

          {/* 保护路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/notification" element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          } />
          <Route path="/media" element={
            <ProtectedRoute>
              <MediaPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/guest-plaza"} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserContext.Provider value={{ userId: (() => {
        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          return userInfo?.id ?? null;
        } catch {
          return null;
        }
      })() }}>
        <Router>
          <AppRoutes />
        </Router>
      </UserContext.Provider>
    </AuthProvider>
  );
}
export default App;
