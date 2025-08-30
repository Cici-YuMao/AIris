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
 * 获取消息上下文请求
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageContextRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 目标消息ID
     */
    @NotBlank(message = "消息ID不能为空")
    private String messageId;

    /**
     * 用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;

    /**
     * 聊天ID
     */
    @NotBlank(message = "聊天ID不能为空")
    private String chatId;

    /**
     * 目标消息之前的消息数量
     */
    @NotNull(message = "前置消息数量不能为空")
    @Min(value = 0, message = "前置消息数量不能小于0")
    @Max(value = 100, message = "前置消息数量不能超过100")
    private Integer beforeCount;

    /**
     * 目标消息之后的消息数量
     */
    @NotNull(message = "后置消息数量不能为空")
    @Min(value = 0, message = "后置消息数量不能小于0")
    @Max(value = 100, message = "后置消息数量不能超过100")
    private Integer afterCount;
}