# Realtime Chat Service

实时聊天服务，基于WebSocket提供实时消息推送功能。

## 功能特性

- **WebSocket连接管理**: 管理客户端WebSocket连接，支持一个用户多设备连接
- **实时消息推送**: 实时推送聊天消息给在线用户
- **用户在线状态管理**: 基于Redis管理用户的在线状态，支持心跳机制
- **分布式消息路由**: 通过RocketMQ实现跨服务器节点的消息路由
- **消息已读状态**: 支持消息已读回执的处理和推送
- **内容审核**: 集成简单的内容审核功能

## 技术栈

- Spring Boot 3.2.2
- WebSocket
- Redis
- RocketMQ
- Dubbo 3.2.10
- Nacos

## 系统架构

### 消息流程

1. **用户A发送消息给用户B**
   - 用户A通过WebSocket连接发送消息
   - RealtimeChatService生成消息ID
   - 调用内容审核服务检查消息内容
   - 通过Dubbo调用MessageService保存消息
   - 查询用户B的在线状态

2. **消息推送**
   - 如果用户B在线且在同一服务器：直接通过WebSocket推送
   - 如果用户B在线但在其他服务器：通过RocketMQ转发消息
   - 如果用户B离线：发送离线推送通知

3. **消息已读**
   - 用户B发送已读回执
   - 调用MessageService更新消息状态
   - 通知用户A消息已被读取

## API接口

### WebSocket连接

**单节点模式:**
```
ws://localhost:9430/ws/chat?userId={userId}
```

**双节点模式:**
```
节点1: ws://localhost:9430/ws/chat?userId={userId}
节点2: ws://localhost:9431/ws/chat?userId={userId}
```

### REST API

#### 健康检查
```
GET /api/chat/health
```

#### 获取用户在线状态
```
GET /api/chat/online/status/{userId}
```

#### 获取在线统计
```
GET /api/chat/online/stats
```

## WebSocket消息格式

### 发送聊天消息
```json
{
  "type": "CHAT_MESSAGE",
  "receiverId": "接收者ID",
  "chatId": "聊天ID",
  "content": "消息内容",
  "timestamp": 1234567890000
}
```

### 发送心跳
```json
{
  "type": "HEARTBEAT",
  "content": "ping"
}
```

### 发送已读回执
```json
{
  "type": "READ_RECEIPT",
  "chatId": "聊天ID",
  "messageId": "消息ID",
  "receiverId": "原消息发送者ID"
}
```

### 输入状态
```json
{
  "type": "TYPING",
  "receiverId": "接收者ID",
  "chatId": "聊天ID",
  "content": "typing" // 或 "stop_typing"
}
```

## 配置说明

### Redis配置
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: redis123
```

### RocketMQ配置
```yaml
rocketmq:
  name-server: localhost:9876
  producer:
    group: realtime-chat-producer-group
```

### Dubbo配置
```yaml
dubbo:
  registry:
    address: nacos://localhost:8848
  protocol:
    port: 20882
```

## 启动说明

### 单节点启动

1. 确保依赖服务已启动：
   - Nacos (8848端口)
   - Redis (6379端口)
   - RocketMQ (9876端口)
   - MessageService

2. 启动服务：
```bash
mvn spring-boot:run
```

### 双节点集群测试

1. 确保依赖服务已启动

2. 启动两个节点：

**方式一：使用启动脚本**
```bash
# 终端1 - 启动节点1
chmod +x start-node1.sh
./start-node1.sh

# 终端2 - 启动节点2  
chmod +x start-node2.sh
./start-node2.sh
```

**方式二：直接使用Maven命令**
```bash
# 终端1 - 启动节点1 (端口9430)
mvn spring-boot:run -Dspring-boot.run.profiles=dev,node1

# 终端2 - 启动节点2 (端口9431)
mvn spring-boot:run -Dspring-boot.run.profiles=dev,node2
```

**方式三：使用Docker Compose**
```bash
# 先启动基础设施
docker-compose up -d

# 启动聊天服务集群
docker-compose -f docker-compose-dual-node.yml up -d
```

## 集群测试说明

### 测试跨节点消息传递

1. 启动两个节点 (9430 和 9431)

2. 打开测试页面:
   - 节点1: http://localhost:9430/test.html
   - 节点2: http://localhost:9431/test.html

3. 测试场景:
   - **场景一**: 用户A连接节点1，用户B连接节点2，测试跨节点消息传递
   - **场景二**: 用户A在节点1发送消息，用户B在节点2接收并发送已读回执
   - **场景三**: 测试一个用户多设备连接不同节点

4. 验证功能:
   - 消息能够跨节点正确传递
   - Redis中正确记录用户在线状态和所在服务器
   - RocketMQ消息队列正常工作
   - 已读回执能够跨节点传递

### 监控和调试

查看在线状态:
```bash
# 节点1在线统计
curl http://localhost:9430/api/chat/online/stats

