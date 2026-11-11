package com.eduboard.service;

import com.eduboard.config.ApiException;
import com.eduboard.config.Times;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.entity.*;
import com.eduboard.repository.AnswerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** FR-05: records each Correct / Wrong decision of the teacher. */
@Service
public class AnswerService {

    private final SessionService sessionService;
    private final TeamService teamService;
    private final QuestionService questionService;
    private final AnswerRepository answers;

    public AnswerService(SessionService sessionService, TeamService teamService,
                         QuestionService questionService, AnswerRepository answers) {
        this.sessionService = sessionService;
        this.teamService = teamService;
        this.questionService = questionService;
        this.answers = answers;
    }

    @Transactional
    public AnswerDto record(Long teacherId, AnswerRequest in) {
        if (in.teamId() == null || in.questionId() == null || in.correct() == null) {
            throw ApiException.badRequest("missing_fields");
        }
        Team team = teamService.owned(teacherId, in.teamId());
        Question question = questionService.owned(teacherId, in.questionId());
        if (!team.getSession().getId().equals(question.getSession().getId())) {
            throw ApiException.badRequest("team_and_question_in_different_sessions");
        }
        // Anti-duplicate scoring (NFR-03): a question can be answered correctly only once.
        if (in.correct() && answers.existsByQuestionIdAndCorrectTrue(question.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "already_awarded");
        }
        Answer a = new Answer();
        a.setTeam(team);
        a.setQuestion(question);
        a.setCorrect(in.correct());
        a.setScore(in.correct() ? question.getScore() : 0);   // the server decides the points
        answers.save(a);
        return toDto(a);
    }

    @Transactional(readOnly = true)
    public List<AnswerDto> list(Long teacherId, Long sessionId) {
        sessionService.owned(teacherId, sessionId);
        return answers.findByTeamSessionIdOrderByAnsweredAtAsc(sessionId).stream().map(AnswerService::toDto).toList();
    }

    /** Restart (UI-12): clear every answer of the session. */
    @Transactional
    public void clear(Long teacherId, Long sessionId) {
        sessionService.owned(teacherId, sessionId);
        answers.deleteBySessionId(sessionId);
    }

    private static AnswerDto toDto(Answer a) {
        return new AnswerDto(String.valueOf(a.getId()), String.valueOf(a.getTeam().getId()),
                String.valueOf(a.getQuestion().getId()), a.getCorrect(), a.getScore(), Times.toMillis(a.getAnsweredAt()));
    }
}
