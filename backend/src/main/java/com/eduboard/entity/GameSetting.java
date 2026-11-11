package com.eduboard.entity;

import jakarta.persistence.*;

/** GAME_SETTING table: 1 : 1 with GAME_SESSION. Its primary key is also the foreign key (SESSION_ID). */
@Entity
@Table(name = "game_setting")
public class GameSetting {

    @Id
    @Column(name = "session_id")
    private Long sessionId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "session_id")
    private GameSession session;

    @Column(name = "duration_preset", nullable = false, length = 10)
    private String durationPreset;

    @Column(name = "board_size", nullable = false)
    private Integer boardSize;

    @Column(name = "time_limit_minutes", nullable = false)
    private Integer timeLimitMinutes;

    public Long getSessionId() { return sessionId; }
    public GameSession getSession() { return session; }
    public void setSession(GameSession session) { this.session = session; }
    public String getDurationPreset() { return durationPreset; }
    public void setDurationPreset(String durationPreset) { this.durationPreset = durationPreset; }
    public Integer getBoardSize() { return boardSize; }
    public void setBoardSize(Integer boardSize) { this.boardSize = boardSize; }
    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }
}
