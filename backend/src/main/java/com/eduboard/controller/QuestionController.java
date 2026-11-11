package com.eduboard.controller;

import com.eduboard.config.AuthInterceptor;
import com.eduboard.dto.SessionDtos.QuestionDto;
import com.eduboard.service.QuestionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** Managing related entities: QUESTION rows of a session. */
@RestController
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping("/sessions/{sessionId}/questions")
    public List<QuestionDto> list(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @PathVariable Long sessionId) {
        return questionService.list(teacherId, sessionId);
    }

    @PostMapping("/sessions/{sessionId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionDto add(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                           @PathVariable Long sessionId, @RequestBody QuestionDto body) {
        return questionService.add(teacherId, sessionId, body);
    }

    @PutMapping("/questions/{questionId}")
    public QuestionDto update(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                              @PathVariable Long questionId, @RequestBody QuestionDto body) {
        return questionService.update(teacherId, questionId, body);
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> delete(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId,
                                       @PathVariable Long questionId) {
        questionService.delete(teacherId, questionId);
        return ResponseEntity.noContent().build();
    }
}
