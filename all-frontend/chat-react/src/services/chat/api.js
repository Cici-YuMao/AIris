import axios from 'axios';
import authService from './auth';

class ApiService {
    constructor() {
        // service api
        // this.messageServiceUrl = 'http://10.144.1.1:9330';
        this.messageServiceUrl = 'http://10.144.2.1:8088';
        // this.realtimeServiceUrl = 'http://10.144.1.1:9531';
        this.realtimeServiceUrl = 'http://10.144.2.1:8088';

        this.setupInterceptors();
    }

    getMessageServiceUrl() {
        return this.messageServiceUrl;
    }

    getRealtimeServiceUrl() {
        return this.realtimeServiceUrl;
    }

    // 设置请求拦截器
    setupInterceptors() {
        // 请求拦截器 - 自动添加认证头
        axios.interceptors.request.use(
            (config) => {
                const token = authService.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器 - 处理认证错误
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                if (error.response && error.response.status === 401) {
                    // 发送认证错误事件
                    window.dispatchEvent(new CustomEvent('auth-error', {
                        detail: {
                            source: 'api_interceptor',
                            reason: 'unauthorized',
                            response: error.response
                        }
                    }));
                }
                return Promise.reject(error);
            }
        );
    }

    // 移除 getConfig 方法，不再需要从localStorage读取配置

    // Get conversation list
    async getConversations(userId, page = 1, size = 20, beforeTimestamp = null) {
        try {
            const params = {
                page,
                size
            };
            if (beforeTimestamp) {
                params.beforeTimestamp = beforeTimestamp;
            }

            const response = await axios.get(
                `${this.messageServiceUrl}/api/v1/messages/conversations/${userId}`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    // Get message history
    async getMessages(chatId, userId, page = 1, size = 30, beforeTimestamp = null) {
        try {
            const params = {
                userId,
                page,
                size
            };
            if (beforeTimestamp) {
                params.beforeTimestamp = beforeTimestamp;
            }

            const response = await axios.get(
                `${this.messageServiceUrl}/api/v1/messages/history/${chatId}`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    // Search messages
    async searchMessages(userId, keyword, chatId = null, page = 1, size = 20, startTimestamp = null, endTimestamp = null) {
        try {
            const request = {
                userId,
                keyword,
                page,
                size
            };

            if (chatId) {
                request.chatId = chatId;
            }

            if (startTimestamp) {
                request.startTimestamp = startTimestamp;
            }

            if (endTimestamp) {
                request.endTimestamp = endTimestamp;
            }

            const response = await axios.post(
                `${this.messageServiceUrl}/api/v1/messages/search`,
                request
            );
            return response.data;
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    }

    // Mark messages as read
    async markMessagesAsRead(chatId, userId, messageId = null) {
        try {
            const request = {
                chatId,
                userId,
                messageId
            };

            await axios.post(
                `${this.messageServiceUrl}/api/v1/messages/mark-read`,
                request
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    // Get user online status
    async getUserOnlineStatus(userId) {
        try {
            const response = await axios.get(
                `${this.realtimeServiceUrl}/api/chat/online/status/${userId}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user online status:', error);
            throw error;
        }
    }

    // Upload media file
    async uploadMedia(file, senderId, receiverId, onProgress) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('senderId', senderId);
            formData.append('receiverId', receiverId);

            const response = await axios.post(
                `${this.realtimeServiceUrl}/api/chat/upload-media`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.lengthComputable) {
                            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                            onProgress(progress);
                        }
                    }
                }
            );

            if (response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    }

    // Test connection to services
    async testConnection() {
        try {
            const messageServiceTest = axios.get(`${this.messageServiceUrl}/api/v1/messages/test`);
            const realtimeServiceTest = axios.get(`${this.realtimeServiceUrl}/api/chat/health`);

            const results = await Promise.allSettled([messageServiceTest, realtimeServiceTest]);

            return {
                messageService: results[0].status === 'fulfilled',
                realtimeService: results[1].status === 'fulfilled'
            };
        } catch (error) {
            console.error('Error testing connection:', error);
            return {
                messageService: false,
                realtimeService: false
            };
        }
    }

    // Validate JWT token
    async validateToken(token) {
        try {
            const response = await axios.post(
                `${this.messageServiceUrl}/api/v1/auth/validate`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.status === 200;
        } catch (error) {
            console.error('Error validating token:', error);
            return false;
        }
    }
}

export default new ApiService(); 