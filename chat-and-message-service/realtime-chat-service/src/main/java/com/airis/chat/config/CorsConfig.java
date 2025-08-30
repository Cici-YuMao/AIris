package com.airis.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS配置类
 * 允许所有来源的跨域请求
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
//        registry.addMapping("/**")
//                .allowedOriginPatterns("*") // 允许所有域
//                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH") // 允许所有HTTP方法
//                .allowedHeaders("*") // 允许所有请求头
//                .allowCredentials(true) // 允许发送Cookie
//                .maxAge(3600); // 预检请求缓存时间
    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration configuration = new CorsConfiguration();
//        configuration.addAllowedOriginPattern("*"); // 允许所有域
//        configuration.addAllowedMethod("*"); // 允许所有HTTP方法
//        configuration.addAllowedHeader("*"); // 允许所有请求头
//        configuration.setAllowCredentials(true); // 允许发送Cookie
//        configuration.setMaxAge(3600L); // 预检请求缓存时间
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration);
//        return source;
//    }
}