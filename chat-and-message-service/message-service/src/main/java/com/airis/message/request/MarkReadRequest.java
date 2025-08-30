package com.airis.message.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * Mark read request
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkReadRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Chat ID
     */
    @NotBlank(message = "Chat ID cannot be blank")
    private String chatId;

    /**
     * User ID
     */
    @NotBlank(message = "User ID cannot be blank")
    private String userId;

    /**
     * Read message ID
     */
    @NotBlank(message = "Message ID cannot be blank")
    private String messageId;
}