package com.airis.match.service;

import com.airis.match.dto.MatchUserDetailResponse;
import java.util.List;

/**
 * @description: 匹配服务
 * @author: maoyu
 * @date: 2025/07/05
 * @time: 20:11
 * Copyright (C) 2025 Meituan
 * All rights reserved
 */
public interface MatchService {
    /**
     * 推荐接口：返回推荐的用户详细卡片
     */
    List<MatchUserDetailResponse> recommend(Long userId, int count);

    /**
     * 高匹配接口：返回高匹配用户详细卡片
     */
    List<MatchUserDetailResponse> match(Long userId, int count);

    /**
     * 游客广场：返回热度最高的用户详细卡片
     */
    List<MatchUserDetailResponse> getHotUsers(int count);

    /**
     * 获取单个用户详细卡片
     */
    MatchUserDetailResponse getUserDetail(Long userId);

    /**
     * 清空指定用户的匹配缓存
     */
    void clearUserMatchCache(Long userId);

    /**
     * 清空所有匹配缓存
     */
    void clearAllMatchCache();
}

