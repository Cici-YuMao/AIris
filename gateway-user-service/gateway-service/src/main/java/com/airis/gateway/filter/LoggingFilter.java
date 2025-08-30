package com.airis.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        long startTime = System.currentTimeMillis();
        String requestId = generateRequestId();

        // 记录请求信息
        log.info("Gateway Request [{}] - {} {} from {} - Headers: {}",
                requestId,
                request.getMethod(),
                request.getURI(),
                getClientIp(request),
                request.getHeaders().toSingleValueMap());

        return chain.filter(exchange).then(
            Mono.fromRunnable(() -> {
                long endTime = System.currentTimeMillis();
                long duration = endTime - startTime;

                // 记录响应信息
                log.info("Gateway Response [{}] - Status: {} - Duration: {}ms",
                        requestId,
                        exchange.getResponse().getStatusCode(),
                        duration);
            })
        );
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private String generateRequestId() {
        return String.valueOf(System.currentTimeMillis() + (int)(Math.random() * 1000));
    }

    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddress() != null ?
                request.getRemoteAddress().getAddress().getHostAddress() : "unknown";
    }
}

