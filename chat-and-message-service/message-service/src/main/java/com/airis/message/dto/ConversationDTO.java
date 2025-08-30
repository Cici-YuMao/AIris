package com.airis.message.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Conversation DTO
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Chat ID
     */
    private String chatId;

    /**
     * Other user ID
     */
    private String otherUserId;

    /**
     * Other user nickname
     */
    private String otherUserNickname;

    /**
     * Other user avatar
     */
    private String otherUserAvatar;

    /**
     * Last message ID
     */
    private String lastMessageId;

    /**
     * Last message content preview
     */
    private String lastMessageContent;

    /**
     * Last message timestamp
     */
    private Long lastMessageTimestamp;

    /**
     * Unread message count
     */
    private Integer unreadCount;

    /**
     * Whether pinned
     */
    private Boolean pinned;

    /**
     * Whether muted
     */
    private Boolean muted;
}