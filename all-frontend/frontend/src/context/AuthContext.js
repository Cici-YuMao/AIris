import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/auth.js';
import { userAPI } from '../services/user.js';
import { storage } from '../utils/storage.js';
// 认证状态
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};


// Action类型
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext();

// Provider组件
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查token
  useEffect(() => {
    initializeAuth();
  }, []);

  // 初始化认证状态
  const initializeAuth = async () => {
    // 首先验证并清理存储数据
    storage.validateAndCleanStorage();
    
    const token = storage.getAccessToken();
    const userInfo = storage.getUserInfo();

    if (token && userInfo) {
      try {
        // 验证token有效性，获取最新用户信息
        const userData = await userAPI.getMe();
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: userData
        });
        storage.setUserInfo(userData);
      } catch (error) {
        // Token无效，清除存储
        storage.clearAll();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // 登录
  const login = async (identifier, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.login(identifier, password);
      console.log('authAPI.login response', response);
      const { accessToken, refreshToken, userId, username, email } = response;
      const user = { userId, username, email }; // 构造 user 对象

      storage.setTokens(accessToken, refreshToken);
      storage.setUserInfo(user);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || '登录失败'
      });
      return { success: false, error: error.message };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // 注册成功后，后端会自动发送激活邮件
      const response = await authAPI.register(userData);
      
      // 注册成功，但不自动登录，需要等待用户激活
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, message: 'Registration successful! Please check your email for activation link.' };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.message || '注册失败'
      });
      return { success: false, error: error.message };
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      storage.clearAll();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // 发送邮箱验证码
  const sendEmailCode = async (email) => {
    try {
      await authAPI.sendEmailCode(email);
      return { success: true };
    } catch (error) {
      console.error('Send email code error:', error);
      
      // 检查是否是邮件服务器认证问题
      const errorMessage = error.response?.data || error.message || 'Unknown error';
      const isMailAuthError = errorMessage.includes('AuthenticationFailedException') || 
                             errorMessage.includes('WebLoginRequired') ||
                             errorMessage.includes('534-5.7.9');
      
      return { 
        success: false, 
        error: errorMessage,
        isMailAuthError 
      };
    }
  };

  // 发送激活邮件
  const sendActivationEmail = async (email) => {
    try {
      await authAPI.sendActivationEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Send activation email error:', error);
      
      // 检查是否是邮件服务器认证问题
      const errorMessage = error.response?.data || error.message || 'Unknown error';
      const isMailAuthError = errorMessage.includes('AuthenticationFailedException') || 
                             errorMessage.includes('WebLoginRequired') ||
                             errorMessage.includes('534-5.7.9');
      
      return { 
        success: false, 
        error: errorMessage,
        isMailAuthError 
      };
    }
  };

  // 忘记密码
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 重置密码
  const resetPassword = async (code, newPassword) => {
    try {
      await authAPI.resetPassword(code, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 更新用户信息
  const updateUser = async (userData) => {
    try {
      const updatedUser = await userAPI.updateMe(userData);
      storage.setUserInfo(updatedUser);
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: updatedUser
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    sendEmailCode,
    sendActivationEmail,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError: () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
