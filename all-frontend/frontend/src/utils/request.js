import axios from 'axios';
import {GATEWAY_URL} from '../config/api.js';

// const API_BASE_URL = 'http://10.144.2.1:8081';
const API_BASE_URL = `${GATEWAY_URL}`;

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理token过期
request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Token过期，尝试刷新
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
            refreshToken
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return request(originalRequest);
        } catch (refreshError) {
          // 刷新失败，清除token并跳转登录
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // 只有在非游客页面时才跳转登录
          if (!window.location.pathname.includes('/guest-plaza')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // 没有refresh token，只有在非游客页面时才跳转登录
        if (!window.location.pathname.includes('/guest-plaza')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default request;
