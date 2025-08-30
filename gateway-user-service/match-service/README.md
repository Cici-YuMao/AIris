# 匹配服务 (Match Service)

匹配服务是从用户服务中拆分出来的独立微服务，专门负责用户匹配相关功能，运行在8082端口。

## 启动方式

### 1. 确保依赖服务运行
- MySQL
- MongoDB
- Redis
- 用户服务 (8081端口)

### 2. 启动匹配服务
```bash
cd match-service
mvn spring-boot:run
```

### 3. 验证服务
```bash
# 测试热门用户接口
curl http://localhost:8082/api/v1/match/hot-users

# 测试用户详情接口
curl http://localhost:8082/api/v1/match/user/1
```

## API接口

### 公开接口
- GET /api/v1/match/hot-users?count=10 - 获取热门用户
- GET /api/v1/match/user/{userId} - 获取用户详情

### 认证接口
- GET /api/v1/match/recommend - 获取推荐用户
- GET /api/v1/match/highly-matched - 获取高匹配用户

### 内部接口
- POST /api/v1/match/internal/clear-cache/{userId} - 清空用户匹配缓存

