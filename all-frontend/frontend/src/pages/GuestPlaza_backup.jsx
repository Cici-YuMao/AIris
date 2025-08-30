import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AirisLogo from '../components/Logo/AirisLogo.jsx';
import { guestAPI } from '../services/guest.js';
import './GuestPlaza.css';

const GuestPlaza = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]); // 存储所有用户数据用于地图
  const [displayUsers, setDisplayUsers] = useState([]); // 存储展示的匿名化用户
  const [userLocations, setUserLocations] = useState({});

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
      // 尝试调用后端的热门用户接口
      console.log('🔍 开始加载用户数据...');
      const users = await guestAPI.getHotUsers();
      console.log('✅ 获取到用户数据:', users.length, '个用户');
      
      if (users && users.length > 0) {
        setAllUsers(users);
        
        // 使用真实数据统计城市分布
        const locations = {};
        users.forEach(user => {
          if (user.city) {
            locations[user.city] = (locations[user.city] || 0) + 1;
          }
        });
        setUserLocations(locations);
        
        // 只展示前12个用户，并进行匿名化处理
        const usersToDisplay = users.slice(0, 12);
        const anonymizedUsers = usersToDisplay.map((user, index) => anonymizeUser(user, index));
        setDisplayUsers(anonymizedUsers);
        
        console.log('🎉 真实数据加载成功!');
        return;
      }
    } catch (error) {
      console.warn('⚠️ 后端数据加载失败，使用模拟数据:', error.message);
    }
    
    // 使用模拟数据
    console.log('📊 使用模拟数据展示');
    const mockUsers = [
      {
        id: 'mock_1', nickname: '张小明', age: 25, city: '上海',
        hobbies: ['摄影', '旅行', '阅读'], online: true, popularity: 95
      },
      {
        id: 'mock_2', nickname: '李小红', age: 28, city: '北京',
        hobbies: ['编程', '健身', '音乐'], online: false, popularity: 89
      },
      {
        id: 'mock_3', nickname: '王艺术家', age: 24, city: '广州',
        hobbies: ['绘画', '设计', '咖啡'], online: true, popularity: 87
      },
      {
        id: 'mock_4', nickname: '陈老师', age: 30, city: '深圳',
        hobbies: ['教学', '读书', '徒步'], online: true, popularity: 85
      },
      {
        id: 'mock_5', nickname: '美食达人', age: 26, city: '成都',
        hobbies: ['烹饪', '美食', '瑜伽'], online: false, popularity: 83
      },
      {
        id: 'mock_6', nickname: '医生李', age: 32, city: '杭州',
        hobbies: ['医学', '跑步', '电影'], online: true, popularity: 82
      },
      {
        id: 'mock_7', nickname: '程序员小王', age: 27, city: '南京',
        hobbies: ['编程', '游戏', '篮球'], online: true, popularity: 81
      },
      {
        id: 'mock_8', nickname: '设计师小周', age: 25, city: '西安',
        hobbies: ['设计', '咖啡', '电影'], online: false, popularity: 79
      }
    ];
    
    setAllUsers(mockUsers);
    
    // 模拟城市分布数据
    const mockLocations = {
      '上海': 2850,
      '北京': 2630, 
      '广州': 1980,
      '深圳': 1750,
      '成都': 1420,
      '杭州': 1180,
      '南京': 980,
      '西安': 850
    };
    setUserLocations(mockLocations);
    
    // 匿名化展示用户
    const anonymizedUsers = mockUsers.map((user, index) => anonymizeUser(user, index));
    setDisplayUsers(anonymizedUsers);
    
    console.log('✅ 模拟数据加载完成');
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
        {/* User Statistics */}
        <section className="stats-section">
          <h2>� 平台数据统计</h2>
          <p className="section-desc">实时用户活跃数据一览</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{allUsers.length || 15000}</div>
                <div className="stat-label">注册用户</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-content">
                <div className="stat-number">{Math.floor((allUsers.length || 15000) * 0.18)}</div>
                <div className="stat-label">在线用户</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💕</div>
              <div className="stat-content">
                <div className="stat-number">{Math.floor((allUsers.length || 15000) * 0.05)}</div>
                <div className="stat-label">今日匹配</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-number">96%</div>
                <div className="stat-label">满意度</div>
              </div>
            </div>
          </div>

          {/* City Distribution Chart */}
          <div className="chart-container">
            <h3>🏙️ 用户城市分布</h3>
            <div className="chart-bars">
              {Object.entries(userLocations).length > 0 ? 
                Object.entries(userLocations)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([city, count], index) => {
                    const maxCount = Math.max(...Object.values(userLocations));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={city} className="chart-bar">
                        <div className="bar-label">{city}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: `hsl(${210 + index * 25}, 70%, 60%)`
                            }}
                          ></div>
                        </div>
                        <div className="bar-value">{count}</div>
                      </div>
                    );
                  })
                :
                // 默认数据展示
                [
                  { city: '上海', count: 2850, color: 'hsl(210, 70%, 60%)' },
                  { city: '北京', count: 2630, color: 'hsl(235, 70%, 60%)' },
                  { city: '广州', count: 1980, color: 'hsl(260, 70%, 60%)' },
                  { city: '深圳', count: 1750, color: 'hsl(285, 70%, 60%)' },
                  { city: '成都', count: 1420, color: 'hsl(310, 70%, 60%)' },
                  { city: '杭州', count: 1180, color: 'hsl(335, 70%, 60%)' },
                  { city: '南京', count: 980, color: 'hsl(360, 70%, 60%)' },
                  { city: '西安', count: 850, color: 'hsl(25, 70%, 60%)' }
                ].map(({ city, count, color }, index) => {
                  const percentage = (count / 2850) * 100;
                  return (
                    <div key={city} className="chart-bar">
                      <div className="bar-label">{city}</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">{count}</div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </section>

        {/* Featured Users */}
        <section className="featured-section">
          <h2>✨ 精选用户</h2>
          <p className="section-desc">看看这些有趣的朋友们（已匿名化）</p>
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
