package com.airis.message.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Chat detail DTO
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDetailDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Chat ID
     */
    private String chatId;

    /**
     * User A's ID
     */
    private String userAId;

    /**
     * User B's ID
     */
    private String userBId;

    /**
     * Chat duration in seconds
     * Time difference from the first message to now
     */
    private Long chatDurationSeconds;

    /**
     * First message timestamp
     */
    private Long firstMessageTimestamp;

    /**
     * Last message timestamp
     */
    private Long lastMessageTimestamp;

    /**
     * Total message count
     */
    private Long totalMessageCount;

    /**
     * User A's message count
     */
    private Long userAMessageCount;

    /**
     * User B's message count
     */
    private Long userBMessageCount;

    /**
     * Whether chat history exists
     */
    private Boolean hasChatHistory;
}