package com.eduboard.repository;

import com.eduboard.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySessionIdOrderByQuestionOrderAsc(Long sessionId);
    long countBySessionId(Long sessionId);
}
