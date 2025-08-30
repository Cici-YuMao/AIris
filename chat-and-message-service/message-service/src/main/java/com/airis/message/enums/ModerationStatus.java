package com.airis.message.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Content moderation status enum
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum ModerationStatus {

    PENDING("PENDING", "Pending review"),
    APPROVED("APPROVED", "Approved"),
    REJECTED("REJECTED", "Rejected"),
    SKIPPED("SKIPPED", "Skipped review");

    private final String code;
    private final String description;
}