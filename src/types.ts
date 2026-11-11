export type GameType = 'bingo' | 'snakes_ladders' | 'card_matching';

export type SessionStatus = 'draft' | 'in_progress' | 'completed';

export interface Student {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  badgeColor: string;
  textColor: string;
  students: string[]; // List of student names
  score: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  // Game-specific team properties
  pawnPosition?: number; // For snakes and ladders (1 to 30/36)
  bingoTilesClaimed?: number[]; // For bingo (indices of tiles claimed)
  matchesFound?: number; // For card matching (pairs matched)
  stealsCount?: number; // For card matching (pairs stolen from another team's exposed card)
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  points: number;
  category?: string;
  explanation?: string;
}

export type WinReason =
  | 'bingo_line'
  | 'bingo_territory'
  | 'bingo_score'
  | 'snakes_finish'
  | 'snakes_score'
  | 'cards_all_matched'
  | 'cards_score'
  | 'highest_score'
  | 'time_up'
  | 'teacher_finish';

export interface GameEventLog {
  id: string;
  timestamp: number;
  teamId?: string;
  teamName?: string;
  action: string;
  details: string;
  pointsChange?: number;
  questionId?: string;
  type: 'correct' | 'wrong' | 'game_move' | 'system' | 'bonus';
}

// Mini-game specific states
export interface BingoState {
  gridSize: 4 | 5; // 4x4 (16 tiles for 5-7 min) or 5x5 (25 tiles for 8-10 min)
  tiles: {
    id: number;
    label: string; // Number or subject keyword
    claimedByTeamId?: string;
  }[];
  winningLinesNeeded: number;
  winnerTeamId?: string;
  endReason?: WinReason;
  eligibleClaimTeamId?: string | null; // Only the team answering correctly earns right to select a tile
  claimTriggerTimestamp?: number;
  territoryMode?: boolean; // Activated when no team can complete winningLinesNeeded lines
}

export interface SnakeLadderBoardItem {
  from: number;
  to: number;
  type: 'ladder' | 'snake';
}

export interface SnakesLaddersLastMove {
  id: string;
  teamId: string;
  from: number;
  landed: number;
  to: number;
  steps: number;
  kind: 'normal' | 'ladder' | 'snake' | 'finish';
}

export interface SnakesLaddersState {
  boardSize: number; // 30 or 36 tiles calibrated for 5-10 min
  laddersAndSnakes: SnakeLadderBoardItem[];
  lastDiceRoll?: number;
  winnerTeamId?: string;
  endReason?: WinReason;
  eligibleRollTeamId?: string | null; // Only the team that answered correctly gets to roll
  rollTriggerTimestamp?: number; // Timestamp to auto-trigger dice popup immediately
  lastMove?: SnakesLaddersLastMove; // Visual animation descriptor (never replays on refresh)
}

export type CardMatchingPhase =
  | 'idle'
  | 'pick_first'
  | 'await_answer'
  | 'pick_second'
  | 'resolving';

export interface CardItem {
  id: string;
  pairKey: string; // Cards with same pairKey match (2 cards per pairKey)
  label: string;
  iconName: string;
  isMatched: boolean;
  matchedByTeamId?: string;
  isFaceUp: boolean;
  exposedByTeamId?: string;
  exposedAtTurn?: number;
}

export interface CardMatchingState {
  boardCards: CardItem[]; // 24 (12 pairs) or 32 (16 pairs) cards on the board
  totalPairs: number; // 12 or 16 unique pairs
  matchedPairsCount: number;
  phase: CardMatchingPhase;
  activeTeamId: string | null;
  firstPickIndex: number | null;
  secondPickIndex?: number | null;
  firstPickWasExposed: boolean;
  turnCounter: number;
}

export interface Session {
  id: string;
  title: string;
  subject?: string;
  createdAt: number;
  completedAt?: number; // Timestamp when session was finished and results saved
  updatedAt: number;
  status: SessionStatus;
  gameType: GameType;
  durationPreset: 'quick' | 'standard'; // quick = 5-7 min, standard = 8-10 min
  timeLimitMinutes: number; // Game time limit in minutes
  timeRemainingSeconds?: number; // Countdown seconds remaining
  isTimerRunning?: boolean; // Whether timer is running or paused
  teams: Team[];
  questions: Question[];
  activeQuestionId: string | null;
  usedQuestionIds: string[];
  awardedQuestionIds?: string[]; // Question IDs already awarded points (strictly prevents duplicate scoring on the same question)
  eventLogs: GameEventLog[];
  currentTurnTeamIndex: number;
  winnerTeamId?: string;
  endReason?: WinReason;

  // User ownership & Guest mode
  userId?: string | null;
  isGuest?: boolean;

  // Game states
  bingoState?: BingoState;
  snakesLaddersState?: SnakesLaddersState;
  cardMatchingState?: CardMatchingState;
}

export interface UserAccount {
  id: string;
  username: string; // user name (e.g., teacher01)
  name: string; // user display / real name (e.g., Prof. Somchai)
  password?: string; // only used by older local accounts; the server keeps a BCrypt hash
  createdAt: number;
  lastLoginAt: number;
}
