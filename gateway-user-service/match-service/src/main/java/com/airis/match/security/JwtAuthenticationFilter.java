package com.airis.match.security;

import com.airis.match.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // 1. 获取Token
        String authHeader = request.getHeader("Authorization");
        String token = null;
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            token = authHeader.replace("Bearer ", "");
        }

        // 2. 校验Token是否在黑名单
        if (token != null) {
            Boolean isBlacklisted = redisTemplate.hasKey("jwt:blacklist:" + token);
            if (Boolean.TRUE.equals(isBlacklisted)) {
                // Token在黑名单，拒绝访问
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token已失效，请重新登录");
                return;
            }

            // 3. 校验Token有效性
            try {
                Long userId = jwtUtil.parseUserId(token);
                String username = jwtUtil.parseUsername(token);

                // 4. 设置Spring Security上下文
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, null);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                // Token无效或过期
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token无效或已过期");
                return;
            }
        }

        // 5. 继续后续过滤器链
        filterChain.doFilter(request, response);
    }
}

