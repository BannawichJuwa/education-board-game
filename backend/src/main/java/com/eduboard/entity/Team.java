package com.eduboard.entity;

import jakarta.persistence.*;

/** TEAM table: a competing team inside one GAME_SESSION (GAME_SESSION 1 : N TEAM). */
@Entity
@Table(name = "team")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id")
    private GameSession session;

    @Column(name = "team_name", nullable = false, length = 50)
    private String teamName;

    @Column(nullable = false, length = 10)
    private String color;

    @Column(name = "team_score", nullable = false)
    private Integer teamScore = 0;

    @Column(name = "is_winner", nullable = false)
    private Boolean winner = false;

    public Long getId() { return id; }
    public GameSession getSession() { return session; }
    public void setSession(GameSession session) { this.session = session; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Integer getTeamScore() { return teamScore; }
    public void setTeamScore(Integer teamScore) { this.teamScore = teamScore; }
    public Boolean getWinner() { return winner; }
    public void setWinner(Boolean winner) { this.winner = winner; }
}
