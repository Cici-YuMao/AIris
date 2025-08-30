package com.airis.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * 验证JWT token是否有效
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return !isTokenExpired(claims);
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("JWT token validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 从token中获取用户ID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getSubject(); // user服务将userId存储在subject中
    }

    /**
     * 从token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("username", String.class); // user服务将username存储在username字段中
    }

    /**
     * 从token中获取过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getExpiration();
    }

    /**
     * 从token中获取Claims
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(secret)
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 检查token是否过期
     */
    private boolean isTokenExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration.before(new Date());
    }

    /**
     * 从token中获取用户角色
     */
    public String getRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("role", String.class);
    }

    /**
     * 检查token是否即将过期（30分钟内）
     */
    public boolean isTokenExpiringSoon(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            Date now = new Date();
            long timeDiff = expiration.getTime() - now.getTime();
            return timeDiff < 30 * 60 * 1000; // 30分钟
        } catch (Exception e) {
            return true;
        }
    }
}

