package com.eduboard.repository;

import com.eduboard.entity.TeamMember;
import com.eduboard.entity.TeamMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {
    List<TeamMember> findByTeamIdOrderByStudentIdAsc(Long teamId);
}
