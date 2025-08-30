class AuthService {
    constructor() {
        this.setupAuthErrorListener();
    }

    // 设置认证错误监听器
    setupAuthErrorListener() {
        window.addEventListener('auth-error', (event) => {
            console.warn('Authentication error detected:', event.detail);
            this.handleAuthError(event.detail);
        });
    }

    // 处理认证错误
    handleAuthError(detail) {
        // 清除认证数据
        this.clearAuthData();

        // 通知用户
        alert('Authentication failed. Please check your access token and try again.');

        // 重定向到欢迎页面（避免在欢迎页面时重复重定向）
        if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/config')) {
            window.location.href = '/';
        }
    }

    // 获取访问令牌
    getAccessToken() {
        try {
            return localStorage.getItem('accessToken');
        } catch (e) {
            console.error('Error getting access token:', e);
            return null;
        }
    }

    // 设置访问令牌
    setAccessToken(token) {
        try {
            if (token) {
                localStorage.setItem('accessToken', token);
            } else {
                localStorage.removeItem('accessToken');
            }
        } catch (e) {
            console.error('Error setting access token:', e);
        }
    }

    // 检查是否已认证
    isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }

        // 验证token格式和过期时间
        try {
            const payload = this.decodeToken(token);
            if (!payload) {
                return false;
            }
            return true;
            // const currentTime = Date.now() / 1000;
            // return payload.exp && payload.exp > currentTime;
        } catch (e) {
            console.warn('Invalid token format:', e);
            return false;
        }
    }

    // 解码JWT token
    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }

    // 获取用户信息（从token中）
    getUserInfo() {
        const token = this.getAccessToken();
        if (!token) {
            return null;
        }

        const payload = this.decodeToken(token);
        if (!payload) {
            return null;
        }

        return {
            userId: payload.sub || payload.userId || payload.user_id,
            username: payload.username || payload.name,
            email: payload.email,
            roles: payload.roles || [],
            exp: payload.exp,
            iat: payload.iat
        };
    }

    // 获取token过期时间
    getTokenExpiration() {
        const userInfo = this.getUserInfo();
        if (!userInfo || !userInfo.exp) {
            return null;
        }

        return new Date(userInfo.exp * 1000);
    }

    // 检查token是否即将过期（30分钟内）
    isTokenExpiringSoon() {
        const expiration = this.getTokenExpiration();
        if (!expiration) {
            return true;
        }

        const now = new Date();
        const thirtyMinutes = 30 * 60 * 1000; // 30分钟
        return (expiration.getTime() - now.getTime()) < thirtyMinutes;
    }

    // 清除所有认证数据
    clearAuthData() {
        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('chatUserId');
            localStorage.removeItem('chatConfig');
            console.log('Authentication data cleared');
        } catch (e) {
            console.error('Error clearing auth data:', e);
        }
    }

    // 创建授权头
    getAuthHeader() {
        const token = this.getAccessToken();
        if (!token) {
            return {};
        }

        return {
            'Authorization': `Bearer ${token}`
        };
    }

    // 验证token格式
    validateTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        try {
            // 验证header
            JSON.parse(atob(parts[0]));
            // 验证payload
            JSON.parse(atob(parts[1]));
            // signature部分不需要验证，因为我们无法在前端验证签名
            return true;
        } catch (e) {
            return false;
        }
    }

    // 格式化token显示（隐藏敏感部分）
    formatTokenForDisplay(token, showLength = 20) {
        if (!token) {
            return '';
        }

        if (token.length <= showLength * 2) {
            return token;
        }

        const start = token.substring(0, showLength);
        const end = token.substring(token.length - showLength);
        return `${start}...${end}`;
    }

    // 获取token剩余有效时间（格式化字符串）
    getTokenTimeRemaining() {
        const expiration = this.getTokenExpiration();
        if (!expiration) {
            return 'Unknown';
        }

        const now = new Date();
        const diffMs = expiration.getTime() - now.getTime();

        if (diffMs <= 0) {
            return 'Expired';
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        } else {
            return `${diffMinutes}m`;
        }
    }

    // 刷新认证状态检查
    refreshAuthStatus() {
        const isAuth = this.isAuthenticated();
        const isExpiringSoon = this.isTokenExpiringSoon();

        // 发送认证状态更新事件
        window.dispatchEvent(new CustomEvent('auth-status-change', {
            detail: {
                isAuthenticated: isAuth,
                isExpiringSoon: isExpiringSoon,
                userInfo: this.getUserInfo(),
                timeRemaining: this.getTokenTimeRemaining()
            }
        }));

        return {
            isAuthenticated: isAuth,
            isExpiringSoon: isExpiringSoon
        };
    }

    // 启动定期检查token状态
    startTokenMonitoring(intervalMs = 60000) { // 默认每分钟检查一次
        this.stopTokenMonitoring(); // 先停止之前的监控

        this.tokenMonitorInterval = setInterval(() => {
            const status = this.refreshAuthStatus();

            if (!status.isAuthenticated) {
                console.warn('Token expired, stopping monitoring');
                this.stopTokenMonitoring();
                this.handleAuthError({ source: 'token_monitor', reason: 'expired' });
            } else if (status.isExpiringSoon) {
                console.warn('Token expiring soon');
            }
        }, intervalMs);

        console.log('Token monitoring started');
    }

    // 停止token监控
    stopTokenMonitoring() {
        if (this.tokenMonitorInterval) {
            clearInterval(this.tokenMonitorInterval);
            this.tokenMonitorInterval = null;
            console.log('Token monitoring stopped');
        }
    }
}

// 创建单例实例
const authService = new AuthService();

export default authService; 