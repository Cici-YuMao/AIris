# AIRIS Project Setup Guide

This guide provides comprehensive instructions for setting up the AIRIS platform, including backend services (Java-based), frontend applications (React-based), and Python algorithm services. The project is a microservices-based system with user management, matching, media handling, notifications, and real-time chat functionalities.

## Project Overview

AIRIS is a platform that facilitates user interactions through profile management, content moderation, recommendation algorithms, real-time chat, and notifications. It uses a combination of Java Spring Boot for backend services, React for frontend applications, and Python for AI-driven algorithms.

## Prerequisites

### General
- **Docker**: For containerized infrastructure services
- **Node.js (v20+)** and **npm**: For frontend applications
- **Python 3.8+**: For algorithm services
- **Java 17+**: For backend services
- **Maven 3.8+**: For building Java services

### Python Dependencies
- flask
- numpy
- scikit-learn
- sentence-transformers
- openai
- requests
- pillow

*Note*: Ensure the `all-MiniLM-L6-v2` sentence-transformer model is downloaded and placed in the root directory or adjust its path accordingly.

### Environment Variables
Set the following environment variables before running services:

```bash
# DeepSeek API key for algorithm services
export DEEPSEEK_API_KEY="your-deepseek-api-key"

# Baidu API keys for image moderation
export BAIDU_API_KEY="your-baidu-api-key"
export BAIDU_SECRET_KEY="your-baidu-secret-key"

# Database and infrastructure (for production)
export DB_HOST=your-db-host
export DB_USERNAME=your-db-username
export DB_PASSWORD=your-db-password
export REDIS_HOST=your-redis-host
export REDIS_PORT=6379
export NACOS_SERVER_ADDR=your-nacos-host:8848
export NACOS_USERNAME=nacos
export NACOS_PASSWORD=nacos
```

## Infrastructure Setup (Docker)

### 1. Create Docker Network
```bash
docker network create airis-network
docker network create rocketmq
```

### 2. Start Infrastructure Services

#### MySQL
```bash
docker run -d \
  --name mysql \
  --network airis-network \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=airis_user,airis_message \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0
```

#### MongoDB
```bash
docker run -d \
  --name mongodb \
  --network airis-network \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:6.0
```

#### Redis
```bash
docker run -d \
  --name redis \
  --network airis-network \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7.0 redis-server
```

#### Nacos
```bash
docker run --name nacos-standalone \
  -e MODE=standalone \
  -e NACOS_AUTH_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA== \
  -e NACOS_AUTH_IDENTITY_KEY=123456 \
  -e NACOS_AUTH_IDENTITY_VALUE=123456 \
  -p 8078:8080 \
  -p 8848:8848 \
  -p 9848:9848 \
  -d nacos/nacos-server:latest
```

#### RabbitMQ
```bash
docker run -d \
  --name rabbitmq \
  --network airis-network \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management
```

#### RocketMQ
```bash
# Configure RocketMQ network and nameserver
docker run -d --name rmqnamesrv -p 9876:9876 --network rocketmq apache/rocketmq:5.3.2 sh mqnamesrv

# Configure the broker's IP address
echo "brokerIP1=127.0.0.1" > broker.conf

# Start the Broker and Proxy
docker run -d \
  --name rmqbroker \
  --network rocketmq \
  -p 10912:10912 -p 10911:10911 -p 10909:10909 \
  -p 8080:8080 -p 8081:8081 \
  -e "NAMESRV_ADDR=rmqnamesrv:9876" \
  -v ./broker.conf:/home/rocketmq/rocketmq-5.3.2/conf/broker.conf \
  apache/rocketmq:5.3.2 sh mqbroker --enable-proxy \
  -c /home/rocketmq/rocketmq-5.3.2/conf/broker.conf

# Verify Broker
docker exec -it rmqbroker bash -c "tail -n 10 /home/rocketmq/logs/rocketmqlogs/proxy.log"
```

### 3. Database Setup
```bash
# Connect to MySQL and create databases
mysql -h localhost -u root -p
CREATE DATABASE airis_user;
CREATE DATABASE airis_message;
USE airis_message;

# Initialize message-service schema
cd message-service
mysql -h localhost -u root -p airis_message < src/main/resources/sql/schema.sql
```

