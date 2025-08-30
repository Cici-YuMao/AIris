package com.airis.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * 内容审核服务
 * 提供基本的内容审核功能
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Slf4j
@Service
public class ContentModerationService {

    private static final List<String> SENSITIVE_WORDS = Arrays.asList(
            // Add sensitive word list if necessary
            "WORD_1", "WORD_2"
    );

    /**
     * 检查内容是否合规
     *
     * @param content 待检查的内容
     * @return 是否合规
     */
    public boolean checkContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return true;
        }

        String lowerContent = content.toLowerCase();
        for (String word : SENSITIVE_WORDS) {
            if (lowerContent.contains(word.toLowerCase())) {
                log.warn("Content moderation failed: sensitive word detected - {}", word);
                return false;
            }
        }


        return true;
    }

    /**
     * 过滤敏感内容
     *
     * @param content 原始内容
     * @return 过滤后的内容
     */
    public String filterContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }

        String filtered = content;
        for (String word : SENSITIVE_WORDS) {
            String replacement = "*".repeat(word.length());
            filtered = filtered.replaceAll("(?i)" + word, replacement);
        }

        return filtered;
    }
}