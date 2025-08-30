# React Chat Application

A modern, full-featured chat application built with React that connects to the AIRIS backend services.

测试 http://10.144.1.1:3000

# 必须配置
在localstorage中包含下列信息，打开 http://localhost:3000/chat 即可进入聊天。
```
chatConfig: {"userId":"1119"}
accessToken: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTE5IiwidXNlcm5hbWUiOiIxMTE5IiwiaWF0IjoxNzUxOTc1Mzc5LCJleHAiOjE4NTE5NzYyNzl9.mBWGMxfODtQiEiCcRgILg9OGTxMZDHbiDrSeItFNFAA
```
userId和access_token以实际为准。
如果token无效或未登陆，会跳转到 http://localhost:3000/ 。现在这个是配置页面，合并之后可以去除。

## 从匹配结果开启一个聊天
Open `http://localhost:3000/chat?start={userId}`
userId是聊天对象的id

## 启动
```bash
npm start
```

## Features

- **Real-time messaging** via WebSocket connection
- **Message status tracking** (Pending, Delivered, Read, Failed)  
- **Automatic heartbeat management** with reconnection
- **Chat list with unread counts** and search functionality
- **Message pagination** - loads messages on scroll
- **Read receipts** - automatically marks messages as read
- **Responsive design** - works on desktop and mobile
- **Development configuration page** for easy setup


### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```
The application will open at `http://localhost:3000`

## Development

### Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App