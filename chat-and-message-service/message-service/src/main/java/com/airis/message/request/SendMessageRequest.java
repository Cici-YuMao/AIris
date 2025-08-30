package com.airis.message.request;

import com.airis.message.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;
import java.util.Map;

/**
 * 发送消息请求
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 聊天ID
     */
    @NotBlank(message = "聊天ID不能为空")
    private String chatId;
    
    /**
     * 发送者ID
     */
    @NotBlank(message = "发送者ID不能为空")
    private String senderId;
    
    /**
     * 接收者ID
     */
    @NotBlank(message = "接收者ID不能为空")
    private String receiverId;
    
    /**
     * 消息类型
     */
    @NotNull(message = "消息类型不能为空")
    private MessageType messageType;
    
    /**
     * 消息内容
     */
    @Size(max = 5000, message = "消息内容不能超过5000字符")
    private String content;
    
    /**
     * 媒体文件元数据
     */
    private MediaMetadataRequest mediaMetadata;
    
    /**
     * 客户端发送时间戳
     */
    private Long clientTimestamp;
    
    /**
     * 扩展数据
     */
    private Map<String, Object> extraData;
    
    /**
     * 媒体文件元数据请求
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaMetadataRequest implements Serializable {
        
        private static final long serialVersionUID = 1L;
        
        /**
         * 文件URL
         */
        private String url;
        
        /**
         * 文件名
         */
        private String fileName;
        
        /**
         * 文件大小
         */
        private Long fileSize;
        
        /**
         * 时长（秒）
         */
        private Integer duration;
        
        /**
         * 宽度
         */
        private Integer width;
        
        /**
         * 高度
         */
        private Integer height;
    }
} 