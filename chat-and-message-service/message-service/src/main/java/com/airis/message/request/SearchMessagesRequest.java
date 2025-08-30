package com.airis.message.request;

import com.airis.message.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serializable;

/**
 * 消息搜索请求
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchMessagesRequest implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    private String userId;
    
    /**
     * 搜索关键词
     */
    @NotBlank(message = "搜索关键词不能为空")
    @Size(min = 1, max = 100, message = "搜索关键词长度必须在1-100之间")
    private String keyword;
    
    /**
     * 聊天ID（可选，指定聊天范围）
     */
    private String chatId;
    
    /**
     * 消息类型（可选，指定消息类型）
     */
    private MessageType messageType;
    
    /**
     * 开始时间戳
     */
    private Long startTimestamp;
    
    /**
     * 结束时间戳
     */
    private Long endTimestamp;
    
    /**
     * 页码
     */
    @NotNull(message = "页码不能为空")
    @Min(value = 1, message = "页码必须大于0")
    private Integer page;
    
    /**
     * 每页大小
     */
    @NotNull(message = "每页大小不能为空")
    @Min(value = 1, message = "每页大小必须大于0")
    @Max(value = 50, message = "每页大小不能超过50")
    private Integer size;
} 