## Backend Services (Java)

### Applications Structure
- **gateway-service**: API Gateway with routing, authentication, and load balancing
- **user-service**: Manages user authentication, profiles, and operations
- **match-service**: Handles user recommendations and interactions
- **message-service**: Manages message persistence and REST API
- **realtime-chat-service**: Provides real-time WebSocket-based chat with cross-node messaging
- **media-service**: Handles media file upload, storage, AI moderation, and querying
- **notification-service**: Manages real-time WebSocket notifications and offline email delivery

### Configuration (Nacos)
Add the following configurations to the Nacos Configuration Center (`http://localhost:8848/nacos`, username: nacos, password: nacos):

#### Gateway Service (`gateway-service.yml`)
```yaml
server:
  port: 8088

spring:
  application:
    name: gateway-service
  main:
    allow-circular-references: true
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: public
        username: nacos
        password: nacos
    gateway:
      discovery:
        locator:
          enabled: false
          lower-case-service-id: true
      routes:
        # User service routes
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/v1/users/**
          filters:
            - name: AuthFilter
        # Match service routes
        - id: match-service
          uri: lb://match-service
          predicates:
            - Path=/api/v1/interact/**
          filters:
            - name: AuthFilter
        # Match service proxy routes
        - id: match-proxy
          uri: lb://user-service
          predicates:
            - Path=/api/v1/match/**
          filters:
            - name: AuthFilter
        # Authentication routes (no auth required)
        - id: auth-routes
          uri: lb://user-service
          predicates:
            - Path=/api/v1/auth/**
        # Hot users endpoint (no auth required)
        - id: match-hot-users
          uri: lb://match-service
          predicates:
            - Path=/api/v1/match/hot-users
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOriginPatterns:
              - "http://localhost:5173"
              - "http://localhost:3000"
              - "http://your-frontend-url"
            allowedMethods: "GET,POST,PUT,DELETE,OPTIONS"
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
        add-to-simple-url-handler-mapping: true

jwt:
  secret: Y2xvZGVkX2tleV9mb3Jfand0X3NpZ25pbmdfcmVhbF9zYWZldHk=
  expiration: 86400000

logging:
  level:
    root: INFO
    com.airis.gateway: DEBUG
    org.springframework.cloud.gateway: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

management:
  endpoints:
    web:
      exposure:
        include: health,info,gateway
  endpoint:
    health:
      show-details: always
```

#### User Service (`user-service.yml`)
```yaml
server:
  port: 8081

spring:
  application:
    name: user-service
  datasource:
    url: jdbc:mysql://localhost:3306/airis_user?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  data:
    mongodb:
      uri: mongodb://localhost:27017/airis_user
  redis:
    host: localhost
    port: 6379
    database: 0
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 10000
          timeout: 10000
          writetimeout: 10000
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        username: nacos
        password: nacos
        ip: localhost
        port: 8081

jwt:
  secret: Y2xvZGVkX2tleV9mb3Jfand0X3NpZ25pbmdfcmVhbF9zYWZldHk=
  access-token-expiration: 900
  refresh-token-expiration: 604800

project:
  activation-url-prefix: http://localhost:8081
  reset-password-url-prefix: http://localhost:8081

algo:
  recommend:
    url: http://localhost:9030/recommend
  match:
    url: http://localhost:9020/highly-matched

match:
  service:
    url: http://localhost:8082

logging:
  level:
    root: INFO
    org.springframework.web: INFO
    com.airis.user: DEBUG
```

#### Match Service (`match-service.yml`)
```yaml
server:
  port: 8082

spring:
  application:
    name: match-service
  datasource:
    url: jdbc:mysql://localhost:3306/airis_user?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  data:
    mongodb:
      uri: mongodb://localhost:27017/airis_user
  redis:
    host: localhost
    port: 6379
    database: 0
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        username: nacos
        password: nacos
        ip: localhost
        port: 8082

jwt:
  secret: Y2xvZGVkX2tleV9mb3Jfand0X3NpZ25pbmdfcmVhbF9zYWZldHk=
  access-token-expiration: 900
  refresh-token-expiration: 604800

algo:
  recommend:
    url: http://localhost:9030/recommend
  match:
    url: http://localhost:9020/highly-matched

user:
  service:
    url: http://localhost:8081

media:
  service:
    url: http://localhost:8081

logging:
  level:
    root: INFO
    org.springframework.web: INFO
    com.airis.match: DEBUG
```

