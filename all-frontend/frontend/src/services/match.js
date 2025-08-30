import request from '../utils/request.js';

// 匹配相关API
export const matchAPI = {
  // 游客广场 - 热门用户
  getHotUsers(count = 10) {
    return request.get(`/api/v1/match/hot-users?count=${count}`);
  },

  // 推荐用户
  getRecommendUsers() {
    return request.get('/api/v1/match/recommend');
  },

  // 高匹配用户
  getHighlyMatchedUsers() {
    return request.get('/api/v1/match/highly-matched');
  },

  // 获取用户详情
  getUserDetail(userId) {
    return request.get(`/api/v1/match/user/${userId}`);
  }
};
