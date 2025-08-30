import request from '../utils/request.js';

// 用户相关API
export const userAPI = {
  // 获取当前用户信息
  getMe() {
    return request.get('/api/v1/users/me');
  },

  // 更新用户信息
  updateMe(userData) {
    return request.put('/api/v1/users/me', userData);
  },

  // 获取用户设置
  getSettings() {
    return request.get('/api/v1/users/settings');
  },

  // 更新用户设置
  updateSettings(settings) {
    return request.put('/api/v1/users/settings', settings);
  },

  // 获取用户偏好
  getPreference() {
    return request.get('/api/v1/users/preference');
  },

  // 更新用户偏好
  updatePreference(preference) {
    return request.put('/api/v1/users/preference', preference);
  },

  // 删除账号
  deleteAccount() {
    return request.delete('/api/v1/users/me');
  },

  // 根据ID获取用户名
  getUsernameById(id) {
    return request.get(`/api/v1/users/${id}/username`);
  },

  // 获取用户详细信息
  getUserDetail(userId) {
    return request.get(`/api/v1/users/${userId}/detail`);
  },

  // 获取用户基本信息
  getUserBasicInfo(userId) {
    return request.get(`/api/v1/users/${userId}/basic`);
  }
};
