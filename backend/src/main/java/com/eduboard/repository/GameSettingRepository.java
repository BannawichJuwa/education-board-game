package com.eduboard.repository;

import com.eduboard.entity.GameSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSettingRepository extends JpaRepository<GameSetting, Long> {
}
