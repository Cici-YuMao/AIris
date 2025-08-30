import request from '../utils/request.js';

// 用户交互API
export const interactionAPI = {
  // 点赞
  likeUser(targetUserId) {
    return request.post(`/api/v1/interact/like/${targetUserId}`);
  },

  // 评论
  commentUser(targetUserId, content) {
    return request.post(`/api/v1/interact/comment/${targetUserId}`, { content });
  },

  // 累计消息数
  incrementMessageCount(targetUserId, count) {
    return request.post(`/api/v1/interact/message-count/${targetUserId}`, { count });
  },

  // 屏蔽用户
  blockUser(targetUserId) {
    return request.post(`/api/v1/interact/block/${targetUserId}`);
  },

  // 取消屏蔽用户
  unblockUser(targetUserId) {
    return request.delete(`/api/v1/interact/block/${targetUserId}`);
  }
};
