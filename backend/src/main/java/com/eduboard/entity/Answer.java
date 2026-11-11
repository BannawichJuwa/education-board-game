package com.eduboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ANSWER table: one decision of the teacher (Correct / Wrong) for a team on a question.
 * Resolves the many-to-many relationship between TEAM and QUESTION.
 */
@Entity
@Table(name = "answer")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "is_correct", nullable = false)
    private Boolean correct;

    @Column(nullable = false)
    private Integer score = 0;

    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public LocalDateTime getAnsweredAt() { return answeredAt; }
}
