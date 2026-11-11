package com.eduboard.controller;

import com.eduboard.config.AuthInterceptor;
import com.eduboard.dto.AuthDtos.*;
import com.eduboard.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public TeacherDto me(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId) {
        return authService.me(teacherId);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                              @RequestBody DeleteAccountRequest req) {
        authService.deleteAccount(teacherId, req);
        return ResponseEntity.noContent().build();
    }
}
