import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/chat/auth';
import '../../styles/chat/Welcome.css';

const Welcome = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 如果已经认证，直接跳转到聊天页面
        if (authService.isAuthenticated()) {
            const config = localStorage.getItem('chatConfig');
            const savedUserId = localStorage.getItem('chatUserId');
            
            if (config || savedUserId) {
                navigate('/chat');
                return;
            }
        }

        // 尝试从localStorage加载已保存的数据
        const savedToken = localStorage.getItem('accessToken');
        const savedUserId = localStorage.getItem('chatUserId');
        
        if (savedToken) {
            setAccessToken(savedToken);
        }
        if (savedUserId) {
            setUserId(savedUserId);
        }
    }, [navigate]);

    const handleLogin = async () => {
        if (!userId.trim()) {
            alert('请输入用户ID');
            return;
        }
        
        if (!accessToken.trim()) {
            alert('请输入访问令牌');
            return;
        }

        setIsLoading(true);

        try {
            // 保存认证信息
            authService.setAccessToken(accessToken);
            localStorage.setItem('chatUserId', userId);

            // 验证token
            if (!authService.isAuthenticated()) {
                alert('令牌无效或已过期，请检查您的访问令牌');
                setIsLoading(false);
                return;
            }

            // 保存到localStorage
            const config = {
                userId: userId,
                serverNode: 'node1'
            };
            localStorage.setItem('chatConfig', JSON.stringify(config));

            // 跳转到聊天页面
            navigate('/chat');
        } catch (error) {
            console.error('登录失败:', error);
            alert('登录失败，请检查您的配置');
            setIsLoading(false);
        }
    };

    const generateUserId = () => {
        const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        setUserId(newUserId);
    };

    const generateSampleToken = () => {
        // 生成示例token (仅用于测试)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: userId || 'user_sample',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时
        }));
        const signature = btoa('sample_signature_for_testing');
        const sampleToken = `${header}.${payload}.${signature}`;
        setAccessToken(sampleToken);
    };

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <div className="welcome-header">
                    <h1>欢迎使用聊天应用</h1>
                    <p>请配置您的用户信息以开始聊天</p>
                </div>

                <div className="login-form">
                    <div className="form-section">
                        <h2>用户配置</h2>
                        
                        <div className="form-group">
                            <label>用户ID:</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="输入您的用户ID"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>访问令牌 (JWT):</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="输入您的JWT访问令牌"
                                    className="form-input"
                                />
                                {/*<button*/}
                                {/*    onClick={generateSampleToken}*/}
                                {/*    className="btn btn-secondary"*/}
                                {/*    type="button"*/}
                                {/*>*/}
                                {/*    生成示例*/}
                                {/*</button>*/}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={handleLogin}
                                disabled={isLoading || !userId.trim() || !accessToken.trim()}
                                className="btn btn-primary login-btn"
                            >
                                {isLoading ? '登录中...' : '开始聊天'}
                            </button>
                        </div>
                    </div>

                    <div className="server-info">
                        <h3>服务器信息</h3>
                        <div className="info-item">
                            <span className="info-label">消息服务:</span>
                            <span className="info-value">http://10.144.1.1:9330</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">实时服务:</span>
                            <span className="info-value">ws://10.144.1.1:9531</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome; 