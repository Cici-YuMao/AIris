// 游客模式API服务
// 注意：游客模式下只能访问公开的、匿名的数据

import request from '../utils/request.js';

// 游客模式专用的请求客户端，不会附带认证token
const guestRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`http://10.144.2.1:8081${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('后端连接失败:', error.message);
    throw error;
  }
};

export const guestAPI = {
  // 获取热门用户（游客广场展示）
  getHotUsers: async (count = 20) => {
    try {
      const response = await guestRequest(`/api/v1/match/hot-users?count=${count}`);
      
      // 将后端返回的复杂数据结构转换为前端需要的格式
      if (Array.isArray(response) && response.length > 0) {
        const converted = response.map(item => {
          const userInfo = item.userInfo || {};
          return {
            id: userInfo.id?.toString() || Math.random().toString(),
            nickname: userInfo.name || userInfo.username || '匿名用户',
            age: userInfo.age || 25,
            city: userInfo.city || '未知城市',
            hobbies: userInfo.hobbies ? userInfo.hobbies.split(',').map(h => h.trim()) : ['未知'],
            online: Math.random() > 0.5, // 随机生成在线状态
            popularity: userInfo.popularity || 0,
            avatar_url: item.photoUrls && item.photoUrls.length > 0 ? item.photoUrls[0] : null
          };
        });
        
        console.log(`✅ 成功转换 ${converted.length} 个用户数据`);
        return converted;
      }
      
      throw new Error('后端返回数据格式不正确或为空');
    } catch (error) {
      console.error('获取热门用户失败:', error.message);
      throw error;
    }
  }
};
