package com.airis.match.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class UserInfoResponse {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String accountStatus;
    private String createdAt;
    private String updatedAt;

    // 个人详细信息字段
    private String name;                  // 姓名
    private String gender;                // 性别
    private Integer age;                  // 年龄
    private String sexualOrientation;     // 性取向
    private Double height;                // 身高
    private Double weight;                // 体重
    private String city;                  // 城市
    private String education;             // 学历
    private String occupation;            // 职业
    private String hobbies;               // 爱好（长文本）
    private String pets;                  // 宠物（选填）
    private String familyStatus;          // 家庭情况（选填）
    private String ipAddress;             // 注册/登录IP

    // 新增互动统计字段
    private Integer likeCount;
    private Integer commentCount;
    private Integer popularity;
    private Map<Long, Long> messageCounts;

    // 新增：评论详情列表
    private List<CommentResponse> comments;  // 该用户收到的评论
}

