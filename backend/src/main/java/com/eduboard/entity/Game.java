package com.eduboard.entity;

import jakarta.persistence.*;

/** GAME table: the three board games (bingo, snakes_ladders, card_matching). Lookup data. */
@Entity
@Table(name = "game")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "game_id")
    private Long id;

    @Column(name = "game_name", nullable = false, length = 100)
    private String gameName;

    @Column(name = "game_type", nullable = false, unique = true, length = 20)
    private String gameType;

    @Column(name = "description")
    private String description;

    protected Game() { }

    public Game(String gameName, String gameType, String description) {
        this.gameName = gameName;
        this.gameType = gameType;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getGameName() { return gameName; }
    public String getGameType() { return gameType; }
    public String getDescription() { return description; }
}
