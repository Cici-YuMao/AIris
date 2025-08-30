import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AirisLogo from '../components/Logo/AirisLogo.jsx';
import { guestAPI } from '../services/guest.js';
import './GuestPlaza.css';

const GuestPlaza = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]); // 存储所有用户数据
  const [displayUsers, setDisplayUsers] = useState([]); // 存储展示的匿名化用户

  useEffect(() => {
    loadGuestData();
  }, []);

  // 匿名化用户数据
  const anonymizeUser = (user, index) => {
    // 匿名化头像（使用emoji）
    const avatars = ['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🏫', '👩‍🍳', '👨‍⚕️', '👩‍🔬', '👨‍🎤', '👩‍🎓', '👨‍🌾'];
    
    // 匿名化昵称
    const anonymousNames = ['小雅', '阿明', '艺术家', '老师', '美食家', '医生', '科学家', '音乐人', '学霸', '农夫'];
    
    // 简化兴趣爱好（只保留前3个，或生成通用兴趣）
    const commonHobbies = [
      ['阅读', '旅行', '摄影'],
      ['编程', '健身', '音乐'],
      ['绘画', '设计', '咖啡'],
      ['教学', '读书', '徒步'],
      ['烹饪', '美食', '瑜伽'],
      ['医学', '跑步', '电影'],
      ['科研', '游泳', '摄影'],
      ['音乐', '吉他', '演唱'],
      ['学习', '篮球', '游戏'],
      ['种植', '钓鱼', '户外']
    ];

    return {
      id: `guest_${index + 1}`,
      avatar: avatars[index % avatars.length],
      nickname: anonymousNames[index % anonymousNames.length],
      age: user.age,
      city: user.city,
      hobbies: user.hobbies?.slice(0, 3) || commonHobbies[index % commonHobbies.length],
      online: user.online || Math.random() > 0.5 // 如果没有在线状态，随机生成
    };
  };

  const loadGuestData = async () => {
    try {
      console.log('🔍 开始加载真实用户数据...');
      const users = await guestAPI.getHotUsers(20); // 获取20个用户
      
      if (users && users.length > 0) {
        console.log('✅ 成功获取后端数据:', users.length, '个用户');
        setAllUsers(users);
        
        // 只展示前12个用户，并进行匿名化处理
        const usersToDisplay = users.slice(0, 12);
        const anonymizedUsers = usersToDisplay.map((user, index) => anonymizeUser(user, index));
        setDisplayUsers(anonymizedUsers);
        
        console.log('🎉 真实数据处理完成!', anonymizedUsers);
      } else {
        throw new Error('后端返回空数据');
      }
    } catch (error) {
      console.error('❌ 无法获取后端数据:', error.message);
      console.log('💡 请确保后端服务正在运行');
      
      // 显示错误提示而不是模拟数据
      setDisplayUsers([]);
      setAllUsers([]);
    }
  };

  const handleJoinNow = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="guest-plaza">
      {/* Background Animation */}
      <div className="floating-hearts">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="floating-heart">💕</div>
        ))}
      </div>

      {/* Header */}
      <header className="guest-header">
        <div className="header-content">
          <div className="brand-section">
            <AirisLogo size="medium" />
            <h1 className="plaza-title">Airis 游客广场</h1>
            <p className="plaza-subtitle">🤖 体验AI智能匹配的魅力</p>
          </div>
          <div className="auth-buttons">
            <button className="login-btn" onClick={handleLogin}>
              登录
            </button>
            <button className="join-btn" onClick={handleJoinNow}>
              加入Airis
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="guest-main">
        {/* Featured Users */}
        <section className="featured-section">
          <h2>✨ 精选用户</h2>
          <p className="section-desc">
            来自真实用户数据的精选展示 
            {allUsers.length > 0 && `（当前已加载 ${allUsers.length} 位用户）`}
          </p>
          
          {displayUsers.length > 0 ? (
            <div className="users-grid">
              {displayUsers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-header">
                    <div className="user-avatar">
                      {user.avatar}
                      {user.online && <div className="online-indicator"></div>}
                    </div>
                    <div className="user-info">
                      <h3>{user.nickname}</h3>
                      <p>{user.age}岁 · {user.city}</p>
                    </div>
                  </div>
                  <div className="user-hobbies">
                    {user.hobbies.map((hobby, index) => (
                      <span key={index} className="hobby-tag">{hobby}</span>
                    ))}
                  </div>
                  <div className="user-actions">
                    <button className="view-btn" disabled>
                      👀 查看详情
                    </button>
                    <span className="guest-hint">需要登录</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading-state">
              <div className="loading-message">
                <h3>🔌 正在连接后端服务...</h3>
                <p>请确保后端服务运行在 http://10.144.2.1:8081</p>
                <p>如果问题持续，请检查网络连接或后端服务状态</p>
                <button 
                  className="retry-btn" 
                  onClick={loadGuestData}
                >
                  🔄 重新加载
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Features Showcase */}
        <section className="features-section">
          <h2>🚀 Airis 特色功能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI智能匹配</h3>
              <p>基于深度学习算法，精准分析你的偏好和性格，为你推荐最合适的人</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>性格分析</h3>
              <p>多维度性格测试，深度了解自己，找到真正契合的灵魂伴侣</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌈</div>
              <h3>兴趣匹配</h3>
              <p>根据共同兴趣爱好智能推荐，让聊天从第一句话就有话题</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>隐私保护</h3>
              <p>严格的隐私保护机制，确保你的个人信息安全，放心交友</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>实时聊天</h3>
              <p>流畅的即时通讯体验，支持文字、图片、语音等多种交流方式</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎉</div>
              <h3>活动社交</h3>
              <p>线上线下丰富活动，在轻松愉快的氛围中遇见有趣的人</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>🌟 开始你的心动之旅</h2>
            <p>加入 Airis，让AI帮你找到最合适的人</p>
            <div className="cta-buttons">
              <button className="primary-cta" onClick={handleJoinNow}>
                🚀 立即注册
              </button>
              <button className="secondary-cta" onClick={handleLogin}>
                🔑 已有账号？登录
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="guest-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <AirisLogo size="small" />
            <span>Airis - AI智能匹配交友平台</span>
          </div>
          <div className="footer-links">
            <a href="#about">关于我们</a>
            <a href="#privacy">隐私政策</a>
            <a href="#terms">服务条款</a>
            <a href="#contact">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestPlaza;
