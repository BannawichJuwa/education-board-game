/**
 * Centralized tunable game rule numbers, point values, limits, and animation durations.
 */
export const GAME_RULES = {
  // General & Anti-Spam (FR-03, FR-05)
  MIN_TEAMS: 2,
  MAX_TEAMS: 6,
  DEFAULT_QUESTION_POINTS: 10,
  ANTI_SPAM_CORRECT_LOCK_MS: 1000,
  ANTI_SPAM_WRONG_LOCK_MS: 800,
  QUICK_TIME_LIMIT_MINUTES: 5,
  STANDARD_TIME_LIMIT_MINUTES: 10,
  TIMER_ADD_SECONDS: 60,

  // Card Matching: Prototype Classic Pair Match
  QUICK_UNIQUE_PAIRS: 10, // 10 unique pairs = 20 cards (4x5)
  STANDARD_UNIQUE_PAIRS: 15, // 15 unique pairs = 30 cards (5x6)
  PAIR_MATCH_POINTS: 20,
  STEAL_BONUS_POINTS: 10,
  MAX_EXPOSED_CARDS: 4,
  CARD_MISMATCH_REVEAL_MS: 1500,
  CARD_FLIP_DURATION_MS: 320,
  CARD_VICTORY_DELAY_MS: 1100,

  // Bingo: Line & Territory Mode (FR-02, FR-06, FR-08)
  QUICK_BINGO_GRID_SIZE: 4 as const, // 4x4 = 16 tiles
  STANDARD_BINGO_GRID_SIZE: 5 as const, // 5x5 = 25 tiles
  BINGO_WINNING_LINES_NEEDED: 1,
  BINGO_LINE_WIN_BONUS: 30,
  BINGO_LINE_BONUS: 30, // alias for BINGO_LINE_WIN_BONUS
  TERRITORY_POINTS_PER_TILE: 5,
  BINGO_VICTORY_DELAY_MS: 1000,

  // Snakes & Ladders: Board & Pawn Animation (FR-02, FR-06)
  QUICK_SNAKES_BOARD_SIZE: 30,
  STANDARD_SNAKES_BOARD_SIZE: 36,
  SNAKES_BOARD_COLS: 6,
  SNAKES_FINISH_BONUS: 30,
  DICE_TUMBLE_DURATION_MS: 850,
  DICE_RESULT_AUTO_CLOSE_MS: 3200,
  PAWN_HOP_ARC_HEIGHT_PX: 22,
  PAWN_HOP_DURATION_MS: 250, // 220-280 ms per tile
  PAWN_MIN_HOP_DURATION_MS: 160,
  PAWN_TOTAL_HOP_CAP_MS: 1600, // Cap total hop time at ~1.6 s
  PAWN_LADDER_CLIMB_MS: 700, // 600-800 ms
  PAWN_SNAKE_SLIDE_MS: 750,
  PAWN_FINISH_DANCE_MS: 950, // Max ~1.2 s delay before Victory modal
  FOOTPRINT_FADE_MS: 1200,
} as const;

export const PAIR_MATCH_POINTS = GAME_RULES.PAIR_MATCH_POINTS;
export const STEAL_BONUS_POINTS = GAME_RULES.STEAL_BONUS_POINTS;
export const MAX_EXPOSED_CARDS = GAME_RULES.MAX_EXPOSED_CARDS;
export const TERRITORY_POINTS_PER_TILE = GAME_RULES.TERRITORY_POINTS_PER_TILE;
export const BINGO_LINE_WIN_BONUS = GAME_RULES.BINGO_LINE_WIN_BONUS;
export const SNAKES_FINISH_BONUS = GAME_RULES.SNAKES_FINISH_BONUS;

export const CARD_MISMATCH_BUFFER_PERCENT = 0;

/**
 * Calculates recommended question count based on game type, preset, and number of teams.
 * Ensures the classroom game does not stall out of questions before reaching natural victory.
 */
export function getRecommendedQuestionCount(
  gameType: 'bingo' | 'snakes_ladders' | 'card_matching',
  preset: 'quick' | 'standard' = 'quick',
  teamCount: number = 2
): number {
  if (gameType === 'bingo') {
    return preset === 'standard'
      ? GAME_RULES.STANDARD_BINGO_GRID_SIZE * GAME_RULES.STANDARD_BINGO_GRID_SIZE // 25
      : GAME_RULES.QUICK_BINGO_GRID_SIZE * GAME_RULES.QUICK_BINGO_GRID_SIZE; // 16
  }

  if (gameType === 'card_matching') {
    return preset === 'standard'
      ? GAME_RULES.STANDARD_UNIQUE_PAIRS // 16
      : GAME_RULES.QUICK_UNIQUE_PAIRS; // 12
  }

  if (gameType === 'snakes_ladders') {
    const boardSize =
      preset === 'standard'
        ? GAME_RULES.STANDARD_SNAKES_BOARD_SIZE // 36
        : GAME_RULES.QUICK_SNAKES_BOARD_SIZE; // 30
    const questionsPerTeam = Math.ceil((boardSize - 1) / 3.5);
    const validTeams = Math.max(GAME_RULES.MIN_TEAMS, Math.min(teamCount, GAME_RULES.MAX_TEAMS));
    return questionsPerTeam * validTeams;
  }

  return 16;
}

