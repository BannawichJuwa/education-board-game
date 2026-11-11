package com.eduboard.dto;

/** Request and response bodies for /api/auth. */
public final class AuthDtos {
    private AuthDtos() { }

    public record RegisterRequest(String username, String name, String password) { }

    public record LoginRequest(String username, String password) { }

    public record DeleteAccountRequest(String password) { }

    public record TeacherDto(String id, String username, String name, long createdAt, Long lastLoginAt) { }

    public record AuthResponse(String token, TeacherDto teacher) { }
}
