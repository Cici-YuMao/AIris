package com.airis.message.config;

import com.airis.message.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Security configuration class
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
                        "/doc.html",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-resources/**",
                        "/webjars/**");
    }
}