# 节点2在线统计  
curl http://localhost:9431/api/chat/online/stats

# 查看特定用户状态
curl http://localhost:9430/api/chat/online/status/user1
```

## 跨节点消息传递解决方案

### 问题描述
在多节点部署时，出现跨节点消息传递的问题：
1. **消息路由复杂**: 需要确保消息能够在不同节点间正确传递
2. **用户连接分布**: 用户可能连接到不同的服务器节点
3. **消息传递可靠性**: 确保消息不丢失且能够到达目标用户

### 解决方案: 条件式消息处理

#### 1. 实现机制
使用简单而可靠的条件式消息处理：
- **统一消费者组**: 所有节点使用相同的消费者组 `realtime-chat-consumer-group`
- **广播接收**: 所有节点都能接收到消息
- **条件处理**: 每个节点检查目标用户是否连接到当前节点
- **智能忽略**: 非目标节点忽略消息，只有目标节点处理

#### 2. 消息传递流程
```
1. 用户A(节点1) → 用户B(节点2)
2. 节点1通过RocketMQ广播消息
3. 节点1和节点2都接收到消息
4. 节点1检查用户B不在本节点，忽略消息
5. 节点2检查用户B在本节点，处理并推送消息
6. 用户B成功收到消息
```

#### 3. 关键优势
- ✅ **实现简单**: 不依赖复杂的Tag路由机制
- ✅ **可靠性高**: 确保所有节点都能接收到消息
- ✅ **容错性强**: 即使节点信息不准确也能正常工作
- ✅ **易于调试**: 消息流程清晰，便于排查问题

### 测试跨节点功能

使用提供的测试脚本：
```bash
# 运行跨节点消息传递测试
./test-cross-node-messaging.sh
```

### 验证步骤

1. **启动两个节点**:
```bash
./start-node1.sh
./start-node2.sh
```

2. **检查消费者组**:
```bash
# 查看RocketMQ消费者组状态
sh $ROCKETMQ_HOME/bin/mqadmin consumerProgress -n localhost:9876
```

3. **测试消息传递**:
```bash
# 连接到节点1
wscat -c 'ws://localhost:9531/ws?userId=user1'

# 连接到节点2 (另一个终端)
wscat -c 'ws://localhost:9532/ws?userId=user2'

# 在user1连接中发送消息
{"type":"CHAT_MESSAGE","senderId":"user1","receiverId":"user2","chatId":"chat123","content":"Hello from node1!","timestamp":1640995200000}
```

4. **验证消息处理**:
观察日志确认消息传递流程：
- 节点1日志应显示: "Message sent to other server via RocketMQ"
- 两个节点都应显示: "Received chat message from RocketMQ"
- 节点1应显示: "User user2 not connected to this node, ignoring message"
- 节点2应显示: "Successfully delivered message to user: user2"

5. **监控Redis状态**:
```bash
# 查看用户在线状态
redis-cli SMEMBERS chat:online:users

# 查看用户所在节点
redis-cli GET chat:user:server:user1
redis-cli GET chat:user:server:user2
```

### 故障排查

#### 常见问题及解决方案

1. **消息无法跨节点传递**
   - 检查消费者组是否统一: `realtime-chat-consumer-group`
   - 确认RocketMQ服务是否正常运行
   - 验证消息发送和接收的日志

2. **用户无法收到消息**
   - 确认目标用户是否正确连接到节点
   - 检查WebSocket连接状态
   - 验证用户ID是否正确

3. **消息重复处理**
   - 确认只有目标节点处理消息
   - 检查节点的用户连接检测逻辑
   - 验证消息忽略逻辑是否正确

#### 调试命令

```bash
# 查看节点日志，关注消息处理流程
tail -f logs/realtime-chat-service-node1.log | grep -E "Message sent|Received chat message|ignoring message"
tail -f logs/realtime-chat-service-node2.log | grep -E "Received chat message|Successfully delivered"

# 检查消费者组状态
sh $ROCKETMQ_HOME/bin/mqadmin consumerProgress -n localhost:9876 -g realtime-chat-consumer-group

# 检查用户连接状态
curl http://localhost:9531/api/chat/online/stats
curl http://localhost:9532/api/chat/online/stats

# 检查Topic状态
sh $ROCKETMQ_HOME/bin/mqadmin topicStatus -t TOPIC_CHAT_MESSAGE -n localhost:9876
```

## 注意事项

1. WebSocket连接时必须提供userId参数
2. 心跳间隔建议设置为30秒
3. 用户在线状态有5分钟的过期时间
4. 支持一个用户多设备同时在线
5. **使用条件式消息处理实现跨节点消息传递**
6. **所有节点使用相同的消费者组，都能接收到消息**
7. **每个节点检查目标用户连接状态，只处理相关消息**
8. **非目标节点会忽略消息，避免重复处理**
9. 确保Redis和RocketMQ服务正常运行 