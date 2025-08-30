package com.airis.gateway.filter;

import com.airis.gateway.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class AuthFilter extends AbstractGatewayFilterFactory<AuthFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    public AuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();
            // ======= 白名单放行 =======
            String path = request.getPath().value();
            if (path.equals("/api/v1/users/login") ||
                path.equals("/api/v1/users/register") ||
                path.equals("/api/v1/match/hot-users") ||
                path.startsWith("/api/v1/auth/") ||
                path.startsWith("/media/public/")) {
                return chain.filter(exchange);
            }
            // 获取Authorization头
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header for path: {}", request.getPath());
                return handleUnauthorized(response, "Missing or invalid Authorization header");
            }

            // 提取JWT token
            String token = authHeader.substring(7);

            try {
                // 验证JWT token
                if (!jwtUtil.validateToken(token)) {
                    log.warn("Invalid JWT token for path: {}", request.getPath());
                    return handleUnauthorized(response, "Invalid JWT token");
                }

                // 从token中提取用户信息
                String userId = jwtUtil.getUserIdFromToken(token);
                String username = jwtUtil.getUsernameFromToken(token);

                // 将用户信息添加到请求头中，传递给下游服务
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-Username", username)
                        .build();

                log.debug("Authentication successful for user: {} (ID: {})", username, userId);

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (Exception e) {
                log.error("JWT token validation failed: {}", e.getMessage());
                return handleUnauthorized(response, "JWT token validation failed");
            }
        };
    }

    private Mono<Void> handleUnauthorized(ServerHttpResponse response, String message) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        String body = String.format("{\"error\":\"Unauthorized\",\"message\":\"%s\",\"timestamp\":\"%s\"}",
                message, System.currentTimeMillis());

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        // 配置类，可以添加配置参数
    }
}

