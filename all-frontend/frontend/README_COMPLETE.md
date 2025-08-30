# Airis Dating App Frontend

基于React的现代化交友平台前端应用，包含完整的用户认证、匹配系统和个人资料管理功能。

## 🚀 功能特性

### 认证系统
- ✅ 用户注册（支持邮箱验证）
- ✅ 用户登录（支持邮箱/用户名登录）
- ✅ 忘记密码/重置密码
- ✅ 自动刷新Token
- ✅ 登出功能

### 匹配系统
- ✅ 游客广场（热门用户，无需登录）
- ✅ 个性化推荐用户（50个）
- ✅ 高匹配用户（5个）
- ✅ 用户详情展示
- ✅ 点赞和评论功能

### 用户资料管理
- ✅ 个人信息编辑
- ✅ 账号设置（通知、隐私）
- ✅ 匹配偏好设置
- ✅ 账号删除

### 其他功能
- ✅ 响应式设计（支持移动端）
- ✅ 现代化UI界面
- ✅ 路由保护
- ✅ 错误处理
- ✅ 加载状态
- ✅ 导航栏

## 🏗️ 项目结构

```
src/
├── components/              # 组件
│   ├── Auth/               # 认证相关组件
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── Auth.css
│   ├── Match/              # 匹配相关组件
│   │   ├── MatchPage.jsx
│   │   └── Match.css
│   ├── Profile/            # 用户资料组件
│   │   ├── Profile.jsx
│   │   └── Profile.css
│   └── Navigation/         # 导航组件
│       ├── Navigation.jsx
│       └── Navigation.css
├── context/                # 状态管理
│   ├── AuthContext.js      # 认证状态
│   └── UserContext.js      # 用户上下文
├── services/               # API服务
│   ├── auth.js            # 认证API
│   ├── user.js            # 用户API
│   ├── match.js           # 匹配API
│   └── interaction.js      # 交互API
├── utils/                  # 工具函数
│   ├── request.js         # HTTP请求封装
│   └── storage.js         # 本地存储
├── pages/                  # 页面组件
│   ├── HomePage.jsx       # 首页
│   ├── NotificationPage.jsx
│   └── MediaPage.jsx
├── styles/                 # 样式文件
│   └── HomePage.css
└── App.jsx                # 主应用组件
```

## 🛠️ 技术栈

- **前端框架**: React 19.1.0
- **路由**: React Router DOM 7.6.3
- **HTTP客户端**: Axios 1.10.0
- **构建工具**: Vite 7.0.0
- **WebSocket**: @stomp/stompjs, sockjs-client
- **样式**: CSS3 (现代化响应式设计)

## 📱 核心页面

### 1. 认证页面
- **登录页面** (`/login`): 支持邮箱/用户名登录
- **注册页面** (`/register`): 三步注册流程
  - 步骤1: 基本信息（邮箱验证、用户名、密码）
  - 步骤2: 个人信息（年龄、性别、外貌、职业等）
  - 步骤3: 偏好设置（年龄范围、身高体重偏好、隐私设置）
- **忘记密码** (`/forgot-password`): 邮箱验证码重置

### 2. 首页 (`/`)
- 个性化欢迎信息
- 用户统计数据展示
- 快速导航按钮
- 推荐用户预览

### 3. 发现页面 (`/match`)
- **热门广场**: 展示热门用户（游客可访问）
- **为你推荐**: 个性化推荐50个用户
- **高匹配**: 5个高匹配度用户
- 用户卡片包含：照片、基本信息、统计数据、点赞评论功能

### 4. 个人资料 (`/profile`)
- **个人资料**: 编辑基本信息、外貌特征、生活信息
- **账号设置**: 通知设置、隐私设置
- **匹配偏好**: 年龄/身高/体重偏好、兴趣偏好、地区偏好

## 🔗 API接口

