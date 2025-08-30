package com.airis.message;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * MessageService startup class
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableDubbo
@MapperScan("com.airis.message.mapper")
public class MessageServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MessageServiceApplication.class, args);
    }
}