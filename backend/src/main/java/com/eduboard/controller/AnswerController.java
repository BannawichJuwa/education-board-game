package com.eduboard.controller;

import com.eduboard.config.AuthInterceptor;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.service.AnswerService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** Records the teacher's Correct / Wrong decisions (ANSWER table). */
@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    private final AnswerService answerService;

    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnswerDto record(@RequestAttribute(AuthInterceptor.TEACHER_ID) Long teacherId, @RequestBody AnswerRequest body) {
        return answerService.record(teacherId, body);
    }
}
