package com.airis.message.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Message type enum
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum MessageType {
    
    TEXT("TEXT", "Text message"),
    IMAGE("IMAGE", "Image message"),
    VOICE("VOICE", "Voice message"),
    VIDEO("VIDEO", "Video message"),
    FILE("FILE", "File message"),
    EMOJI("EMOJI", "Emoji message"),
    SYSTEM("SYSTEM", "System message");
    
    private final String code;
    private final String description;
} 