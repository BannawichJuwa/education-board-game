package com.eduboard.entity;

import jakarta.persistence.*;

/** TEAM_MEMBER table: resolves the many-to-many relationship between TEAM and STUDENT. */
@Entity
@Table(name = "team_member")
public class TeamMember {

    @EmbeddedId
    private TeamMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("teamId")
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("studentId")
    @JoinColumn(name = "student_id")
    private Student student;

    protected TeamMember() { }

    public TeamMember(Team team, Student student) {
        this.id = new TeamMemberId(team.getId(), student.getId());
        this.team = team;
        this.student = student;
    }

    public TeamMemberId getId() { return id; }
    public Team getTeam() { return team; }
    public Student getStudent() { return student; }
}
