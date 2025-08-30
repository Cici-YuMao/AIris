package com.airis.message.dto;

import com.airis.message.enums.MessageStatus;
import com.airis.message.enums.MessageType;
import com.airis.message.enums.ModerationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * Message DTO
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Message ID
     */
    private String messageId;
    
    /**
     * Chat ID
     */
    private String chatId;
    
    /**
     * Sender ID
     */
    private String senderId;
    
    /**
     * Receiver ID
     */
    private String receiverId;
    
    /**
     * Message type
     */
    private MessageType messageType;
    
    /**
     * Message content
     */
    private String content;
    
    /**
     * Media file metadata
     */
    private MediaMetadataDTO mediaMetadata;
    
    /**
     * Server received message timestamp
     */
    private Long timestamp;
    
    /**
     * Client sent timestamp
     */
    private Long clientTimestamp;
    
    /**
     * Message status
     */
    private MessageStatus status;
    
    /**
     * Content moderation status
     */
    private ModerationStatus moderationStatus;
    
    /**
     * Extended data
     */
    private Map<String, Object> extraData;
    
    /**
     * Media file metadata DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaMetadataDTO implements Serializable {
        
        private static final long serialVersionUID = 1L;
        
        /**
         * File URL
         */
        private String url;
        
        /**
         * File name
         */
        private String fileName;
        
        /**
         * File size
         */
        private Long fileSize;
        
        /**
         * Duration in seconds
         */
        private Integer duration;
        
        /**
         * Width
         */
        private Integer width;
        
        /**
         * Height
         */
        private Integer height;
    }
} 