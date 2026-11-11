package com.eduboard.repository;

import com.eduboard.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCase(String username);
}
