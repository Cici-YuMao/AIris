// 本地存储工具函数
export const storage = {
  // Token相关
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },
  
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },
  
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  // 用户信息相关
  setUserInfo(userInfo) {
    if (userInfo && typeof userInfo === 'object') {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('userInfo');
    }
  },
  
  getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo || userInfo === 'undefined' || userInfo === 'null') {
      return null;
    }
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      // 清除无效数据
      localStorage.removeItem('userInfo');
      return null;
    }
  },
  
  clearUserInfo() {
    localStorage.removeItem('userInfo');
  },
  
  // 清除所有数据
  clearAll() {
    this.clearTokens();
    this.clearUserInfo();
  },

  // 检查并清理损坏的数据
  validateAndCleanStorage() {
    try {
      console.log('Validating localStorage data...');
      let cleaned = false;
      
      // 检查 userInfo
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo && (userInfo === 'undefined' || userInfo === 'null')) {
        console.log('Cleaning corrupted userInfo data');
        localStorage.removeItem('userInfo');
        cleaned = true;
      }
      
      // 检查 tokens
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken === 'undefined' || accessToken === 'null') {
        console.log('Cleaning corrupted accessToken data');
        localStorage.removeItem('accessToken');
        cleaned = true;
      }
      if (refreshToken === 'undefined' || refreshToken === 'null') {
        console.log('Cleaning corrupted refreshToken data');
        localStorage.removeItem('refreshToken');
        cleaned = true;
      }
      
      if (cleaned) {
        console.log('localStorage data cleaned successfully');
      } else {
        console.log('localStorage data is valid');
      }
    } catch (error) {
      console.error('Error validating localStorage:', error);
      console.log('Clearing all localStorage data due to error');
      // 如果有严重错误，清除所有数据
      this.clearAll();
    }
  }
};
