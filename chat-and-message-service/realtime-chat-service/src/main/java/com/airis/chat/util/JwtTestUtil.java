package com.airis.chat.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT测试工具类
 * 用于生成测试用的JWT token
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
public class JwtTestUtil {
    
    private static final String SECRET = "airisSuperSecretKey123456";
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24小时
    
    /**
     * 生成JWT token
     * 
     * @param userId 用户ID
     * @return JWT token
     */
    public static String generateToken(String userId) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiration = new Date(now.getTime() + EXPIRATION_TIME);
        
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(key)
                .compact();
    }
    
    /**
     * 主方法 - 用于快速生成测试token
     */
    public static void main(String[] args) {
        if (args.length > 0) {
            String userId = args[0];
            String token = generateToken(userId);
            System.out.println("Generated JWT token for userId '" + userId + "':");
            System.out.println(token);
            System.out.println();
            System.out.println("Usage examples:");
            System.out.println("HTTP Header: Authorization: Bearer " + token);
            System.out.println("WebSocket URL: ws://localhost:9430/ws?userId=" + userId + "&token=" + token);
        } else {
            // 生成一些示例token
            String[] testUsers = {"user1", "user2", "user3"};
            System.out.println("=== JWT Test Tokens ===");
            for (String userId : testUsers) {
                String token = generateToken(userId);
                System.out.println("UserId: " + userId);
                System.out.println("Token: " + token);
                System.out.println("HTTP Header: Authorization: Bearer " + token);
                System.out.println("WebSocket URL: ws://localhost:9430/ws?userId=" + userId + "&token=" + token);
                System.out.println();
            }
        }
    }
} 