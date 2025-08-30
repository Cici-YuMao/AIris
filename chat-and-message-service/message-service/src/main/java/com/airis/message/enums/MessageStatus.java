package com.airis.message.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Message status enum
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum MessageStatus {

    SENT("SENT", "Sent"),
    DELIVERED_TO_SERVER("DELIVERED_TO_SERVER", "Delivered to server"),
    READ("READ", "Read"),
    FAILED_MODERATION("FAILED_MODERATION", "Failed moderation"),
    DELETED("DELETED", "Deleted");

    private final String code;
    private final String description;
}