#### Message Service (`message-service.yml`)
```yaml
server:
  port: 9330

spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/airis_message?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8
    username: root
    password: root
    druid:
      initial-size: 10
      max-active: 100
      min-idle: 10
      max-wait: 60000
      pool-prepared-statements: true
      max-pool-prepared-statement-per-connection-size: 20
      time-between-eviction-runs-millis: 60000
      min-evictable-idle-time-millis: 300000
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/*
      filter:
        stat:
          log-slow-sql: true
          slow-sql-millis: 1000
          merge-sql: false
        wall:
          config:
            multi-statement-allow: true
  data:
    mongodb:
      host: localhost
      port: 27017
      database: airis_chat
mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.airis.message.entity
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: false
    call-setters-on-nulls: true
    jdbc-type-for-null: 'null'
pagehelper:
  helper-dialect: mysql
  reasonable: true
  support-methods-arguments: true
  params: count=countSql
dubbo:
  application:
    name: message-service-dubbo
  registry:
    address: nacos://localhost:8848
    parameters:
      use-as-config-center: false
      use-as-metadata-center: false
  protocol:
    name: dubbo
    port: 20881
  provider:
    timeout: 5000
  consumer:
    timeout: 5000
    check: false
rocketmq:
  name-server: localhost:9876
  producer:
    group: message-service-producer
    send-message-timeout: 3000
    compress-message-body-threshold: 4096
    max-message-size: 4194304
    retry-times-when-send-failed: 2
    retry-times-when-send-async-failed: 2
    retry-next-server: true
logging:
  level:
    root: info
    org.springframework.cloud: debug
    org.springframework.cloud.gateway: debug
  pattern:
    console: '%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n'
knife4j:
  enable: true
  openapi:
    title: AIRIS Message Service API
    description: AIRIS Message Service API Documentation
    version: 1.0.0
    concat: airis-team@example.com
```

#### Realtime Chat Service (`realtime-chat-service.yml`)
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
      timeout: 6000
      lettuce:
        pool:
          max-active: 10
          max-idle: 8
          min-idle: 2
          max-wait: -1
rocketmq:
  name-server: localhost:9876
  producer:
    group: realtime-chat-producer-group
    send-message-timeout: 3000
    retry-times-when-send-failed: 2
dubbo:
  application:
    name: realtime-chat-service
    parameters:
      serialize.security.mode: ${DUBBO_SERIALIZE_MODE:LOOSE}
  registry:
    address: nacos://localhost:8848
    parameters:
      namespace: public
  protocol:
    name: dubbo
    serialization: fastjson2
  consumer:
    timeout: 5000
    check: false
    retries: 2
    parameters:
      serialize.security.mode: LOOSE
  provider:
    timeout: 5000
    retries: 2
    version: 1.0.0
    parameters:
      serialize.security.mode: LOOSE
logging:
  level:
    root: INFO
    com.airis.chat: INFO
    org.apache.rocketmq: debug
    org.apache.dubbo: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

#### Realtime Chat Service (Multi-Node, e.g., `realtime-chat-service-node1.yml`)
```yaml
server:
  port: 9531
dubbo:
  protocol:
    port: 29531
airis:
  chat:
    server-id: chat-node-1
logging:
  file:
    name: logs/realtime-chat-service-node1.log
```

#### Media Service (`application.properties`)
```properties
server.port=8081
spring.data.mongodb.uri=mongodb://localhost:27017/airis_user
r2.access-key=6451193d09193934785354bee612a7ef
r2.secret-key=08c66a95dc49bfdc4594fae31e50167afde2b01468c165ea9966902d7e0c0f50
r2.endpoint=https://7d1a61920981eb344b614d688c31bc4e.r2.cloudflarestorage.com
r2.bucket=media-assets
spring.cloud.nacos.discovery.server-addr=localhost:8848
spring.cloud.nacos.discovery.username=nacos
spring.cloud.nacos.discovery.password=nacos
```

