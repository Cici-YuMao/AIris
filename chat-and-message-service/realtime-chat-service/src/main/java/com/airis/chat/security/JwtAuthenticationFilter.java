package com.airis.chat.security;

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
 * JWT身份验证过滤器
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
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 如果JWT验证被禁用，直接通过
        if (!jwtUtil.isJwtEnabled()) {
            log.debug("JWT验证已禁用，跳过身份验证");
            return true;
        }

        // OPTIONS请求直接通过
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // 检查是否标记为跳过认证
        if (shouldSkipAuthentication(handler)) {
            log.debug("跳过身份验证: {}", request.getRequestURI());
            return true;
        }

        // 提取token（首先尝试从Header，然后从URL参数）
        String token = extractToken(request);

        if (!StringUtils.hasText(token)) {
            log.warn("缺少JWT token: {}", request.getRequestURI());
            sendUnauthorizedResponse(response, "缺少Authorization头或token参数");
            return false;
        }

        // 验证token
        if (!jwtUtil.validateToken(token)) {
            log.warn("JWT token验证失败: {}", request.getRequestURI());
            sendUnauthorizedResponse(response, "JWT token验证失败");
            return false;
        }

        // 检查URL参数中的userId是否与token匹配
        String userIdParam = request.getParameter("userId");
        if (StringUtils.hasText(userIdParam)) {
            if (!jwtUtil.validateUserIdMatch(token, userIdParam)) {
                log.warn("用户ID不匹配: token中的用户ID与URL参数不一致");
                sendUnauthorizedResponse(response, "用户ID不匹配");
                return false;
            }
        }

        // 将用户ID添加到请求属性中，供后续使用
        try {
            String userId = jwtUtil.getUserIdFromToken(token);
            request.setAttribute("userId", userId);
            log.debug("用户身份验证成功: {}", userId);
        } catch (Exception e) {
            log.error("从token中提取用户ID失败", e);
            sendUnauthorizedResponse(response, "token解析错误");
            return false;
        }

        return true;
    }

    /**
     * 提取JWT token
     */
    private String extractToken(HttpServletRequest request) {
        // 首先尝试从Authorization头中提取
        String authorizationHeader = request.getHeader("Authorization");
        String token = jwtUtil.extractTokenFromHeader(authorizationHeader);
        
        // 如果Header中没有，尝试从URL参数中提取
        if (!StringUtils.hasText(token)) {
            String tokenParam = request.getParameter("token");
            token = jwtUtil.extractTokenFromParam(tokenParam);
        }
        
        return token;
    }

    /**
     * 检查是否应该跳过身份验证
     */
    private boolean shouldSkipAuthentication(Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return false;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        Method method = handlerMethod.getMethod();
        Class<?> clazz = handlerMethod.getBeanType();

        // 检查方法上是否有@SkipAuthentication注解
        if (method.isAnnotationPresent(SkipAuthentication.class)) {
            return true;
        }

        // 检查类上是否有@SkipAuthentication注解
        if (clazz.isAnnotationPresent(SkipAuthentication.class)) {
            return true;
        }

        return false;
    }

    /**
     * 发送401未授权响应
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