### 认证相关 (`/api/v1/auth`)
```javascript
POST /api/v1/auth/send-email-code      // 发送邮箱验证码
POST /api/v1/auth/register             // 用户注册
POST /api/v1/auth/login                // 用户登录
POST /api/v1/auth/refresh-token        // 刷新Token
POST /api/v1/auth/logout               // 登出
POST /api/v1/auth/forgot-password      // 忘记密码
POST /api/v1/auth/reset-password       // 重置密码
```

### 用户相关 (`/api/v1/users`)
```javascript
GET  /api/v1/users/me                  // 获取当前用户信息
PUT  /api/v1/users/me                  // 更新用户信息
GET  /api/v1/users/settings            // 获取用户设置
PUT  /api/v1/users/settings            // 更新用户设置
GET  /api/v1/users/preference          // 获取用户偏好
PUT  /api/v1/users/preference          // 更新用户偏好
DELETE /api/v1/users/me                // 删除账号
GET  /api/v1/users/{id}/username       // 根据ID获取用户名
```

### 匹配相关 (`/api/v1/match`)
```javascript
GET /api/v1/match/hot-users            // 游客广场热门用户
GET /api/v1/match/recommend            // 推荐用户
GET /api/v1/match/highly-matched       // 高匹配用户
GET /api/v1/match/user/{userId}        // 获取用户详情
```

### 用户交互 (`/api/v1/interact`)
```javascript
POST /api/v1/interact/like/{targetUserId}        // 点赞
POST /api/v1/interact/comment/{targetUserId}     // 评论
POST /api/v1/interact/message-count/{targetUserId} // 累计消息数
```

## 🎨 设计特色

### 视觉设计
- **现代化UI**: 使用渐变背景、圆角设计、阴影效果
- **响应式布局**: 完美适配手机、平板、桌面端
- **交互动画**: hover效果、过渡动画、loading状态
- **色彩主题**: 紫色渐变主色调，简洁清新

### 用户体验
- **直观导航**: 清晰的图标和标签导航
- **表单验证**: 实时表单验证和错误提示
- **加载状态**: 优雅的loading动画和状态提示
- **错误处理**: 友好的错误信息展示

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 🔧 配置说明

### API配置
在 `src/utils/request.js` 中修改后端API地址：
```javascript
const API_BASE_URL = 'http://10.144.2.1:8081'; // 修改为你的后端地址
```

### 路由配置
应用使用React Router进行路由管理，支持：
- 公共路由（无需登录）: `/login`, `/register`, `/forgot-password`, `/match`
- 保护路由（需要登录）: `/`, `/notification`, `/media`, `/profile`

### 状态管理
使用React Context进行状态管理：
- **AuthContext**: 管理用户认证状态、登录登出
- **UserContext**: 管理用户信息和偏好设置

## 📝 开发指南

### 添加新页面
1. 在 `src/pages/` 创建新的页面组件
2. 在 `src/App.jsx` 中添加路由配置
3. 如需要认证，使用 `ProtectedRoute` 包装

### 添加新API
1. 在 `src/services/` 中添加对应的API服务文件
2. 使用统一的 `request` 工具进行HTTP请求
3. 处理错误和loading状态

### 样式开发
- 使用CSS模块化，每个组件对应独立的CSS文件
- 遵循响应式设计原则
- 使用CSS Grid和Flexbox进行布局

## 🔒 安全特性

- **Token自动刷新**: 当access token过期时自动使用refresh token刷新
- **路由保护**: 需要认证的页面自动重定向到登录页
- **输入验证**: 前端表单验证 + 后端API错误处理
- **密码安全**: 密码长度验证、确认密码检查

## 📱 移动端适配

- **响应式设计**: 完美适配各种屏幕尺寸
- **触摸友好**: 按钮和链接有足够的点击区域
- **手势支持**: 支持滑动等移动端手势
- **性能优化**: 图片懒加载、代码分割

## 🎯 未来规划

- [ ] 实时聊天功能（WebSocket）
- [ ] 图片上传和管理
- [ ] 推送通知
- [ ] 地理位置匹配
- [ ] 视频通话功能
- [ ] 社交分享功能
- [ ] 多语言支持
- [ ] PWA支持

---

## 👥 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

此项目采用MIT许可证。
