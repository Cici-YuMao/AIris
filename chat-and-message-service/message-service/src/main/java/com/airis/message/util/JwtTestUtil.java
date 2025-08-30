package com.airis.message.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT test utility class
 * Used to generate JWT tokens for testing
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
public class JwtTestUtil {

    private static final String SECRET = "airisSuperSecretKey123456";
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Generate JWT token
     * 
     * @param userId User ID
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
     * Main method - for quickly generating test tokens
     */
    public static void main(String[] args) {
        if (args.length > 0) {
            String userId = args[0];
            String token = generateToken(userId);
            System.out.println("Generated JWT token for userId '" + userId + "':");
            System.out.println(token);
        } else {
            // Generate some example tokens
            String[] testUsers = { "user1", "user2", "user3" };
            System.out.println("=== JWT Test Tokens ===");
            for (String userId : testUsers) {
                String token = generateToken(userId);
                System.out.println("UserId: " + userId);
                System.out.println("Token: " + token);
                System.out.println();
            }
        }
    }
}