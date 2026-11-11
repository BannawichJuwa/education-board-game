package com.eduboard.repository;

import com.eduboard.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface StudentRepository extends JpaRepository<Student, Long> {

    /** Removes students that are no longer a member of any team (after a team or session is deleted). */
    @Modifying
    @Query("DELETE FROM Student s WHERE NOT EXISTS (SELECT m FROM TeamMember m WHERE m.student = s)")
    int deleteStudentsWithoutTeam();
}
