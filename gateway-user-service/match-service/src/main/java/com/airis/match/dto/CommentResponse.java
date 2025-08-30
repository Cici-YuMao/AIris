package com.airis.match.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private Long userId;        // 评论者ID
    private String username;    // 评论者用户名
    private Long commentedUserId;   // 被评论的用户ID
    private String commentText;     // 评论内容
    private LocalDateTime createdAt;
}

