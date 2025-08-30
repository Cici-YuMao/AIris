package com.airis.message.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration class
 * Allows cross-origin requests from all sources
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // registry.addMapping("/**")
        //        .allowedOriginPatterns("*") // Allow all domains
        //         .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH") // Allow all HTTP methods
        //         .allowedHeaders("*") // Allow all request headers
        //         .allowCredentials(true) // Allow sending cookies
        //         .maxAge(3600); // Preflight request cache time
    }

    // @Bean
    // public CorsConfigurationSource corsConfigurationSource() {
    //     CorsConfiguration configuration = new CorsConfiguration();
    //     configuration.addAllowedOriginPattern("*"); // Allow all domains
    //     configuration.addAllowedMethod("*"); // Allow all HTTP methods
    //     configuration.addAllowedHeader("*"); // Allow all request headers
    //     configuration.setAllowCredentials(true); // Allow sending cookies
    //     configuration.setMaxAge(3600L); // Preflight request cache time

    //     UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    //     source.registerCorsConfiguration("/**", configuration);
    //     return source;
    // }
}