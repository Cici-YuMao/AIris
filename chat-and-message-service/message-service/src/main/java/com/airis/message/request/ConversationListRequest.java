package com.airis.message.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * Conversation list query request
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationListRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * User ID
     */
    @NotBlank(message = "User ID cannot be blank")
    private String userId;

    /**
     * Page number
     */
    @NotNull(message = "Page number cannot be null")
    @Min(value = 1, message = "Page number must be greater than 0")
    private Integer page;

    /**
     * Page size
     */
    @NotNull(message = "Page size cannot be null")
    @Min(value = 1, message = "Page size must be greater than 0")
    @Max(value = 50, message = "Page size cannot exceed 50")
    private Integer size;

    /**
     * Query before timestamp (for pagination optimization)
     */
    private Long beforeTimestamp;
}