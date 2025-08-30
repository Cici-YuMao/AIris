package com.airis.match;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@EnableDiscoveryClient
@SpringBootApplication
public class MatchServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MatchServiceApplication.class, args);
    }

}

