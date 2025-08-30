import request from '../utils/request.js';

// 聊天相关API
export const chatAPI = {
  // 获取聊天对象信息
  getChatUser(userId) {
    return request.get(`/api/v1/chat/user/${userId}`);
  },

  // 获取聊天记录
  getMessages(userId, page = 0, size = 50) {
    return request.get(`/api/v1/chat/messages/${userId}?page=${page}&size=${size}`);
  },

  // 发送消息
  sendMessage(userId, content, type = 'text') {
    return request.post(`/api/v1/chat/send/${userId}`, { 
      content, 
      type 
    });
  },

  // 标记消息为已读
  markAsRead(userId) {
    return request.put(`/api/v1/chat/read/${userId}`);
  },

  // 获取聊天列表
  getChatList() {
    return request.get('/api/v1/chat/list');
  },

  // 删除聊天记录
  deleteChat(userId) {
    return request.delete(`/api/v1/chat/${userId}`);
  }
};
