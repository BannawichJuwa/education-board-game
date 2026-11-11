package com.eduboard.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Runs before every /api/** request (except login, register and the game list).
 * Reads "Authorization: Bearer <token>", checks it, and stores the teacher id in the request.
 * Without a valid token the request is rejected with 401 (NFR-01 Security).
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String TEACHER_ID = "teacherId";

    private final TokenService tokenService;

    public AuthInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        Long teacherId = tokenService.readTeacherId(token);
        if (teacherId == null) {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"not_logged_in\"}");
            return false;
        }
        request.setAttribute(TEACHER_ID, teacherId);
        return true;
    }
}