#### Notification Service (`application.properties`)
```properties
server.port=8082
spring.data.mongodb.uri=mongodb://localhost:27017/airis_user
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.cloud.nacos.discovery.server-addr=localhost:8848
spring.cloud.nacos.discovery.username=nacos
spring.cloud.nacos.discovery.password=nacos
```

### Build and Run
1. **Build Services**
```bash
# Build all services
mvn clean package -DskipTests

# Or build individually
cd user-service
mvn clean package -DskipTests
cd ../match-service
mvn clean package -DskipTests
cd ../gateway-service
mvn clean package -DskipTests
cd ../message-service
mvn clean package -DskipTests
cd ../realtime-chat-service
mvn clean package -DskipTests
```

2. **Start Services**
```bash
# User Service
cd user-service
java -jar target/user-service-0.0.1-SNAPSHOT.jar

# Match Service
cd match-service
java -jar target/match-service-0.0.1-SNAPSHOT.jar

# Gateway Service
cd gateway-service
java -jar target/gateway-service-0.0.1-SNAPSHOT.jar

# Message Service
cd message-service
java -jar target/message-service-1.0.0.jar

# Realtime Chat Service (Single Node)
cd realtime-chat-service
java -jar target/realtime-chat-service-1.0.0.jar

# Realtime Chat Service (Multi-Node, e.g., Node 1)
java -jar target/realtime-chat-service-1.0.0.jar --spring.profiles.active=node1
```

3. **Alternative: Run with Maven**
```bash
cd user-service
mvn spring-boot:run
cd ../match-service
mvn spring-boot:run
cd ../gateway-service
mvn spring-boot:run
cd ../message-service
mvn spring-boot:run
cd ../realtime-chat-service
mvn spring-boot:run
```

### Service Verification
1. **Nacos Registration**
   - Visit: `http://localhost:8848/nacos` (username: nacos, password: nacos)
   - Verify all services are registered and healthy

2. **Gateway Health**
   ```bash
   curl http://localhost:8088/actuator/health
   ```

3. **Test API Endpoints**
   - User Registration:
     ```bash
     curl -X POST http://localhost:8088/api/v1/auth/register \
       -H "Content-Type: application/json" \
       -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
     ```
   - User Login:
     ```bash
     curl -X POST http://localhost:8088/api/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username": "testuser", "password": "password123"}'
     ```
   - Get Hot Users:
     ```bash
     curl http://localhost:8088/api/v1/match/hot-users
     ```

### API Documentation
- User Service: `http://localhost:8081/swagger-ui.html`
- Match Service: `http://localhost:8082/swagger-ui.html`
- Gateway: `http://localhost:8088/swagger-ui.html`
- Message Service: ``http://localhost:9330/swagger-ui.html``

### Access URLs
- **API Gateway**: `http://localhost:8088`
- **User Service**: `http://localhost:8081`
- **Match Service**: `http://localhost:8082`
- **Message Service**: `http://localhost:9330`
- **Realtime Chat Service**: `http://localhost:9531`
- **Nacos Console**: `http://localhost:8848/nacos`
- **RabbitMQ Management**: `http://localhost:15672`

## Frontend Applications (React)

### Applications Structure
- **frontend**: Main AIRIS application (Vite + React)
- **chat-react**: Standalone chat component (React)

### Configuration
1. **Main Frontend (`frontend/src/config/api.js`)**
```javascript
const API_BASE_URL = 'http://localhost:8088';
```

2. **Chat Component (`chat-react/src/services/chat/api.js`)**
```javascript
this.messageServiceUrl = 'http://localhost:8088';
```

3. **Chat WebSocket (`chat-react/src/services/chat/websocket.js`)**
```javascript
let url = `ws://localhost:8088/ws/chat?userId=${userId}`;
```

4. **Chat Iframe (`frontend/src/components/Chat/ChatPage.jsx`)**
```javascript
const CHAT_IFRAME_URL = 'http://localhost:3000';
```

### Quick Start
1. **Main Frontend**
```bash
cd frontend
npm install
npm run dev
```
*URL*: `http://localhost:5173`

