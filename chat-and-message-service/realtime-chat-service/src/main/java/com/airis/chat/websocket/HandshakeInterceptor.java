package com.airis.chat.websocket;

import com.airis.chat.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket握手拦截器
 * 用于在WebSocket建立连接前进行身份验证和参数提取
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HandshakeInterceptor extends HttpSessionHandshakeInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        // 如果JWT验证被禁用，使用原有逻辑
        if (!jwtUtil.isJwtEnabled()) {
            return handleWithoutJwt(request, response, wsHandler, attributes);
        }

        // JWT验证逻辑
        String query = request.getURI().getQuery();
        if (query == null) {
            log.warn("WebSocket handshake failed - missing query parameters");
            return false;
        }

        // 提取userId和token
        String userId = extractParameter(query, "userId");
        String token = extractParameter(query, "token");

        if (!StringUtils.hasText(userId)) {
            log.warn("WebSocket handshake failed - missing userId");
            return false;
        }

        if (!StringUtils.hasText(token)) {
            log.warn("WebSocket handshake failed - missing token");
            return false;
        }

        // 验证token
        if (!jwtUtil.validateToken(token)) {
            log.warn("WebSocket handshake failed - invalid token for userId: {}", userId);
            return false;
        }

        // 验证userId是否与token匹配
        if (!jwtUtil.validateUserIdMatch(token, userId)) {
            log.warn("WebSocket handshake failed - userId does not match token: {}", userId);
            return false;
        }

        // 通过验证，设置属性
        attributes.put("userId", userId);
        attributes.put("token", token);
        log.info("WebSocket handshake successful - userId: {}", userId);

        return super.beforeHandshake(request, response, wsHandler, attributes);
    }

    /**
     * 不使用JWT时的处理逻辑（向后兼容）
     */
    private boolean handleWithoutJwt(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        String query = request.getURI().getQuery();
        if (query != null && query.contains("userId=")) {
            String userId = extractParameter(query, "userId");
            if (userId != null) {
                attributes.put("userId", userId);
                log.info("WebSocket handshake (no JWT) - userId: {}", userId);
                return super.beforeHandshake(request, response, wsHandler, attributes);
            }
        }

        log.warn("WebSocket handshake failed - missing userId");
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception ex) {
        super.afterHandshake(request, response, wsHandler, ex);
    }

    private String extractParameter(String query, String paramName) {
        String[] params = query.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=");
            if (keyValue.length == 2 && paramName.equals(keyValue[0])) {
                return keyValue[1];
            }
        }
        return null;
    }
}