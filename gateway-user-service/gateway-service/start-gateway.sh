#!/bin/bash

echo "=== Starting Airis API Gateway Service ==="

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed or not in PATH"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven is not installed or not in PATH"
    exit 1
fi

# 检查Nacos是否运行
echo "Checking Nacos server..."
if ! curl -s http://localhost:8848/nacos/v1/ns/operator/metrics > /dev/null; then
    echo "Warning: Nacos server is not running on localhost:8848"
    echo "Please start Nacos server first"
    exit 1
fi

# 检查Redis是否运行
echo "Checking Redis server..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Warning: Redis server is not running on localhost:6379"
    echo "Please start Redis server first"
    exit 1
fi

echo "All dependencies are ready!"

# 进入网关服务目录
cd "$(dirname "$0")"

# 清理并编译
echo "Building gateway service..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "Error: Failed to build gateway service"
    exit 1
fi

# 启动服务
echo "Starting gateway service on port 8080..."
mvn spring-boot:run

echo "Gateway service stopped."

