package com.eduboard.repository;

import com.eduboard.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    /** Listing + searching: sessions of one teacher, filtered by keyword (session or lesson name) and status. */
    @Query("""
           SELECT s FROM GameSession s LEFT JOIN s.lesson l
           WHERE s.teacher.id = :teacherId
             AND (:keyword IS NULL OR LOWER(s.sessionName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(l.lessonName)  LIKE LOWER(CONCAT('%', :keyword, '%')))
             AND (:status IS NULL OR s.status = :status)
           ORDER BY s.startTime DESC
           """)
    List<GameSession> search(@Param("teacherId") Long teacherId,
                             @Param("keyword") String keyword,
                             @Param("status") String status);

    Optional<GameSession> findByIdAndTeacherId(Long id, Long teacherId);
}
