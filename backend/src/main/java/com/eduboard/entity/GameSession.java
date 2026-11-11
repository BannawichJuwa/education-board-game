package com.eduboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * GAME_SESSION table: one classroom game.
 * Belongs to one TEACHER and one GAME, optionally to one LESSON.
 * boardStateJson keeps the live board (tiles, pawns, cards, event log) so the game can be resumed.
 */
@Entity
@Table(name = "game_session")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(name = "session_name", nullable = false, length = 100)
    private String sessionName;

    @Column(nullable = false, length = 20)
    private String status = "in_progress";

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "end_reason", length = 30)
    private String endReason;

    @Column(name = "time_remaining_seconds")
    private Integer timeRemainingSeconds;

    @Column(name = "board_state_json")
    private String boardStateJson;

    public Long getId() { return id; }
    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }
    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }
    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }
    public String getSessionName() { return sessionName; }
    public void setSessionName(String sessionName) { this.sessionName = sessionName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getEndReason() { return endReason; }
    public void setEndReason(String endReason) { this.endReason = endReason; }
    public Integer getTimeRemainingSeconds() { return timeRemainingSeconds; }
    public void setTimeRemainingSeconds(Integer s) { this.timeRemainingSeconds = s; }
    public String getBoardStateJson() { return boardStateJson; }
    public void setBoardStateJson(String boardStateJson) { this.boardStateJson = boardStateJson; }
}
