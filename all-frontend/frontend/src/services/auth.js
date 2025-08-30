import request from '../utils/request.js';

// 认证相关API
export const authAPI = {
  // 发送邮箱验证码
  sendEmailCode(email) {
    return request.post('/api/v1/auth/send-email-code', { email });
  },

  // 发送激活邮件
  sendActivationEmail(email) {
    return request.post('/api/v1/auth/send-activation-email', { email });
  },

  // 用户注册
  register(userData) {
    return request.post('/api/v1/auth/register', userData);
  },

  // 用户登录
  login(identifier, password) {
    return request.post('/api/v1/auth/login', { identifier, password });
  },

  // 刷新Token
  refreshToken(refreshToken) {
    return request.post('/api/v1/auth/refresh-token', { refreshToken });
  },

  // 登出
  logout() {
    return request.post('/api/v1/auth/logout');
  },

  // 忘记密码
  forgotPassword(email) {
    return request.post('/api/v1/auth/forgot-password', { email });
  },

  // 重置密码
  resetPassword(code, newPassword) {
    return request.post('/api/v1/auth/reset-password', { code, newPassword });
  }
};