2. **Chat Component**
```bash
cd chat-react
npm install
npm start
```
*URL*: `http://localhost:3000`

### Production Build
```bash
# Main Frontend
cd frontend
npm run build

# Chat Component
cd chat-react
npm run build
```

## Algorithm Services (Python)

### Applications Structure
- **save_info.py**: Processes user data, generates embeddings, and stores them in a local database
- **recommend.py**: Provides preference-based user recommendations
- **match.py**: Combines preference matching and collaborative filtering for user matchmaking
- **check_img.py**: Moderates image content using Baidu Cloud API

### Project Structure
```
.
├── save_info.py          # User data ingestion, parsing, vectorization
├── recommend.py          # Preference-based recommendation service
├── match.py              # Matchmaking based on preferences + behaviors
├── check_img.py          # Image content moderation service
├── all-MiniLM-L6-v2/     # SentenceTransformer model directory
```

### Run
```bash
# User Data Upload
python save_info.py       # http://localhost:9010

# Recommendation Service
python recommend.py       # http://localhost:9030

# Matchmaking Service
python match.py           # http://localhost:9020

# Image Moderation
python check_img.py       # http://localhost:8080
```

### API Endpoints
1. **Batch Upload (`/algorithm/batch-upload`, POST, `save_info.py`)**
   - Payload:
     ```json
     [
       {
         "operation": "add",
         "id": 1,
         "gender": "M",
         "age": 25,
         "city": "Shanghai",
         "height": 175,
         "weight": 70,
         "education": "Bachelor",
         "occupation": "Engineer",
         "hobbies": ["hiking", "reading"],
         "preference": {
           "heightRange": {"min": 160, "max": 175},
           "weightRange": {"min": 50, "max": 70},
           "ageRange": {"min": 22, "max": 28},
           "preferredCities": ["Shanghai"],
           "hobbies": "I like people who are interested in traveling and reading.",
           "dealBreakers": "I don't really like people who love games.",
           "topPriorities": ["hobby", "city"],
           "sexualOrientation": "HETEROSEXUAL"
         },
         "likedUsers": [2, 3],
         "commentedUsers": {"2": 1},
         "messageCounts": {"3": 5}
       }
     ]
     ```

2. **Recommend Users (`/recommend`, POST, `recommend.py`)**
   - Payload:
     ```json
     {
       "userId": 1,
       "count": 10
     }
     ```
   - Response:
     ```json
     {
       "userIds": [3, 4, 5]
     }
     ```

3. **Highly Matched Users (`/highly-matched`, POST, `match.py`)**
   - Payload:
     ```json
     {
       "userId": 1,
       "count": 10
     }
     ```
   - Response:
     ```json
     {
       "status": "success",
       "userIds": [4, 6, 8]
     }
     ```

4. **Image Review (`/api/review`, POST, `check_img.py`)**
   - Payload:
     ```json
     {
       "media_id": "image123",
       "image_url": "https://example.com/image.jpg"
     }
     ```
   - Response:
     ```json
     {
       "media_id": "image123",
       "result": "APPROVED"
     }
     ```
     or
     ```json
     {
       "media_id": "image123",
       "result": "ERROR",
       "error": "Error message"
     }
     ```

## Module Details

### Media Service
- **Purpose**: Manages media file upload, storage, AI moderation, and querying
- **Storage**: MongoDB for metadata, Cloudflare R2 for object storage
- **Dependencies**: Integrates with `check_img.py` for AI moderation
- **Code Structure**:
  ```
  com.snl.media
  ├── controller
  │   ├── ClientController        # Media upload, delete, query APIs
  │   └── ModuleController        # Module management APIs
  ├── dao
  │   ├── FileAssetRepository     # File_asset table repository
  │   └── MediaAssetRepository    # Media_assets table repository
  ├── entity
  │   ├── FileAsset               # File metadata
  │   └── MediaAsset              # Photo metadata
  ├── service
  │   ├── UploadService           # File upload handling
  │   ├── DeleteService           # File and metadata deletion
  │   ├── QueryService            # Media querying
  │   ├── AIModerationService     # Image moderation via external AI
  │   └── UploadChatFile          # Chat file uploads
  ├── R2Config.java               # Cloudflare R2 configuration
  ├── WebCorsConfig.java          # CORS configuration
  └── MediaApplication.java       # Entry point
  ```

