package com.airis.message.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * MySQL chat session entity
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {

    /**
     * Primary key ID
     */
    private Long id;

    /**
     * Chat ID
     */
    private String chatId;

    /**
     * User1 ID
     */
    private String user1Id;

    /**
     * User2 ID
     */
    private String user2Id;

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
     * User1 unread message count
     */
    private Integer user1UnreadCount;

    /**
     * User2 unread message count
     */
    private Integer user2UnreadCount;

    /**
     * User1 last read message ID
     */
    private String user1LastReadMessageId;

    /**
     * User2 last read message ID
     */
    private String user2LastReadMessageId;

    /**
     * Created time
     */
    private LocalDateTime createdAt;

    /**
     * Updated time
     */
    private LocalDateTime updatedAt;
}