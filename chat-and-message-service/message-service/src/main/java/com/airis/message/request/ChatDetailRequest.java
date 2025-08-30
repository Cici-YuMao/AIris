package com.airis.message.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * Chat detail query request
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatDetailRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * User A's ID
     */
    @NotBlank(message = "User A's ID cannot be blank")
    private String userAId;

    /**
     * User B's ID
     */
    @NotBlank(message = "User B's ID cannot be blank")
    private String userBId;
}