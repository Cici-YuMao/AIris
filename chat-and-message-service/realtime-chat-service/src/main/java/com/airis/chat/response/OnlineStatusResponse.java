package com.airis.chat.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 在线状态响应
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineStatusResponse {
    
    /**
     * 用户ID
     */
    private String userId;
    
    /**
     * 是否在线
     */
    private boolean online;
    
    /**
     * 所在服务器
     */
    private String server;
    
    /**
     * 时间戳
     */
    private Long timestamp;
} 