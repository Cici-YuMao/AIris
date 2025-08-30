package com.airis.match.dto;

import lombok.Data;
import java.util.List;

/**
 * 匹配用户详情响应
 */
@Data
public class MatchUserDetailResponse {
    private UserInfoResponse userInfo;
    private UserPreferenceResponse userPreference;
    private List<String> photoUrls;
}

