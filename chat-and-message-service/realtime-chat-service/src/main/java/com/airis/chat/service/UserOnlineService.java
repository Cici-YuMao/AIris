package com.airis.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 用户在线状态服务
 * 使用Redis管理用户的在线状态和活跃时间
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserOnlineService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${airis.chat.server-id:}")
    private String configuredServerId;

    @Value("${server.port:9430}")
    private int serverPort;

    // Redis键前缀
    private static final String ONLINE_USERS_KEY = "chat:online:users";
    private static final String USER_STATUS_PREFIX = "chat:user:status:";
    private static final String USER_SERVER_PREFIX = "chat:user:server:";
    private static final String CONNECT_LOCK_PREFIX = "lock:user:connect:";

    // 用户状态过期时间（秒）
    private static final long STATUS_EXPIRE_SECONDS = 80;

    // 分布式锁相关常量
    private static final int LOCK_EXPIRE_SECONDS = 10; // 锁超时时间
    private static final int LOCK_RETRY_TIMES = 3; // 重试次数
    private static final int LOCK_RETRY_INTERVAL_MS = 100; // 重试间隔

    /**
     * 设置用户在线
     */
    public void setUserOnline(String userId) {
        String serverId = getServerId();

        // 添加到在线用户集合
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);

        // 设置用户状态
        String statusKey = USER_STATUS_PREFIX + userId;
        redisTemplate.opsForValue().set(statusKey, "ONLINE", STATUS_EXPIRE_SECONDS, TimeUnit.SECONDS);

        // 记录用户所在的服务器节点
        String serverKey = USER_SERVER_PREFIX + userId;
        redisTemplate.opsForValue().set(serverKey, serverId, STATUS_EXPIRE_SECONDS, TimeUnit.SECONDS);

        log.info("User {} is now online on server {}", userId, serverId);
    }

    /**
     * 设置用户离线
     */
    public void setUserOffline(String userId) {
        // 从在线用户集合中移除
        redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);

        // 删除用户状态
        redisTemplate.delete(USER_STATUS_PREFIX + userId);
        redisTemplate.delete(USER_SERVER_PREFIX + userId);

        log.info("User {} is now offline", userId);
    }

    /**
     * 安全地设置用户离线（仅当用户在当前节点时）
     * 防止误清理已在其他节点上线的用户状态
     */
    public boolean setUserOfflineIfOnCurrentNode(String userId) {
        String currentServerId = getServerId();
        String userCurrentServer = getUserServer(userId);

        // 只有用户确实在当前节点时才清理状态
        if (currentServerId.equals(userCurrentServer)) {
            setUserOffline(userId);
            log.info("User {} set offline from current node: {}", userId, currentServerId);
            return true;
        } else {
            log.debug("User {} not on current node (current: {}, user on: {}), skipping offline operation",
                    userId, currentServerId, userCurrentServer);
            return false;
        }
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(String userId) {
        // 既要在在线集合中，状态键也要存在
        boolean inOnlineSet = redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, userId);
        if (!inOnlineSet) {
            return false;
        }

        // 检查状态键是否存在
        String statusKey = USER_STATUS_PREFIX + userId;
        boolean statusKeyExists = redisTemplate.hasKey(statusKey);

        if (!statusKeyExists) {
            // 状态键不存在但用户在在线集合中，清理不一致状态
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
            log.debug("Cleaned inconsistent online status for user: {}", userId);
            return false;
        }

        return true;
    }

    /**
     * 获取用户所在的服务器节点
     */
    public String getUserServer(String userId) {
        return redisTemplate.opsForValue().get(USER_SERVER_PREFIX + userId);
    }

    /**
     * 更新用户活跃时间（心跳）
     */
    public void updateUserActivity(String userId) {
        log.debug("Processing heartbeat for user: {}", userId);

        String statusKey = USER_STATUS_PREFIX + userId;
        String serverKey = USER_SERVER_PREFIX + userId;

        // 直接尝试刷新TTL，如果键不存在，expire返回false
        boolean statusKeyExists = redisTemplate.expire(statusKey, STATUS_EXPIRE_SECONDS, TimeUnit.SECONDS);
        boolean serverKeyExists = redisTemplate.expire(serverKey, STATUS_EXPIRE_SECONDS, TimeUnit.SECONDS);

        if (statusKeyExists && serverKeyExists) {
            // 键存在且刷新成功，确保用户在在线集合中
            redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);
            log.debug("Successfully updated activity for user: {}, TTL refreshed", userId);
        } else {
            // 键不存在或刷新失败，重新设置完整的在线状态
            log.info("User {} status keys missing (statusKey: {}, serverKey: {}), restoring complete online status",
                    userId, statusKeyExists, serverKeyExists);
            setUserOnline(userId);
        }
    }

    /**
     * 获取所有在线用户
     */
    public Set<String> getOnlineUsers() {
        return redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
    }

    /**
     * 获取在线用户数量
     */
    public long getOnlineUserCount() {
        Long count = redisTemplate.opsForSet().size(ONLINE_USERS_KEY);
        return count != null ? count : 0;
    }

    /**
     * 清理过期的在线状态
     * 应该定期调用此方法
     */
    public void cleanupExpiredStatus() {
        Set<String> onlineUsers = getOnlineUsers();
        if (onlineUsers == null || onlineUsers.isEmpty()) {
            return;
        }

        int cleanedCount = 0;
        for (String userId : onlineUsers) {
            String statusKey = USER_STATUS_PREFIX + userId;
            String serverKey = USER_SERVER_PREFIX + userId;

            // 检查状态键和服务器键是否都不存在
            boolean statusExists = redisTemplate.hasKey(statusKey);
            boolean serverExists = redisTemplate.hasKey(serverKey);

            if (!statusExists && !serverExists) {
                // 两个键都不存在，才清理用户
                redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
                cleanedCount++;
                log.info("Cleaned up expired status for user: {}", userId);
            } else if (!statusExists || !serverExists) {
                // 如果只有一个键不存在，可能是TTL时间差导致的，等下次清理
                log.debug("User {} has partial expired keys, will check next time", userId);
            }
        }

        if (cleanedCount > 0) {
            log.info("Cleanup completed, removed {} expired users", cleanedCount);
        }
    }

    /**
     * 获取当前服务器ID
     */
    public String getServerId() {
        // 如果配置了服务器ID，使用配置的ID
        if (configuredServerId != null && !configuredServerId.trim().isEmpty()) {
            return configuredServerId;
        }

        // 否则生成基于IP和端口的唯一标识
        try {
            String hostAddress = InetAddress.getLocalHost().getHostAddress();
            return hostAddress + ":" + serverPort;
        } catch (Exception e) {
            log.warn("Failed to get local host address, using fallback server ID", e);
            return "server-" + serverPort;
        }
    }

    /**
     * 尝试获取用户连接锁（带重试）
     */
    public boolean tryAcquireConnectLock(String userId) {
        String nodeId = getServerId();

        for (int i = 0; i < LOCK_RETRY_TIMES; i++) {
            if (tryLockUserConnect(userId, nodeId)) {
                log.debug("Successfully acquired connect lock for user: {} on attempt {}", userId, i + 1);
                return true;
            }

            if (i < LOCK_RETRY_TIMES - 1) {
                try {
                    Thread.sleep(LOCK_RETRY_INTERVAL_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("Interrupted while waiting for connect lock retry for user: {}", userId);
                    return false;
                }
            }
        }

        log.warn("Failed to acquire connect lock for user: {} after {} attempts", userId, LOCK_RETRY_TIMES);
        return false;
    }

    /**
     * 尝试获取用户连接锁（单次尝试）
     */
    private boolean tryLockUserConnect(String userId, String nodeId) {
        String lockKey = CONNECT_LOCK_PREFIX + userId;
        // 使用SET NX EX命令实现分布式锁
        Boolean result = redisTemplate.opsForValue().setIfAbsent(
                lockKey, nodeId, LOCK_EXPIRE_SECONDS, TimeUnit.SECONDS);

        boolean acquired = Boolean.TRUE.equals(result);
        if (acquired) {
            log.debug("Acquired connect lock for user: {} by node: {}", userId, nodeId);
        }
        return acquired;
    }

    /**
     * 释放用户连接锁
     */
    public void releaseConnectLock(String userId) {
        String nodeId = getServerId();
        String lockKey = CONNECT_LOCK_PREFIX + userId;

        // 使用Lua脚本确保只有锁的持有者能释放锁
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) else return 0 end";

        try {
            Long result = redisTemplate.execute(
                    RedisScript.of(script, Long.class),
                    Collections.singletonList(lockKey),
                    nodeId);

            if (result != null && result == 1) {
                log.debug("Successfully released connect lock for user: {} by node: {}", userId, nodeId);
            } else {
                log.debug("Connect lock for user: {} was not held by node: {} or already expired", userId, nodeId);
            }
        } catch (Exception e) {
            log.warn("Failed to release connect lock for user: {} by node: {}", userId, nodeId, e);
        }
    }
}