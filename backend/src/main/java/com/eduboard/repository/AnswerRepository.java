package com.eduboard.repository;

import com.eduboard.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /** Number of correct (or wrong) answers of one team -> shown on the scoreboard. */
    long countByTeamIdAndCorrect(Long teamId, Boolean correct);

    /** Anti-duplicate scoring: has this question already been answered correctly? */
    boolean existsByQuestionIdAndCorrectTrue(Long questionId);

    List<Answer> findByTeamSessionIdOrderByAnsweredAtAsc(Long sessionId);

    /** Restart: remove every answer of the session. */
    @Modifying
    @Query("DELETE FROM Answer a WHERE a.team.id IN (SELECT t.id FROM Team t WHERE t.session.id = :sessionId)")
    int deleteBySessionId(@Param("sessionId") Long sessionId);
}
