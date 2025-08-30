package com.airis.message.security;

/**
 * JWT authentication exception
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
public class JwtAuthenticationException extends RuntimeException {

    public JwtAuthenticationException(String message) {
        super(message);
    }

    public JwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}