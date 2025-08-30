package com.airis.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Order(-1)
@Component
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        // 设置响应头
        response.getHeaders().add("Content-Type", MediaType.APPLICATION_JSON_VALUE);

        HttpStatus status;
        String message;

        if (ex instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            message = "Service not found";
            log.warn("Service not found: {}", ex.getMessage());
        } else if (ex instanceof ResponseStatusException) {
            ResponseStatusException responseStatusException = (ResponseStatusException) ex;
            status = responseStatusException.getStatus();
            message = responseStatusException.getReason();
            log.warn("Response status exception: {} - {}", status, message);
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Internal server error";
            log.error("Unexpected error in gateway", ex);
        }

        response.setStatusCode(status);

        // 构建错误响应
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("status", status.value());
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("path", exchange.getRequest().getPath().value());

        try {
            String body = objectMapper.writeValueAsString(errorResponse);
            DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            log.error("Error writing response", e);
            return Mono.error(e);
        }
    }
}

