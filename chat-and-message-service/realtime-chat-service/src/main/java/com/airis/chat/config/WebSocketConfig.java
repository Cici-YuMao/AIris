package com.airis.chat.config;

import com.airis.chat.websocket.ChatWebSocketHandler;
import com.airis.chat.websocket.HandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket配置类
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final HandshakeInterceptor handshakeInterceptor;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins("*");
    }
} 