### Notification Service
- **Purpose**: Manages real-time WebSocket notifications and offline email delivery
- **Dependencies**: MongoDB for storage, RabbitMQ for messaging, Gmail SMTP for emails, WebSocket (STOMP) for real-time delivery
- **Code Structure**:
  ```
  com.snl.notification
  ├── config
  │   ├── RabbitMQConfig            # RabbitMQ queue/exchange setup
  │   └── WebSocketConfig           # WebSocket configuration
  ├── controller
  │   ├── NotificationConsumer      # RabbitMQ message listener
  │   └── NotificationController    # REST API for frontend
  ├── entity
  │   ├── Notification              # MongoDB notification entity
  │   └── NotificationMessage       # DTO for RabbitMQ messaging
  ├── repository
  │   └── NotificationRepository    # MongoDB repository
  ├── service
  │   ├── NotificationService       # Notification logic
  │   └── EmailService              # Email sending via Gmail SMTP
  ├── util
  │   ├── NotificationConverter     # Message type conversion
  │   ├── OnlineUserManager         # Manages online user sessions
  │   └── WebSocketEventListener    # Tracks connect/disconnect events
  ├── test
  │   └── NotificationTestSender    # Manual testing utility
  └── NotificationApplication.java  # Entry point
  ```

## Production Deployment

### Backend
1. **Environment Variables**
   ```bash
   export DB_HOST=your-db-host
   export DB_USERNAME=your-db-username
   export DB_PASSWORD=your-db-password
   export REDIS_HOST=your-redis-host
   export REDIS_PORT=6379
   export NACOS_SERVER_ADDR=your-nacos-host:8848
   export NACOS_USERNAME=nacos
   export NACOS_PASSWORD=nacos
   ```

2. **Load Balancing**
   ```bash
   # Multiple user-service instances
   java -jar user-service.jar --server.port=8081
   java -jar user-service.jar --server.port=8091
   
   # Multiple match-service instances
   java -jar match-service.jar --server.port=8082
   java -jar match-service.jar --server.port=8092
   
   # Multiple chat nodes
   cd realtime-chat-service
   java -jar target/realtime-chat-service-1.0.0.jar --spring.profiles.active=node1
   java -jar target/realtime-chat-service-1.0.0.jar --spring.profiles.active=node2
   ```

3. **JVM Tuning**
   ```bash
   java -Xms512m -Xmx1024m -jar your-service.jar
   ```

4. **Database Connection Pool**
   Add to `application.yml` for each service:
   ```yaml
   spring:
     datasource:
       hikari:
         maximum-pool-size: 20
         minimum-idle: 5
         connection-timeout: 30000
   ```

### Frontend
```bash
cd frontend
npm run build
cd ../chat-react
npm run build
```

## Troubleshooting

### Backend Issues
1. **Service Registration Failure**
   - Verify Nacos server address and credentials
   - Check network connectivity to Nacos
2. **Database Connection Issues**
   - Confirm database credentials and connection string
   - Ensure database server is running
3. **Gateway Routing Problems**
   - Check Nacos service registration
   - Validate `gateway-service.yml` routes
4. **Authentication Errors**
   - Ensure consistent JWT secrets across services
   - Verify token expiration settings

### Logs
```bash
# Java services
tail -f logs/spring.log

# Python services
# Logs output to console (check_img.py includes detailed logging)

# Docker containers
docker logs <container-name>
```

### Health Checks
```bash
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Match Service
curl http://localhost:8088/actuator/health  # Gateway Service
curl http://localhost:9330/actuator/health  # Message Service
curl http://localhost:9531/actuator/health  # Realtime Chat Service
```

## Notes
- Ensure all services are registered in Nacos before testing APIs
- Update frontend URLs in production to point to the deployed gateway
- For Python services, verify Baidu API credentials for `check_img.py`
- Use production-grade credentials for MongoDB, MySQL, Redis, and RabbitMQ in production