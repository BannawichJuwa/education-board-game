package com.eduboard.config;

import com.eduboard.entity.Game;
import com.eduboard.repository.GameRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Inserts the three GAME rows the first time the application starts. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final GameRepository gameRepository;

    public DataSeeder(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    public void run(String... args) {
        if (gameRepository.count() > 0) return;
        gameRepository.save(new Game("Classroom Bingo", "bingo",
                "Teams claim tiles on a 4x4 or 5x5 grid; the first straight line wins"));
        gameRepository.save(new Game("Snakes & Ladders", "snakes_ladders",
                "Teams roll the dice and race to the final tile of a 30 or 36-tile board"));
        gameRepository.save(new Game("Card Matching", "card_matching",
                "Teams flip two cards to find matching pairs among 20 or 30 cards"));
    }
}
