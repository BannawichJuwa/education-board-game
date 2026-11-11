package com.eduboard.controller;

import com.eduboard.dto.SessionDtos.GameDto;
import com.eduboard.repository.GameRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** The three board games (public, no login needed). */
@RestController
public class GameController {

    private final GameRepository games;

    public GameController(GameRepository games) {
        this.games = games;
    }

    @GetMapping("/api/games")
    public List<GameDto> list() {
        return games.findAll().stream()
                .map(g -> new GameDto(String.valueOf(g.getId()), g.getGameType(), g.getGameName(), g.getDescription()))
                .toList();
    }
}
