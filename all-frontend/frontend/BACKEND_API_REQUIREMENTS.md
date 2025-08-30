# 后端接口要## 数据处理流程
1. **后端**: 返回热门用户的详细信息（包含 userInfo、userPreference、photoUrls）
2. **前端**: 
   - 解析后端复杂数据结构，提取关键信息
   - 使用全部用户数据统计城市分布（生成完整的地图）
   - 只展示前12个用户，并进行匿名化处理
   - 保护用户隐私，避免暴露真实身份信息

## 前端数据转换
前端会将后端返回的复杂结构转换为简化格式：
- `userInfo.id` → `id`
- `userInfo.name` → `nickname`
- `userInfo.age` → `age`
- `userInfo.city` → `city`
- `userInfo.hobbies` (逗号分隔字符串) → `hobbies` (数组)
- `userInfo.popularity` → `popularity`
- `photoUrls[0]` → `avatar_url`广场功能

## 概述
前端游客广场需要调用后端的热门用户接口来展示用户分布地图和精选用户信息。

**重要更新**: 后端返回完整用户数据（按popularity排序），前端负责数据匿名化和展示控制。

## 数据处理流程
1. **后端**: 返回所有用户的完整数据（按热度/popularity从高到低排序）
2. **前端**: 
   - 使用全部用户数据统计城市分布（生成完整的地图）
   - 只展示前12个用户，并进行匿名化处理
   - 保护用户隐私，避免暴露真实身份信息

## 需要实现的接口

### 1. 热门用户接口

**接口路径**: `GET /api/v1/match/hot-users`

**说明**: 返回热度最高的前N个用户详细信息（按热度排序）

**请求参数**:
- `count` (可选): 返回用户数量，默认值为10，前端建议传递较大值（如1000）获取完整用户列表

**请求示例**:
```
GET /api/v1/match/hot-users?count=1000
```

**响应数据格式**:
```json
[
  {
    "id": "string",           // 用户真实ID
    "nickname": "string",     // 用户真实昵称
    "age": 25,               // 年龄
    "city": "string",        // 城市名称
    "hobbies": ["string"],   // 完整兴趣爱好数组
    "online": boolean,       // 是否在线
    "popularity": 95.2,      // 热度评分（用于排序）
    "avatar_url": "string"   // 头像URL（可选）
  }
]
```

**数据示例**:
```json
[
  {
    "userInfo": {
      "id": 1,
      "username": "johnsmith",
      "email": "johnsmith@501999.xyz",
      "name": "John Smith",
      "age": 28,
      "city": "New York",
      "occupation": "Software Engineer",
      "hobbies": "reading,coding,swimming",
      "popularity": 4
    },
    "userPreference": {
      "ageRange": {"min": 22, "max": 28},
      "preferredCities": ["New York", "Brooklyn"],
      "hobbies": "reading, swimming, hiking"
    },
    "photoUrls": []
  },
  {
    "userInfo": {
      "id": 2,
      "username": "emilywilliams", 
      "email": "emilywilliams@501999.xyz",
      "name": "Emily Williams",
      "age": 25,
      "city": "Los Angeles",
      "occupation": "Product Manager",
      "hobbies": "traveling,painting,yoga",
      "popularity": 4
    },
    "userPreference": {
      "ageRange": {"min": 25, "max": 32},
      "preferredCities": ["Los Angeles", "Santa Monica"],
      "hobbies": "traveling, music, photography"
    },
    "photoUrls": []
  }
  // ... 更多用户数据（按popularity降序排列）
]
```

## 数据要求

### 1. 匿名化处理
- **用户ID**: 使用专门的匿名ID，不暴露真实用户ID
- **昵称**: 可以使用用户设置的昵称，或生成匿名昵称
- **头像**: 优先使用emoji头像，或者匿名化的头像图片

### 2. 数据筛选
- 返回活跃度高的用户
- 地域分布尽量广泛，展示平台覆盖范围
- 建议返回10-20个用户，包含不同城市

### 3. 隐私保护
- 不返回敏感个人信息
- 城市信息可以显示（已公开信息）
- 兴趣爱好使用用户公开设置的标签

### 4. 实时性
- 在线状态应该反映真实情况
- 定期更新热门用户列表（避免长期展示相同用户）

## 接口特性

### 1. 无需认证
- 游客模式下可直接访问
- 不需要传递任何认证token

### 2. 缓存策略
- 建议后端实现适当缓存（如5-10分钟）
- 减轻数据库压力，提高响应速度

### 3. 错误处理
- 接口异常时前端会使用模拟数据
- 建议返回适当的HTTP状态码

## 前端使用方式

前端会调用此接口用于：
1. **用户分布地图**: 根据返回用户的city字段统计各城市用户数量
2. **精选用户展示**: 显示用户卡片，包含头像、昵称、年龄、城市、兴趣爱好、在线状态

## 测试验证

### 1. 数据完整性
请确保返回的每个用户对象都包含所有必需字段

### 2. 地域多样性  
建议返回的用户来自不同城市，增强地图展示效果

### 3. 响应时间
接口响应时间建议控制在500ms以内

## 注意事项

1. **数据安全**: 严格保护用户隐私，只返回公开或匿名化信息
2. **性能考虑**: 合理使用缓存和分页机制
3. **更新策略**: 定期更新热门用户列表，保持内容新鲜度
4. **兼容性**: 确保API返回格式与前端期望一致

## 联系方式

如有问题或需要调整接口格式，请联系前端开发团队。
