package com.eduboard.service;

import com.eduboard.config.ApiException;
import com.eduboard.config.Times;
import com.eduboard.config.TokenService;
import com.eduboard.dto.AuthDtos.*;
import com.eduboard.entity.Teacher;
import com.eduboard.repository.StudentRepository;
import com.eduboard.repository.TeacherRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

/** FR-01: register, log in, read and delete a teacher account. */
@Service
public class AuthService {

    private final TeacherRepository teachers;
    private final StudentRepository students;
    private final TokenService tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(TeacherRepository teachers, StudentRepository students, TokenService tokens) {
        this.teachers = teachers;
        this.students = students;
        this.tokens = tokens;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String username = trim(req.username()).toLowerCase();
        String name = trim(req.name());
        String password = trim(req.password());
        if (username.isEmpty() || name.isEmpty() || password.isEmpty()) throw ApiException.badRequest("missing_fields");
        if (username.length() < 3) throw ApiException.badRequest("username_too_short");
        if (password.length() < 4) throw ApiException.badRequest("password_too_short");
        if (teachers.existsByUsernameIgnoreCase(username)) throw new ApiException(HttpStatus.CONFLICT, "username_taken");

        Teacher t = new Teacher();
        t.setUsername(username);
        t.setTeacherName(name);
        t.setPassword(encoder.encode(password));          // store the hash, never the password
        t.setLastLoginAt(LocalDateTime.now());
        teachers.save(t);
        return new AuthResponse(tokens.createToken(t.getId()), toDto(t));
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String username = trim(req.username());
        String password = trim(req.password());
        if (username.isEmpty() || password.isEmpty()) throw ApiException.badRequest("missing_fields");
        Teacher t = teachers.findByUsernameIgnoreCase(username)
                .filter(found -> encoder.matches(password, found.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        t.setLastLoginAt(LocalDateTime.now());
        return new AuthResponse(tokens.createToken(t.getId()), toDto(t));
    }

    public TeacherDto me(Long teacherId) {
        return toDto(find(teacherId));
    }

    /** Deletes the account; ON DELETE CASCADE removes the teacher's lessons, sessions, teams, questions and answers. */
    @Transactional
    public void deleteAccount(Long teacherId, DeleteAccountRequest req) {
        Teacher t = find(teacherId);
        if (req == null || req.password() == null || !encoder.matches(req.password().trim(), t.getPassword())) {
            throw ApiException.badRequest("password_mismatch");
        }
        teachers.delete(t);
        teachers.flush();
        students.deleteStudentsWithoutTeam();
    }

    private Teacher find(Long id) {
        return teachers.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "not_logged_in"));
    }

    private static TeacherDto toDto(Teacher t) {
        return new TeacherDto(String.valueOf(t.getId()), t.getUsername(), t.getTeacherName(),
                Times.toMillis(t.getCreatedAt()), Times.toMillis(t.getLastLoginAt()));
    }

    private static String trim(String s) { return s == null ? "" : s.trim(); }
}
