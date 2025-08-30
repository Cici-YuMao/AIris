package com.airis.chat.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 跳过身份验证注解
 * 使用此注解的方法或类将跳过JWT身份验证
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface SkipAuthentication {
} 