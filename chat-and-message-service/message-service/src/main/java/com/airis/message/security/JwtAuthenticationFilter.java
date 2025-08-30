package com.airis.message.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT authentication filter
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // If JWT validation is disabled, pass directly
        if (!jwtUtil.isJwtEnabled()) {
            log.debug("JWT validation disabled, skipping authentication");
            return true;
        }

        // OPTIONS requests pass directly
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // Check if marked to skip authentication
        if (shouldSkipAuthentication(handler)) {
            log.debug("Skip authentication: {}", request.getRequestURI());
            return true;
        }

        // Extract token
        String authorizationHeader = request.getHeader("Authorization");
        String token = jwtUtil.extractTokenFromHeader(authorizationHeader);

        if (!StringUtils.hasText(token)) {
            log.warn("Missing JWT token: {}", request.getRequestURI());
            sendUnauthorizedResponse(response, "Missing Authorization header or token format error");
            return false;
        }

        // Validate token
        if (!jwtUtil.validateToken(token)) {
            log.warn("JWT token validation failed: {}", request.getRequestURI());
            sendUnauthorizedResponse(response, "JWT token validation failed");
            return false;
        }

        // Check if userId in URL parameters matches token
        String userIdParam = request.getParameter("userId");
        if (StringUtils.hasText(userIdParam)) {
            if (!jwtUtil.validateUserIdMatch(token, userIdParam)) {
                log.warn("User ID mismatch: user ID in token does not match URL parameter");
                sendUnauthorizedResponse(response, "User ID mismatch");
                return false;
            }
        }

        // Add user ID to request attributes for subsequent use
        try {
            String userId = jwtUtil.getUserIdFromToken(token);
            request.setAttribute("userId", userId);
            log.debug("User authentication successful: {}", userId);
        } catch (Exception e) {
            log.error("Failed to extract user ID from token", e);
            sendUnauthorizedResponse(response, "Token parsing error");
            return false;
        }

        return true;
    }

    /**
     * Check if authentication should be skipped
     */
    private boolean shouldSkipAuthentication(Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return false;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        Method method = handlerMethod.getMethod();
        Class<?> clazz = handlerMethod.getBeanType();

        // Check if method has @SkipAuthentication annotation
        if (method.isAnnotationPresent(SkipAuthentication.class)) {
            return true;
        }

        // Check if class has @SkipAuthentication annotation
        if (clazz.isAnnotationPresent(SkipAuthentication.class)) {
            return true;
        }

        return false;
    }

    /**
     * Send 401 unauthorized response
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("code", 401);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());

        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }
}