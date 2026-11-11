package com.eduboard.repository;

import com.eduboard.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySessionIdOrderByIdAsc(Long sessionId);
    long countBySessionId(Long sessionId);
}
