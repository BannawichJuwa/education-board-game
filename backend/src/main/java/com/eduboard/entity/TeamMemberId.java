package com.eduboard.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** Composite primary key of TEAM_MEMBER: (TEAM_ID, STUDENT_ID). */
@Embeddable
public class TeamMemberId implements Serializable {

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "student_id")
    private Long studentId;

    protected TeamMemberId() { }

    public TeamMemberId(Long teamId, Long studentId) {
        this.teamId = teamId;
        this.studentId = studentId;
    }

    public Long getTeamId() { return teamId; }
    public Long getStudentId() { return studentId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeamMemberId other)) return false;
        return Objects.equals(teamId, other.teamId) && Objects.equals(studentId, other.studentId);
    }

    @Override
    public int hashCode() { return Objects.hash(teamId, studentId); }
}
