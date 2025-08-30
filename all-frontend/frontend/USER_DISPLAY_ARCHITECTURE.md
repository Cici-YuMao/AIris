# 用户信息展示架构总结

## 当前实现架构

### 1. 卡片显示（基础信息）
**位置**: 推荐/匹配/热门用户页面
**组件**: `UserPhotosCard.jsx`
**显示内容**:
- ✅ 用户头像/照片（支持多张照片轮播）
- ✅ 基本信息：姓名、年龄、城市
- ✅ 兴趣爱好标签（最多3个）
- ✅ 简要偏好信息：
  - ⭐ 看重条件（最多3个，中文显示）
  - 📍 偏好城市（最多2个）
- ✅ 在线状态显示
- ✅ 照片数量提示
- ✅ 基础统计（点赞数、热度）

**交互功能**:
- ✅ 点击用户信息区域 → 跳转到用户详情页
- ✅ 照片轮播导航
- ✅ 喜欢/下一个操作按钮

### 2. 详情页显示（完整信息）
**位置**: `/user/:userId` 路由
**组件**: `UserDetailPage.jsx`
**显示内容**:
- ✅ 完整照片展示（大图+轮播）
- ✅ 详细个人信息：
  - 姓名、年龄、性别、性取向
  - 身高、城市、教育程度、职业
  - 宠物、家庭状况等
- ✅ 完整偏好信息：
  - 年龄范围、身高范围、体重范围
  - 偏好城市列表
  - 兴趣偏好详细描述
  - 最看重条件（完整列表，中文显示）
  - 雷点列表
- ✅ 最后活跃时间
- ✅ 在线状态

**交互功能**:
- ✅ "Start Conversation" 按钮 → 跳转到聊天页面 `/chat/:userId`
- ✅ "Send Like" 按钮 → 发送喜欢
- ✅ "Continue Browsing" 按钮 → 返回匹配页面
- ✅ Block/Unblock 功能

### 3. 聊天页面
**位置**: `/chat/:userId` 路由
**组件**: `ChatPage.jsx`
**功能**: 完整的聊天界面（已实现，等待后续逻辑完善）

## 使用页面

### 主页 (`src/pages/HomePage.jsx`)
- 使用 `UserPhotosCard` 显示推荐用户
- 点击用户卡片 → 用户详情页

### 匹配页面 (`src/components/Match/MatchPage.jsx`)
- 使用 `UserPhotosCard` 显示匹配用户
- 点击用户卡片 → 用户详情页

### 访客广场 (`src/pages/GuestPlaza.jsx`)
- 使用 `UserPhotosCard` 显示热门用户
- 点击用户卡片 → 用户详情页

## 数据流

### 卡片级别数据
```javascript
// UserPhotosCard 需要的数据结构
{
  id: number,
  userInfo?: {
    name, age, city, hobbies, online, likeCount, popularity
  },
  userPreference?: {
    topPriorities: string[],     // 最看重条件
    preferredCities: string[]    // 偏好城市
  },
  photoUrls: string[],
  // 兼容旧结构
  name?, age?, city?, hobbies?, online?
}
```

### 详情页数据
```javascript
// UserDetailPage 需要的完整数据结构
{
  id, name, age, gender, sexualOrientation,
  height, city, education, occupation,
  hobbies, pets, familyStatus,
  userPreference: {
    ageRange: {min, max},
    heightRange: {min, max}, 
    weightRange: {min, max},
    preferredCities: string[],
    dealBreakers: string[],
    topPriorities: string[],
    hobbies: string
  },
  photos: string[] | photoUrls: string[],
  online, lastActive
}
```

## API 集成

### 获取用户列表
- `matchAPI.getRecommendations()` - 推荐用户
- `matchAPI.getMatches()` - 匹配用户
- `userAPI.getPopularUsers()` - 热门用户

### 获取用户详情
- `matchAPI.getUserDetail(userId)` - 主要方式
- `userAPI.getUserDetail(userId)` - 备用方式

### 用户交互
- `interactionAPI.likeUser(userId)` - 点赞用户
- `interactionAPI.blockUser(userId)` - 屏蔽用户
- 聊天功能 - 通过 `ChatPage` 组件处理

## 样式设计

### 卡片样式 (`UserPhotosCard.css`)
- 现代简洁的卡片设计
- 上半身照片裁剪优化
- 渐变色偏好标签
- 响应式布局

### 详情页样式 (`UserDetailPage.css`)
- 大图展示优化
- 信息分组布局
- 交互按钮设计
- 移动端适配

## 用户体验流程

1. **浏览阶段**: 用户在主页/匹配页面看到简要信息卡片
2. **了解阶段**: 点击卡片进入详情页查看完整信息
3. **互动阶段**: 在详情页可以发起聊天、点赞或继续浏览
4. **沟通阶段**: 通过聊天页面进行深入交流

这个架构确保了：
- ✅ 卡片层面信息简洁，不会信息过载
- ✅ 详情页信息完整，满足深入了解需求
- ✅ 交互流程顺畅，从浏览到聊天无缝衔接
- ✅ 响应式设计，移动端体验良好
- ✅ 数据结构灵活，兼容不同API返回格式
