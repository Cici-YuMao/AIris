package com.airis.chat.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT工具类
 * 用于解析和验证JWT token
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${airis.security.jwt.secret:airisSuperSecretKey123456}")
    private String jwtSecret;

    @Value("${airis.security.jwt.enabled:true}")
    private boolean jwtEnabled;

    /**
     * 获取JWT密钥
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 解析JWT token
     * 
     * @param token JWT token
     * @return Claims
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (SignatureException e) {
            log.error("JWT签名验证失败: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT签名验证失败");
        } catch (MalformedJwtException e) {
            log.error("JWT格式错误: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT格式错误");
        } catch (ExpiredJwtException e) {
            log.error("JWT已过期: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT已过期");
        } catch (UnsupportedJwtException e) {
            log.error("不支持的JWT: {}", e.getMessage());
            throw new JwtAuthenticationException("不支持的JWT");
        } catch (IllegalArgumentException e) {
            log.error("JWT参数错误: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT参数错误");
        }
    }

    /**
     * 从token中获取用户ID
     * 
     * @param token JWT token
     * @return 用户ID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * 验证token是否有效
     * 
     * @param token JWT token
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        if (!jwtEnabled) {
            log.debug("JWT验证已禁用，跳过token验证");
            return true;
        }

        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            Claims claims = parseToken(token);

            // 检查token是否过期
            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                log.warn("JWT token已过期");
                return false;
            }

            // 检查subject是否存在
            String subject = claims.getSubject();
            if (!StringUtils.hasText(subject)) {
                log.warn("JWT token缺少subject");
                return false;
            }

            return true;
        } catch (JwtAuthenticationException e) {
            log.warn("JWT token验证失败: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("JWT token验证出现异常", e);
            return false;
        }
    }

    /**
     * 从HTTP请求头中提取Bearer token
     * 
     * @param authorizationHeader Authorization头的值
     * @return JWT token (不包含Bearer前缀)
     */
    public String extractTokenFromHeader(String authorizationHeader) {
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }

    /**
     * 从URL参数中提取token
     * 
     * @param tokenParam URL参数中的token值
     * @return JWT token
     */
    public String extractTokenFromParam(String tokenParam) {
        return StringUtils.hasText(tokenParam) ? tokenParam : null;
    }

    /**
     * JWT是否启用
     */
    public boolean isJwtEnabled() {
        return jwtEnabled;
    }

    /**
     * 验证用户ID是否匹配
     * 
     * @param token          JWT token
     * @param expectedUserId 期望的用户ID
     * @return 是否匹配
     */
    public boolean validateUserIdMatch(String token, String expectedUserId) {
        if (!jwtEnabled) {
            return true;
        }

        if (!StringUtils.hasText(expectedUserId)) {
            return true; // 如果没有提供expectedUserId，则不进行匹配验证
        }

        try {
            String tokenUserId = getUserIdFromToken(token);
            return expectedUserId.equals(tokenUserId);
        } catch (Exception e) {
            log.warn("验证用户ID匹配时出现异常: {}", e.getMessage());
            return false;
        }
    }
}