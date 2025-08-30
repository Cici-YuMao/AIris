// 游客模式API服务
// 注意：游客模式下只能访问公开的、匿名的数据

import request from '../utils/request.js';

// 游客模式专用的请求客户端，不会附带认证token
const guestRequest = async (url, options = {}) => {
  try {
    // 直接使用fetch而不是request，避免附带token
    const response = await fetch(`http://10.144.2.1:8081${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Guest API request failed:', error);
    throw error;
  }
};

export const guestAPI = {
  // 获取热门用户（游客广场展示）
  getHotUsers: async () => {
    try {
      // 调用后端热门用户接口
      const response = await guestRequest('/api/v1/match/hot-users');
      
      // 检查响应格式，如果是新格式则返回data字段，否则返回原始数据
      if (response && response.success && response.data) {
        return response.data;
      }
      // 兼容旧格式（直接返回数组）
      return response || [];
    } catch (error) {
      console.error('获取热门用户失败，使用模拟数据:', error);
      // 返回完整的模拟数据（模拟真实用户数据格式）
      return [
        {
          id: "user_12345",
          nickname: "张小明",
          age: 25,
          city: "上海",
          hobbies: ["摄影", "旅行", "阅读", "音乐", "运动"],
          online: true,
          popularity: 95.2,
          avatar_url: "https://example.com/avatar.jpg"
        },
        {
          id: "user_67890", 
          nickname: "李小红",
          age: 28,
          city: "北京",
          hobbies: ["编程", "健身", "电影", "烹饪"],
          online: false,
          popularity: 89.7,
          avatar_url: "https://example.com/avatar2.jpg"
        },
        {
          id: "user_99999",
          nickname: "王艺术家",
          age: 24,
          city: "广州",
          hobbies: ["绘画", "设计", "咖啡", "瑜伽", "摄影"],
          online: true,
          popularity: 87.3,
          avatar_url: "https://example.com/avatar3.jpg"
        },
        {
          id: "user_11111",
          nickname: "陈老师",
          age: 30,
          city: "深圳",
          hobbies: ["教学", "读书", "徒步", "写作"],
          online: true,
          popularity: 85.1,
          avatar_url: "https://example.com/avatar4.jpg"
        },
        {
          id: "user_22222",
          nickname: "美食达人",
          age: 26,
          city: "成都",
          hobbies: ["烹饪", "美食", "瑜伽", "旅行", "摄影"],
          online: false,
          popularity: 83.9,
          avatar_url: "https://example.com/avatar5.jpg"
        },
        {
          id: "user_33333",
          nickname: "医生李",
          age: 32,
          city: "杭州",
          hobbies: ["医学", "跑步", "电影", "阅读"],
          online: true,
          popularity: 82.5,
          avatar_url: "https://example.com/avatar6.jpg"
        },
        {
          id: "user_44444",
          nickname: "程序员小王",
          age: 27,
          city: "西安",
          hobbies: ["编程", "游戏", "篮球", "音乐"],
          online: true,
          popularity: 81.2,
          avatar_url: "https://example.com/avatar7.jpg"
        },
        {
          id: "user_55555",
          nickname: "设计师小周",
          age: 25,
          city: "南京",
          hobbies: ["设计", "咖啡", "电影", "旅行"],
          online: false,
          popularity: 79.8,
          avatar_url: "https://example.com/avatar8.jpg"
        },
        {
          id: "user_66666",
          nickname: "运动达人",
          age: 29,
          city: "青岛",
          hobbies: ["健身", "游泳", "登山", "摄影"],
          online: true,
          popularity: 78.4,
          avatar_url: "https://example.com/avatar9.jpg"
        },
        {
          id: "user_77777",
          nickname: "音乐人小刘",
          age: 26,
          city: "重庆",
          hobbies: ["音乐", "吉他", "演唱", "创作"],
          online: true,
          popularity: 77.1,
          avatar_url: "https://example.com/avatar10.jpg"
        },
        {
          id: "user_88888",
          nickname: "文学青年",
          age: 24,
          city: "武汉",
          hobbies: ["写作", "阅读", "诗歌", "哲学"],
          online: false,
          popularity: 75.7,
          avatar_url: "https://example.com/avatar11.jpg"
        },
        {
          id: "user_99900",
          nickname: "创业者小张",
          age: 31,
          city: "天津",
          hobbies: ["创业", "投资", "读书", "网球"],
          online: true,
          popularity: 74.3,
          avatar_url: "https://example.com/avatar12.jpg"
        },
        {
          id: "user_10101",
          nickname: "摄影师老李",
          age: 35,
          city: "大连",
          hobbies: ["摄影", "旅行", "咖啡", "电影"],
          online: false,
          popularity: 73.0,
          avatar_url: "https://example.com/avatar13.jpg"
        },
        {
          id: "user_20202",
          nickname: "瑜伽教练",
          age: 28,
          city: "厦门",
          hobbies: ["瑜伽", "冥想", "健康", "茶道"],
          online: true,
          popularity: 71.6,
          avatar_url: "https://example.com/avatar14.jpg"
        },
        {
          id: "user_30303",
          nickname: "科研工作者",
          age: 33,
          city: "合肥",
          hobbies: ["科研", "数学", "编程", "围棋"],
          online: true,
          popularity: 70.2,
          avatar_url: "https://example.com/avatar15.jpg"
        }
      ];
    }
  },

  // 获取统计数据（游客广场展示）
  getStats: async () => {
    try {
      return await guestRequest('/api/v1/guest/stats');
    } catch (error) {
      console.error('获取统计数据失败，使用模拟数据:', error);
      // 返回模拟统计数据
      return {
        totalUsers: 10000,
        onlineUsers: 2580,
        dailyMatches: 450,
        successfulConnections: 8960
      };
    }
  },

  // 获取推荐用户（基于兴趣的推荐，游客模式）
  getRecommendedUsers: async (interests = []) => {
    try {
      const params = interests.length > 0 ? `?interests=${interests.join(',')}` : '';
      return await guestRequest(`/api/v1/guest/recommended${params}`);
    } catch (error) {
      console.error('获取推荐用户失败，使用模拟数据:', error);
      return [
        {
          id: 'rec_1',
          avatar: '🎵',
          nickname: '音乐爱好者',
          age: 26,
          city: '北京',
          commonInterests: ['音乐', '摄影'],
          matchScore: 85
        },
        {
          id: 'rec_2',
          avatar: '📚',
          nickname: '书虫',
          age: 24,
          city: '上海',
          commonInterests: ['阅读', '旅行'],
          matchScore: 78
        }
      ];
    }
  },

  // 获取城市分布数据
  getCityDistribution: async () => {
    try {
      return await guestRequest('/api/v1/guest/city-distribution');
    } catch (error) {
      console.error('获取城市分布失败，使用模拟数据:', error);
      return {
        '上海': 1250,
        '北京': 1180,
        '广州': 890,
        '深圳': 820,
        '成都': 720,
        '杭州': 650,
        '西安': 580,
        '南京': 520,
        '青岛': 460,
        '重庆': 440,
        '武汉': 420,
        '天津': 380,
        '大连': 340,
        '厦门': 320,
        '合肥': 280
      };
    }
  }
};
