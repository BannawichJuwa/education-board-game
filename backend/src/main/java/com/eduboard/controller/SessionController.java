package com.eduboard.controller;

import com.eduboard.config.AuthInterceptor;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.service.AnswerService;
import com.eduboard.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** Listing, searching, creating, updating and deleting game sessions. */
@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final AnswerService answerService;

    public SessionController(SessionService sessionService, AnswerService answerService) {
        this.sessionService = sessionService;
        this.answerService = answerService;
    }

    /** Listing + Searching: GET /api/sessions?q=math&status=completed */
    @GetMapping
    public List<SessionDto> list(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                 @RequestParam(required = false) String q,
                                 @RequestParam(required = false) String status) {
        return sessionService.search(teacherId, q, status);
    }

    @GetMapping("/{id}")
    public SessionDto get(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @PathVariable Long id) {
        return sessionService.get(teacherId, id);
    }

    /** Creating: the Create Session wizard sends the session, its teams (with students) and questions. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionDto create(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @RequestBody SessionDto body) {
        return sessionService.create(teacherId, body);
    }

    /** Updating: game progress, timer, scores, finish data. */
    @PutMapping("/{id}")
    public SessionDto update(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                             @PathVariable Long id, @RequestBody SessionDto body) {
        return sessionService.update(teacherId, id, body);
    }

    /** Deleting: removes the session and everything that belongs to it. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @PathVariable Long id) {
        sessionService.delete(teacherId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/answers")
    public List<AnswerDto> answers(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @PathVariable Long id) {
        return answerService.list(teacherId, id);
    }

    /** Restart: clears the answer history of the session. */
    @DeleteMapping("/{id}/answers")
    public ResponseEntity<Void> clearAnswers(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                             @PathVariable Long id) {
        answerService.clear(teacherId, id);
        return ResponseEntity.noContent().build();
    }
}
