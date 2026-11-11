package com.eduboard.service;

import com.eduboard.config.ApiException;
import com.eduboard.dto.SessionDtos.*;
import com.eduboard.entity.*;
import com.eduboard.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03 / managing related entities: teams of a session and the students inside each team. */
@Service
public class TeamService {

    private final SessionService sessionService;
    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final StudentRepository students;

    public TeamService(SessionService sessionService, TeamRepository teams,
                       TeamMemberRepository members, StudentRepository students) {
        this.sessionService = sessionService;
        this.teams = teams;
        this.members = members;
        this.students = students;
    }

    @Transactional
    public TeamDto addTeam(Long teacherId, Long sessionId, TeamDto in) {
        GameSession s = sessionService.owned(teacherId, sessionId);
        if (teams.countBySessionId(s.getId()) >= 6) throw ApiException.badRequest("max_6_teams");
        return sessionService.toDto(sessionService.addTeam(s, in));
    }

    @Transactional
    public TeamDto updateTeam(Long teacherId, Long teamId, TeamDto in) {
        Team t = owned(teacherId, teamId);
        if (in.name() != null && !in.name().isBlank()) t.setTeamName(in.name().trim());
        if (in.color() != null) t.setColor(in.color());
        if (in.score() != null) t.setTeamScore(in.score());
        return sessionService.toDto(t);
    }

    @Transactional
    public void deleteTeam(Long teacherId, Long teamId) {
        Team t = owned(teacherId, teamId);
        if (teams.countBySessionId(t.getSession().getId()) <= 2) throw ApiException.badRequest("min_2_teams");
        teams.delete(t);
        teams.flush();
        students.deleteStudentsWithoutTeam();
    }

    @Transactional
    public TeamDto addStudent(Long teacherId, Long teamId, StudentDto in) {
        Team t = owned(teacherId, teamId);
        if (in.name() == null || in.name().isBlank()) throw ApiException.badRequest("missing_student_name");
        sessionService.addMember(t, in.name().trim());
        return sessionService.toDto(t);
    }

    @Transactional
    public TeamDto removeStudent(Long teacherId, Long teamId, Long studentId) {
        Team t = owned(teacherId, teamId);
        TeamMemberId id = new TeamMemberId(teamId, studentId);
        if (!members.existsById(id)) throw ApiException.notFound("student");
        members.deleteById(id);
        members.flush();
        students.deleteStudentsWithoutTeam();
        return sessionService.toDto(t);
    }

    /** A team can only be changed by the teacher who owns its session. */
    Team owned(Long teacherId, Long teamId) {
        Team t = teams.findById(teamId).orElseThrow(() -> ApiException.notFound("team"));
        if (!t.getSession().getTeacher().getId().equals(teacherId)) throw ApiException.notFound("team");
        return t;
    }
}
