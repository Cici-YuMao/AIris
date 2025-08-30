package com.airis.chat.config;

import com.airis.chat.service.UserOnlineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * 定时任务配置
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class ScheduledTaskConfig {

    private final UserOnlineService userOnlineService;

    /**
     * 定期清理过期的在线状态
     * 每2分钟执行一次（减少与心跳的竞争条件）
     */
    @Scheduled(fixedDelay = 120000, initialDelay = 60000)
    public void cleanupExpiredOnlineStatus() {
        try {
            log.debug("Starting cleanup of expired online status");
            userOnlineService.cleanupExpiredStatus();
            log.debug("Cleanup of expired online status completed");
        } catch (Exception e) {
            log.error("Error during cleanup of expired online status", e);
        }
    }
}