package com.airis.match.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UserPreferenceResponse {
    private Map<String, Integer> ageRange;        // {"min": 20, "max": 30}
    private Map<String, Double> heightRange;      // {"min": 160.0, "max": 180.0}
    private Map<String, Double> weightRange;      // {"min": 50.0, "max": 70.0}
    private String sexualOrientation;             // 性取向偏好：异性恋、同性恋、双性恋、其他
    private List<String> preferredEducation;      // 偏好教育程度
    private List<String> preferredOccupation;     // 偏好职业
    private List<String> preferredCities;         // 多选，支持精确到区县
    private String hobbies;                       // 长文本
    private List<String> dealBreakers;            // 雷点
    private List<String> topPriorities;           // 最看重的偏好，最多3个
}

