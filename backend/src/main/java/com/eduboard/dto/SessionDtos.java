package com.eduboard.dto;

import java.util.List;

/**
 * JSON shapes exchanged with the React app. Field names follow the web app's own
 * Session / Team / Question types so the frontend needs only a small mapper.
 * Ids are sent as strings because the web app uses string ids.
 */
public final class SessionDtos {
    private SessionDtos() { }

    public record SessionDto(
            String id,
            String title,                 // GAME_SESSION.SESSION_NAME
            String subject,               // LESSON.LESSON_NAME
            String gameType,              // GAME.GAME_TYPE
            String status,                // GAME_SESSION.STATUS
            String durationPreset,        // GAME_SETTING.DURATION_PRESET
            Integer boardSize,            // GAME_SETTING.BOARD_SIZE
            Integer timeLimitMinutes,     // GAME_SETTING.TIME_LIMIT_MINUTES
            Integer timeRemainingSeconds, // GAME_SESSION.TIME_REMAINING_SECONDS
            Long createdAt,               // GAME_SESSION.START_TIME (epoch ms)
            Long completedAt,             // GAME_SESSION.END_TIME (epoch ms)
            String endReason,             // GAME_SESSION.END_REASON
            String boardState,            // GAME_SESSION.BOARD_STATE_JSON
            List<TeamDto> teams,
            List<QuestionDto> questions) { }

    public record TeamDto(
            String id,
            String name,
            String color,
            Integer score,
            Boolean winner,
            List<StudentDto> students,
            Long correctAnswersCount,     // COUNT of ANSWER rows with IS_CORRECT = true
            Long wrongAnswersCount) { }   // COUNT of ANSWER rows with IS_CORRECT = false

    public record StudentDto(String id, String name) { }

    public record QuestionDto(
            String id,
            String text,
            String answer,
            Integer points,
            String category,
            String explanation,
            Integer order) { }

    public record AnswerRequest(Long teamId, Long questionId, Boolean correct) { }

    public record AnswerDto(String id, String teamId, String questionId, Boolean correct, Integer score, Long answeredAt) { }

    public record GameDto(String id, String gameType, String name, String description) { }
}
