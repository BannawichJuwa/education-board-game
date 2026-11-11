package com.eduboard.service;

import com.eduboard.config.ApiException;
import com.eduboard.dto.SessionDtos.QuestionDto;
import com.eduboard.entity.GameSession;
import com.eduboard.entity.Question;
import com.eduboard.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** FR-04 / managing related entities: questions of a session. */
@Service
public class QuestionService {

    private final SessionService sessionService;
    private final QuestionRepository questions;

    public QuestionService(SessionService sessionService, QuestionRepository questions) {
        this.sessionService = sessionService;
        this.questions = questions;
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> list(Long teacherId, Long sessionId) {
        sessionService.owned(teacherId, sessionId);
        return questions.findBySessionIdOrderByQuestionOrderAsc(sessionId).stream().map(SessionService::toDto).toList();
    }

    @Transactional
    public QuestionDto add(Long teacherId, Long sessionId, QuestionDto in) {
        GameSession s = sessionService.owned(teacherId, sessionId);
        int order = (int) questions.countBySessionId(sessionId) + 1;
        return SessionService.toDto(sessionService.addQuestion(s, in, order));
    }

    @Transactional
    public QuestionDto update(Long teacherId, Long questionId, QuestionDto in) {
        Question q = owned(teacherId, questionId);
        if (in.text() != null && !in.text().isBlank()) q.setQuestionText(in.text().trim());
        if (in.answer() != null) q.setCorrectAnswer(in.answer().trim());
        if (in.points() != null) q.setScore(in.points());
        if (in.category() != null) q.setCategory(in.category().isBlank() ? null : in.category().trim());
        if (in.explanation() != null) q.setExplanation(in.explanation().isBlank() ? null : in.explanation().trim());
        if (in.order() != null) q.setQuestionOrder(in.order());
        return SessionService.toDto(q);
    }

    @Transactional
    public void delete(Long teacherId, Long questionId) {
        questions.delete(owned(teacherId, questionId));   // its answers are removed by ON DELETE CASCADE
    }

    Question owned(Long teacherId, Long questionId) {
        Question q = questions.findById(questionId).orElseThrow(() -> ApiException.notFound("question"));
        if (!q.getSession().getTeacher().getId().equals(teacherId)) throw ApiException.notFound("question");
        return q;
    }
}
