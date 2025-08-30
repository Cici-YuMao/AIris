package com.airis.chat.config;

import com.airis.chat.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 安全配置类
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtAuthenticationFilter)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/actuator/**",
                        "/error",
                        "/chat.html",
                        "/test.html",
                        "/ws/**"  // WebSocket连接不使用HTTP拦截器
                );
    }
} 