package com.eduboard.repository;

import com.eduboard.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    Optional<Lesson> findByTeacherIdAndLessonNameIgnoreCase(Long teacherId, String lessonName);
}
