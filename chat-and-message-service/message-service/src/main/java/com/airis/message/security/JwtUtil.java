package com.airis.message.security;

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
 * JWT utility class
 * Used for parsing and validating JWT tokens
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
     * Get JWT secret key
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Parse JWT token
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
            log.error("JWT signature validation failed: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT signature validation failed");
        } catch (MalformedJwtException e) {
            log.error("JWT format error: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT format error");
        } catch (ExpiredJwtException e) {
            log.error("JWT has expired: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT has expired");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT: {}", e.getMessage());
            throw new JwtAuthenticationException("Unsupported JWT");
        } catch (IllegalArgumentException e) {
            log.error("JWT parameter error: {}", e.getMessage());
            throw new JwtAuthenticationException("JWT parameter error");
        }
    }

    /**
     * Get user ID from token
     * 
     * @param token JWT token
     * @return User ID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * Validate if token is valid
     * 
     * @param token JWT token
     * @return Whether valid
     */
    public boolean validateToken(String token) {
        if (!jwtEnabled) {
            log.debug("JWT validation disabled, skipping token validation");
            return true;
        }

        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            Claims claims = parseToken(token);
            
            // Check if token has expired
            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                log.warn("JWT token has expired");
                return false;
            }
            
            // Check if subject exists
            String subject = claims.getSubject();
            if (!StringUtils.hasText(subject)) {
                log.warn("JWT token missing subject");
                return false;
            }
            
            return true;
        } catch (JwtAuthenticationException e) {
            log.warn("JWT token validation failed: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("JWT token validation exception occurred", e);
            return false;
        }
    }

    /**
     * Extract Bearer token from HTTP request header
     * 
     * @param authorizationHeader Authorization header value
     * @return JWT token (without Bearer prefix)
     */
    public String extractTokenFromHeader(String authorizationHeader) {
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }

    /**
     * Whether JWT is enabled
     */
    public boolean isJwtEnabled() {
        return jwtEnabled;
    }

    /**
     * Validate if user ID matches
     * 
     * @param token JWT token
     * @param expectedUserId Expected user ID
     * @return Whether matches
     */
    public boolean validateUserIdMatch(String token, String expectedUserId) {
        if (!jwtEnabled) {
            return true;
        }

        if (!StringUtils.hasText(expectedUserId)) {
            return true; // If no expectedUserId provided, skip matching validation
        }

        try {
            String tokenUserId = getUserIdFromToken(token);
            return expectedUserId.equals(tokenUserId);
        } catch (Exception e) {
            log.warn("Exception occurred when validating user ID match: {}", e.getMessage());
            return false;
        }
    }
} 