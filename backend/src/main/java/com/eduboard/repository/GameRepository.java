package com.eduboard.repository;

import com.eduboard.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {
    Optional<Game> findByGameType(String gameType);
}
