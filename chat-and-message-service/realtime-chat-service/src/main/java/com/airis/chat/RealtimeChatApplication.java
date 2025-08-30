package com.airis.chat;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 实时聊天服务应用主类
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableDubbo
public class RealtimeChatApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(RealtimeChatApplication.class, args);
    }
} 