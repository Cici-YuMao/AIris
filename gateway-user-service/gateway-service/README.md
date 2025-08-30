# API Gateway Service

## 概述

这是Airis微服务架构的统一API网关，基于Spring Cloud Gateway实现，提供统一的入口点来管理所有微服务的访问。

## 主要功能

### 1. 路由转发
- **用户服务路由**: `/api/users/**` → `user-service`
- **匹配服务路由**: `/api/matches/**` → `match-service`
- **认证路由**: `/api/auth/**` → `user-service` (无需认证)

### 2. 安全认证
- JWT Token验证
- 自动提取用户信息并传递给下游服务
- 统一的认证失败处理

### 3. 限流保护
- 基于Redis的分布式限流
- 不同服务配置不同的限流策略
- 防止服务过载

### 4. 跨域支持
- 全局CORS配置
- 支持所有常用HTTP方法
- 适配前端应用需求

### 5. 监控日志
- 详细的请求/响应日志
- 性能监控（响应时间）
- 健康检查端点

## 技术栈

- **Spring Boot 2.6.13**
- **Spring Cloud Gateway**
- **Spring Cloud Alibaba Nacos** (服务发现)
- **Redis** (限流存储)
- **JWT** (身份认证)

## 配置说明

### 端口配置
- 网关服务端口: `8080`
- 所有外部请求通过此端口访问

### Nacos配置
```yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
```

### Redis配置
```yaml
spring:
  redis:
    host: localhost
    port: 6379
```

### JWT配置
```yaml
jwt:
  secret: airis-gateway-secret-key-2023
  expiration: 86400000
```

## 启动步骤

### 1. 环境准备
确保以下服务已启动：
- **Nacos Server** (端口8848)
- **Redis Server** (端口6379)

### 2. 启动网关
```bash
cd gateway-service
mvn spring-boot:run
```

### 3. 验证启动
访问健康检查端点：
```bash
curl http://localhost:8080/actuator/health
```

## API使用示例

### 1. 用户注册/登录 (无需认证)
```bash
# 用户注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

### 2. 访问用户服务 (需要认证)
```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 访问匹配服务 (需要认证)
```bash
curl -X GET http://localhost:8080/api/matches/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 错误处理

网关会统一处理以下错误：
- **401 Unauthorized**: JWT Token无效或缺失
- **404 Not Found**: 服务不存在或路由未找到
- **429 Too Many Requests**: 触发限流
- **500 Internal Server Error**: 内部服务错误

## 监控端点

- **健康检查**: `GET /actuator/health`
- **网关信息**: `GET /actuator/gateway/routes`
- **应用信息**: `GET /actuator/info`

## 开发注意事项

1. **JWT Secret**: 生产环境请使用更复杂的密钥
2. **限流配置**: 根据实际业务需求调整限流参数
3. **日志级别**: 生产环境建议调整为INFO级别
4. **CORS配置**: 生产环境请限制允许的域名

## 扩展功能

可以根据需要添加以下功能：
- 熔断器 (Hystrix/Resilience4j)
- 链路追踪 (Sleuth/Zipkin)
- 接口文档聚合 (Swagger)
- 黑白名单过滤
- 接口版本管理

