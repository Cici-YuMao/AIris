package com.airis.match.controller;

import com.airis.match.dto.MatchUserDetailResponse;
import com.airis.match.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/match")
public class MatchController {

    @Autowired
    private MatchService matchService;

    // 游客广场：返回热度最高的前N个用户详细信息
    @GetMapping("/hot-users")
    public List<MatchUserDetailResponse> getHotUsers(@RequestParam(defaultValue = "10") int count) {
        return matchService.getHotUsers(count);
    }

    /**
     * 推荐接口：返回50个用户卡片
     */
    @GetMapping("/recommend")
    public List<MatchUserDetailResponse> recommend(Authentication authentication) {
        Long userId = getUserId(authentication);
        return matchService.recommend(userId, 50);
    }

    /**
     * 高匹配接口：返回5个高匹配用户卡片
     */
    @GetMapping("/highly-matched")
    public List<MatchUserDetailResponse> highlyMatched(Authentication authentication) {
        Long userId = getUserId(authentication);
        return matchService.match(userId, 5);
    }

    /**
     * 用户详细信息
     */
    @GetMapping("/user/{userId}")
    public MatchUserDetailResponse getUserDetail(@PathVariable Long userId) {
        return matchService.getUserDetail(userId);
    }

    /**
     * 清空用户匹配缓存（内部接口）
     */
    @PostMapping("/internal/clear-cache/{userId}")
    public void clearUserMatchCache(@PathVariable Long userId) {
        matchService.clearUserMatchCache(userId);
    }

    /**
     * 清空所有匹配缓存（内部接口）
     */
    @PostMapping("/internal/clear-all-cache")
    public String clearAllMatchCache() {
        try {
            matchService.clearAllMatchCache();
            return "所有匹配缓存已清空";
        } catch (Exception e) {
            return "清空缓存失败: " + e.getMessage();
        }
    }

    // 工具方法：从Authentication获取userId
    private Long getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        } else if (principal instanceof String) {
            return Long.valueOf((String) principal);
        } else {
            throw new RuntimeException("无法识别的用户身份");
        }
    }
}

