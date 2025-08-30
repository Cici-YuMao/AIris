package com.airis.match.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "account_status", nullable = false, length = 20)
    private String accountStatus = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 个人信息扩展字段
    @Column(length = 50)
    private String name;                  // 姓名

    @Column(length = 10)
    private String gender;                // 性别

    private Integer age;                  // 年龄

    @Column(name = "sexual_orientation", length = 20)
    private String sexualOrientation;     // 性取向

    private Double height;                // 身高（cm）

    private Double weight;                // 体重（kg）

    @Column(length = 100)
    private String city;                  // 城市（IP定位）

    @Column(length = 50)
    private String education;             // 学历

    @Column(length = 100)
    private String occupation;            // 职业

    @Column(columnDefinition = "TEXT")
    private String hobbies;               // 爱好（长文本）

    @Column(length = 100)
    private String pets;                  // 宠物（选填）

    @Column(name = "family_status", length = 100)
    private String familyStatus;          // 家庭情况（选填）

    @Column(name = "ip_address", length = 50)
    private String ipAddress;             // 注册/登录IP

    private Integer popularity;

}

