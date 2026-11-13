import {
  Session,
  Team,
  Question,
  SnakesLaddersState,
  BingoState,
  CardMatchingState,
  CardItem,
} from '../types';
import { GAME_RULES } from '../config/gameRules';
import { scheduleServerSave, deleteServerSession } from '../api/serverSync';
import { canAnyTeamStillComplete, getTerritoryStats, rankTeamsByBingoTerritory } from './bingoUtils';
import { rankTeams } from './ranking';

export {
  getTerritoryStats,
  canAnyTeamStillComplete,
  rankTeamsByBingoTerritory,
  getBingoLines,
  getLargestConnectedRegion,
} from './bingoUtils';

const STORAGE_KEY = 'education_board_game_sessions_v2';
const LEGACY_STORAGE_KEY = 'eduboard_classroom_sessions_v2';

export const GUEST_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isGuestSession(session: Partial<Session>): boolean {
  if (typeof session.isGuest === 'boolean') return session.isGuest;
  return !session.userId;
}

export function getGuestSessionRemainingMs(session: Partial<Session>, now = Date.now()): number {
  if (!isGuestSession(session)) return Infinity;
  const baseTime = session.completedAt || session.updatedAt || session.createdAt || now;
  const expiryTime = baseTime + GUEST_SESSION_MAX_AGE_MS;
  return Math.max(0, expiryTime - now);
}

export function formatGuestRemainingTime(remainingMs: number, lang: 'en' | 'th' = 'th'): string {
  if (remainingMs <= 0) {
    return lang === 'en' ? 'Expired' : 'หมดเวลา';
  }
  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) {
    return lang === 'en' ? `${hours}h ${mins}m` : `${hours} ชม. ${mins} นาที`;
  }
  return lang === 'en' ? `${mins}m` : `${mins} นาที`;
}

export interface TeamPaletteItem {
  key: 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  name: string;
  color: string;
  badgeColor: string;
  textColor: string;
  hex: string;
  outlineHex: string;
  lightHex: string;
  textHex: string;
}

export const DEFAULT_TEAM_PALETTES: TeamPaletteItem[] = [
  {
    key: 'red',
    name: 'ทีมสีแดง (Red)',
    color: 'team-bg-red',
    badgeColor: 'bg-[#FFE4E9] text-[#7A102E] border-[#B91C47]',
    textColor: 'text-[#B91C47]',
    hex: '#FF8FA3',
    outlineHex: '#B91C47',
    lightHex: '#FFE4E9',
    textHex: '#7A102E',
  },
  {
    key: 'blue',
    name: 'ทีมสีน้ำเงิน (Blue)',
    color: 'team-bg-blue',
    badgeColor: 'bg-[#E0F2FE] text-[#133C7A] border-[#1E5BB5]',
    textColor: 'text-[#1E5BB5]',
    hex: '#7EC8F8',
    outlineHex: '#1E5BB5',
    lightHex: '#E0F2FE',
    textHex: '#133C7A',
  },
  {
    key: 'green',
    name: 'ทีมสีเขียว (Green)',
    color: 'team-bg-green',
    badgeColor: 'bg-[#DCFCE7] text-[#0D5432] border-[#157F4B]',
    textColor: 'text-[#157F4B]',
    hex: '#8CE9B8',
    outlineHex: '#157F4B',
    lightHex: '#DCFCE7',
    textHex: '#0D5432',
  },
  {
    key: 'orange',
    name: 'ทีมสีส้ม (Orange)',
    color: 'team-bg-orange',
    badgeColor: 'bg-[#FFEDD5] text-[#7C3605] border-[#B8540A]',
    textColor: 'text-[#B8540A]',
    hex: '#FFB870',
    outlineHex: '#B8540A',
    lightHex: '#FFEDD5',
    textHex: '#7C3605',
  },
  {
    key: 'purple',
    name: 'ทีมสีม่วง (Purple)',
    color: 'team-bg-purple',
    badgeColor: 'bg-[#F3E8FF] text-[#3C177A] border-[#5B28B5]',
    textColor: 'text-[#5B28B5]',
    hex: '#C49BFF',
    outlineHex: '#5B28B5',
    lightHex: '#F3E8FF',
    textHex: '#3C177A',
  },
  {
    key: 'pink',
    name: 'ทีมสีชมพู (Pink)',
    color: 'team-bg-pink',
    badgeColor: 'bg-[#FCE7F6] text-[#6E0F53] border-[#A61B7E]',
    textColor: 'text-[#A61B7E]',
    hex: '#FF9CE3',
    outlineHex: '#A61B7E',
    lightHex: '#FCE7F6',
    textHex: '#6E0F53',
  },
];

export function getTeamPalette(team?: Partial<Team> | null, fallbackIndex = 0): TeamPaletteItem {
  if (!team) {
    return DEFAULT_TEAM_PALETTES[fallbackIndex % DEFAULT_TEAM_PALETTES.length];
  }
  const c = (team.color || '').toLowerCase();
  const n = (team.name || '').toLowerCase();
  if (c.includes('red') || c.includes('rose') || n.includes('red') || n.includes('แดง')) {
    return DEFAULT_TEAM_PALETTES[0];
  }
  if (c.includes('blue') || c.includes('sky') || n.includes('blue') || n.includes('น้ำเงิน') || n.includes('ฟ้า')) {
    return DEFAULT_TEAM_PALETTES[1];
  }
  if (c.includes('green') || c.includes('emerald') || n.includes('green') || n.includes('เขียว')) {
    return DEFAULT_TEAM_PALETTES[2];
  }
  if (c.includes('orange') || c.includes('amber') || n.includes('orange') || n.includes('ส้ม')) {
    return DEFAULT_TEAM_PALETTES[3];
  }
  if (c.includes('purple') || c.includes('violet') || n.includes('purple') || n.includes('ม่วง')) {
    return DEFAULT_TEAM_PALETTES[4];
  }
  if (c.includes('pink') || n.includes('pink') || n.includes('ชมพู')) {
    return DEFAULT_TEAM_PALETTES[5];
  }
  return DEFAULT_TEAM_PALETTES[fallbackIndex % DEFAULT_TEAM_PALETTES.length];
}

export const MATCHING_ICONS_POOL = [
  { key: 'atom', label: 'อะตอม (Atom)', labelEn: 'Atom', labelTh: 'อะตอม', icon: 'Atom', emoji: '⚛️' },
  { key: 'dna', label: 'ดีเอ็นเอ (DNA)', labelEn: 'DNA', labelTh: 'ดีเอ็นเอ', icon: 'Dna', emoji: '🧬' },
  { key: 'computer', label: 'คอมพิวเตอร์ (Computer)', labelEn: 'Computer', labelTh: 'คอมพิวเตอร์', icon: 'Laptop', emoji: '💻' },
  { key: 'book', label: 'หนังสือ (Book)', labelEn: 'Book', labelTh: 'หนังสือ', icon: 'BookOpen', emoji: '📖' },
  { key: 'globe', label: 'ลูกโลก (Globe)', labelEn: 'Globe', labelTh: 'ลูกโลก', icon: 'Globe', emoji: '🌍' },
  { key: 'flask', label: 'หลอดทดลอง (Flask)', labelEn: 'Flask', labelTh: 'หลอดทดลอง', icon: 'FlaskConical', emoji: '🧪' },
  { key: 'planet', label: 'ดาวเคราะห์ (Planet)', labelEn: 'Planet', labelTh: 'ดาวเคราะห์', icon: 'Orbit', emoji: '🪐' },
  { key: 'magnet', label: 'แม่เหล็ก (Magnet)', labelEn: 'Magnet', labelTh: 'แม่เหล็ก', icon: 'Magnet', emoji: '🧲' },
  { key: 'microscope', label: 'กล้องจุลทรรศน์ (Microscope)', labelEn: 'Microscope', labelTh: 'กล้องจุลทรรศน์', icon: 'Microscope', emoji: '🔬' },
  { key: 'telescope', label: 'กล้องโทรทรรศน์ (Telescope)', labelEn: 'Telescope', labelTh: 'กล้องโทรทรรศน์', icon: 'Telescope', emoji: '🔭' },
  { key: 'rocket', label: 'จรวด (Rocket)', labelEn: 'Rocket', labelTh: 'จรวด', icon: 'Rocket', emoji: '🚀' },
  { key: 'lightbulb', label: 'หลอดไฟ (Lightbulb)', labelEn: 'Lightbulb', labelTh: 'หลอดไฟ', icon: 'Lightbulb', emoji: '💡' },
  { key: 'palette', label: 'จานสี (Palette)', labelEn: 'Palette', labelTh: 'จานสี', icon: 'Palette', emoji: '🎨' },
  { key: 'trophy', label: 'ถ้วยรางวัล (Trophy)', labelEn: 'Trophy', labelTh: 'ถ้วยรางวัล', icon: 'Trophy', emoji: '🏆' },
  { key: 'clock', label: 'นาฬิกา (Clock)', labelEn: 'Clock', labelTh: 'นาฬิกา', icon: 'Clock', emoji: '⏰' },
  { key: 'abacus', label: 'ลูกคิด (Abacus)', labelEn: 'Abacus', labelTh: 'ลูกคิด', icon: 'Calculator', emoji: '🧮' },
  { key: 'keyboard', label: 'แป้นพิมพ์ (Keyboard)', labelEn: 'Keyboard', labelTh: 'แป้นพิมพ์', icon: 'Keyboard', emoji: '⌨️' },
  { key: 'music', label: 'ตัวโน้ต (Musical Note)', labelEn: 'Musical Note', labelTh: 'ตัวโน้ต', icon: 'Music', emoji: '🎵' },
  { key: 'compass', label: 'เข็มทิศ (Compass)', labelEn: 'Compass', labelTh: 'เข็มทิศ', icon: 'Compass', emoji: '🧭' },
  { key: 'crown', label: 'มงกุฎ (Crown)', labelEn: 'Crown', labelTh: 'มงกุฎ', icon: 'Crown', emoji: '👑' },
];

export const MATCHING_CARD_DICTIONARY: Record<string, { en: string; th: string; emoji: string }> = {
  atom: { en: 'Atom', th: 'อะตอม', emoji: '⚛️' },
  dna: { en: 'DNA', th: 'ดีเอ็นเอ', emoji: '🧬' },
  computer: { en: 'Computer', th: 'คอมพิวเตอร์', emoji: '💻' },
  cpu: { en: 'Computer', th: 'คอมพิวเตอร์', emoji: '💻' },
  book: { en: 'Book', th: 'หนังสือ', emoji: '📖' },
  globe: { en: 'Globe', th: 'ลูกโลก', emoji: '🌍' },
  flask: { en: 'Flask', th: 'หลอดทดลอง', emoji: '🧪' },
  planet: { en: 'Planet', th: 'ดาวเคราะห์', emoji: '🪐' },
  magnet: { en: 'Magnet', th: 'แม่เหล็ก', emoji: '🧲' },
  microscope: { en: 'Microscope', th: 'กล้องจุลทรรศน์', emoji: '🔬' },
  telescope: { en: 'Telescope', th: 'กล้องโทรทรรศน์', emoji: '🔭' },
  rocket: { en: 'Rocket', th: 'จรวด', emoji: '🚀' },
  lightbulb: { en: 'Lightbulb', th: 'หลอดไฟ', emoji: '💡' },
  palette: { en: 'Palette', th: 'จานสี', emoji: '🎨' },
  trophy: { en: 'Trophy', th: 'ถ้วยรางวัล', emoji: '🏆' },
  clock: { en: 'Clock', th: 'นาฬิกา', emoji: '⏰' },
  abacus: { en: 'Abacus', th: 'ลูกคิด', emoji: '🧮' },
  calculator: { en: 'Abacus', th: 'ลูกคิด', emoji: '🧮' },
  keyboard: { en: 'Keyboard', th: 'แป้นพิมพ์', emoji: '⌨️' },
  code: { en: 'Keyboard', th: 'แป้นพิมพ์', emoji: '⌨️' },
  music: { en: 'Musical Note', th: 'ตัวโน้ต', emoji: '🎵' },
  compass: { en: 'Compass', th: 'เข็มทิศ', emoji: '🧭' },
  crown: { en: 'Crown', th: 'มงกุฎ', emoji: '👑' },
};

export function getCardEmoji(pairKey: string): string {
  if (MATCHING_CARD_DICTIONARY[pairKey]) {
    return MATCHING_CARD_DICTIONARY[pairKey].emoji;
  }
  const lower = pairKey.toLowerCase();
  for (const [k, v] of Object.entries(MATCHING_CARD_DICTIONARY)) {
    if (lower.includes(k) || k.includes(lower)) {
      return v.emoji;
    }
  }
  return '🃏';
}

export function getCardDisplayLabel(card: { pairKey: string; label?: string }, lang: 'en' | 'th' = 'th'): string {
  if (MATCHING_CARD_DICTIONARY[card.pairKey]) {
    return MATCHING_CARD_DICTIONARY[card.pairKey][lang];
  }
  if (card.label) {
    if (lang === 'en') {
      const match = card.label.match(/\(([^)]+)\)/);
      if (match) return match[1];
    } else if (lang === 'th') {
      const thOnly = card.label.replace(/\s*\([^)]*\)/, '').trim();
      if (thOnly) return thOnly;
    }
    return card.label;
  }
  return card.pairKey;
}

export function getBingoTileDisplayLabel(tile: { id: number; label: string }, lang: 'en' | 'th' = 'th'): string {
  if (!tile.label) return lang === 'en' ? `Tile ${tile.id}` : `ช่อง ${tile.id}`;
  const trimmed = tile.label.trim();

  if (
    trimmed.startsWith('ช่อง ') ||
    trimmed.startsWith('Tile ') ||
    trimmed.startsWith('Cell ') ||
    /^#?\d+$/.test(trimmed)
  ) {
    return lang === 'en' ? `Tile ${tile.id}` : `ช่อง ${tile.id}`;
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'ทั่วไป' || lower === 'general') return lang === 'en' ? 'General' : 'ทั่วไป';
  if (lower === 'วิทยาศาสตร์' || lower === 'science') return lang === 'en' ? 'Science' : 'วิทยาศาสตร์';
  if (lower === 'คณิตศาสตร์' || lower === 'math' || lower === 'mathematics') return lang === 'en' ? 'Math' : 'คณิตศาสตร์';
  if (lower === 'ภาษาอังกฤษ' || lower === 'english') return lang === 'en' ? 'English' : 'ภาษาอังกฤษ';
  if (lower === 'ประวัติศาสตร์' || lower === 'history') return lang === 'en' ? 'History' : 'ประวัติศาสตร์';
  if (lower === 'สังคมศึกษา' || lower === 'social studies') return lang === 'en' ? 'Social Studies' : 'สังคมศึกษา';

  return tile.label;
}

export function generateSnakesLaddersState(durationPreset: 'quick' | 'standard'): SnakesLaddersState {
  const boardSize =
    durationPreset === 'quick'
      ? GAME_RULES.QUICK_SNAKES_BOARD_SIZE
      : GAME_RULES.STANDARD_SNAKES_BOARD_SIZE;

  const laddersAndSnakes =
    durationPreset === 'quick'
      ? [
          { from: 4, to: 14, type: 'ladder' as const },
          { from: 9, to: 20, type: 'ladder' as const },
          { from: 16, to: 26, type: 'ladder' as const },
          { from: 17, to: 7, type: 'snake' as const },
          { from: 24, to: 15, type: 'snake' as const },
          { from: 28, to: 12, type: 'snake' as const },
        ]
      : [
          { from: 5, to: 16, type: 'ladder' as const },
          { from: 12, to: 25, type: 'ladder' as const },
          { from: 20, to: 32, type: 'ladder' as const },
          { from: 19, to: 8, type: 'snake' as const },
          { from: 29, to: 15, type: 'snake' as const },
          { from: 34, to: 22, type: 'snake' as const },
        ];

  return {
    boardSize,
    laddersAndSnakes,
    lastDiceRoll: undefined,
    eligibleRollTeamId: null,
    lastMove: undefined,
  };
}

export function generateBingoState(
  durationPreset: 'quick' | 'standard',
  questions: Question[],
  lang: 'en' | 'th' = 'th'
): BingoState {
  const gridSize: 4 | 5 =
    durationPreset === 'quick'
      ? GAME_RULES.QUICK_BINGO_GRID_SIZE
      : GAME_RULES.STANDARD_BINGO_GRID_SIZE;
  const totalTiles = gridSize * gridSize;

  const tiles = Array.from({ length: totalTiles }, (_, i) => {
    const questionMatch = questions[i];
    const defaultLabel = lang === 'en' ? `Tile ${i + 1}` : `ช่อง ${i + 1}`;
    let label = defaultLabel;
    if (questionMatch?.category && questionMatch.category.trim()) {
      label = questionMatch.category.trim();
    }
    return {
      id: i + 1,
      label,
      claimedByTeamId: undefined,
    };
  });

  return {
    gridSize,
    tiles,
    winningLinesNeeded: GAME_RULES.BINGO_WINNING_LINES_NEEDED,
    eligibleClaimTeamId: null,
    territoryMode: false,
  };
}

/**
 * Generates Card Matching "Expose and Steal" board:
 * Each pairKey appears on EXACTLY TWO cards (12 unique pairs = 24 cards for Quick, 16 unique pairs = 32 cards for Standard).
 */
export function generateCardMatchingState(
  durationPreset: 'quick' | 'standard' = 'standard',
  lang: 'en' | 'th' = 'th'
): CardMatchingState {
  const totalPairs =
    durationPreset === 'quick'
      ? GAME_RULES.QUICK_UNIQUE_PAIRS
      : GAME_RULES.STANDARD_UNIQUE_PAIRS;

  const shuffledPool = [...MATCHING_ICONS_POOL].sort(() => Math.random() - 0.5);
  const selectedPool = shuffledPool.slice(0, totalPairs);

  const pairsList: CardItem[] = [];
  selectedPool.forEach((item, idx) => {
    const cardLabel = lang === 'en' ? item.labelEn : item.labelTh;
    pairsList.push(
      {
        id: `card-${idx}-a-${item.key}`,
        pairKey: item.key,
        label: cardLabel,
        iconName: item.icon,
        isMatched: false,
        isFaceUp: false,
      },
      {
        id: `card-${idx}-b-${item.key}`,
        pairKey: item.key,
        label: cardLabel,
        iconName: item.icon,
        isMatched: false,
        isFaceUp: false,
      }
    );
  });

  // Fisher-Yates shuffle for uniform random placement
  const shuffledBoard = [...pairsList];
  for (let i = shuffledBoard.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledBoard[i], shuffledBoard[j]] = [shuffledBoard[j], shuffledBoard[i]];
  }

  return {
    boardCards: shuffledBoard,
    totalPairs,
    matchedPairsCount: 0,
    phase: 'idle',
    activeTeamId: null,
    firstPickIndex: null,
    secondPickIndex: null,
    firstPickWasExposed: false,
    turnCounter: 0,
  };
}

export { formatDate, formatDateTime, formatThaiDateTime, formatNumber, formatScore, formatDurationSeconds } from './formatters.ts';

export function exportSessionToCSV(session: Session): void {
  const territoryStats =
    session.gameType === 'bingo' && session.bingoState
      ? getTerritoryStats(session.bingoState, session.teams)
      : null;

  // Standard competition ranking (1, 1, 3); tied teams are marked in the Tie column
  const standings = rankTeams(session);

  const headers = [
    'Rank',
    'Tie',
    'Winner',
    'Team Name',
    'Members',
    'Correct Answers',
    'Wrong Answers',
    'Total Score',
    'matches',
    'steals',
    'tiles_held',
    'largest_region',
    'territory_score',
  ];
  const completed = session.status === 'completed';
  const rows = standings.map(({ team, rank, isTied }) => {
    const tStat = territoryStats?.[team.id];
    const matches =
      team.matchesFound ??
      (session.cardMatchingState
        ? Math.floor(
            session.cardMatchingState.boardCards.filter(
              (c) => c.isMatched && c.matchedByTeamId === team.id
            ).length / 2
          )
        : 0);
    const steals = team.stealsCount || 0;
    const tilesHeld = tStat ? tStat.tilesHeld : (team.bingoTilesClaimed?.length || 0);
    const largestRegion = tStat ? tStat.largestConnectedRegion : 0;
    const territoryScore = tStat ? tStat.territoryScore : 0;

    return [
      rank,
      isTied ? 'Tie' : '',
      completed && rank === 1 ? 'TRUE' : 'FALSE',
      `"${team.name.replace(/"/g, '""')}"`,
      `"${team.students.join('; ').replace(/"/g, '""')}"`,
      team.correctAnswersCount || 0,
      team.wrongAnswersCount || 0,
      team.score,
      matches,
      steals,
      tilesHeld,
      largestRegion,
      territoryScore,
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e: (string | number)[]) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `scoreboard-${session.title.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Migrates any old or new Session object (from localStorage or JSON import)
 * so all new fields have valid defaults and old formats work seamlessly.
 */
export function migrateSession(raw: Session): Session {
  const durationPreset = raw.durationPreset === 'quick' ? 'quick' : 'standard';
  const limit =
    raw.timeLimitMinutes ||
    (durationPreset === 'quick'
      ? GAME_RULES.QUICK_TIME_LIMIT_MINUTES
      : GAME_RULES.STANDARD_TIME_LIMIT_MINUTES);

  // Migrate teams
  const migratedTeams: Team[] = (raw.teams || []).map((t, idx) => {
    const palette = getTeamPalette(t, idx);
    return {
      ...t,
      color: palette.color,
      badgeColor: palette.badgeColor,
      textColor: palette.textColor,
      students: Array.isArray(t.students) ? t.students : [],
      score: typeof t.score === 'number' ? t.score : 0,
      correctAnswersCount: typeof t.correctAnswersCount === 'number' ? t.correctAnswersCount : 0,
      wrongAnswersCount: typeof t.wrongAnswersCount === 'number' ? t.wrongAnswersCount : 0,
      pawnPosition: typeof t.pawnPosition === 'number' ? t.pawnPosition : 1,
      bingoTilesClaimed: Array.isArray(t.bingoTilesClaimed) ? t.bingoTilesClaimed : [],
      matchesFound: typeof t.matchesFound === 'number' ? t.matchesFound : 0,
      stealsCount: typeof t.stealsCount === 'number' ? t.stealsCount : 0,
    };
  });

  // Migrate BingoState
  let updatedBingo = raw.bingoState;
  if (updatedBingo) {
    const winningLinesNeeded = updatedBingo.winningLinesNeeded || GAME_RULES.BINGO_WINNING_LINES_NEEDED;
    const baseBingo: BingoState = {
      ...updatedBingo,
      winningLinesNeeded,
      eligibleClaimTeamId: updatedBingo.eligibleClaimTeamId ?? null,
      territoryMode: Boolean(updatedBingo.territoryMode),
    };
    if (!baseBingo.territoryMode && !baseBingo.winnerTeamId && migratedTeams.length > 0) {
      if (!canAnyTeamStillComplete(baseBingo, migratedTeams)) {
        baseBingo.territoryMode = true;
      }
    }
    updatedBingo = baseBingo;
  }

  // Migrate SnakesLaddersState
  let updatedSnakes = raw.snakesLaddersState;
  if (updatedSnakes) {
    updatedSnakes = {
      ...updatedSnakes,
      boardSize:
        updatedSnakes.boardSize ||
        (durationPreset === 'quick'
          ? GAME_RULES.QUICK_SNAKES_BOARD_SIZE
          : GAME_RULES.STANDARD_SNAKES_BOARD_SIZE),
      eligibleRollTeamId: updatedSnakes.eligibleRollTeamId ?? null,
      lastMove: updatedSnakes.lastMove,
    };
  }

  // Migrate CardMatchingState
  let updatedCardMatching = raw.cardMatchingState;
  if (updatedCardMatching) {
    const expectedPairs =
      durationPreset === 'quick'
        ? GAME_RULES.QUICK_UNIQUE_PAIRS
        : GAME_RULES.STANDARD_UNIQUE_PAIRS;
    const expectedTotalCards = expectedPairs * 2;
    const rawCards = Array.isArray(updatedCardMatching.boardCards)
      ? updatedCardMatching.boardCards
      : [];

    // Check if each pairKey already appears twice (new Expose & Steal format)
    const keyCounts: Record<string, number> = {};
    rawCards.forEach((c) => {
      keyCounts[c.pairKey] = (keyCounts[c.pairKey] || 0) + 1;
    });
    const isPairedFormat =
      rawCards.length === expectedTotalCards &&
      Object.values(keyCounts).every((count) => count === 2);

    if (isPairedFormat) {
      const boardCards: CardItem[] = rawCards.map((c) => ({
        ...c,
        label: MATCHING_CARD_DICTIONARY[c.pairKey]?.th || c.label || c.pairKey,
        isMatched: Boolean(c.isMatched),
        isFaceUp: Boolean(c.isFaceUp || c.isMatched),
        exposedByTeamId: c.isMatched ? undefined : c.exposedByTeamId,
        exposedAtTurn: c.isMatched ? undefined : c.exposedAtTurn,
      }));
      const matchedPairsCount = Math.floor(
        boardCards.filter((c) => c.isMatched).length / 2
      );
      updatedCardMatching = {
        boardCards,
        totalPairs: expectedPairs,
        matchedPairsCount,
        phase: updatedCardMatching.phase || 'idle',
        activeTeamId: updatedCardMatching.activeTeamId ?? null,
        firstPickIndex: updatedCardMatching.firstPickIndex ?? null,
        secondPickIndex: updatedCardMatching.secondPickIndex ?? null,
        firstPickWasExposed: Boolean(updatedCardMatching.firstPickWasExposed),
        turnCounter:
          typeof updatedCardMatching.turnCounter === 'number'
            ? updatedCardMatching.turnCounter
            : 0,
      };
    } else if (rawCards.length > 0 && Object.values(keyCounts).every((count) => count === 1)) {
      // Legacy format migration: each card appeared once on the board -> duplicate into pairs preserving matched status
      const migratedPairs: CardItem[] = [];
      const basePool = rawCards.slice(0, expectedPairs);
      while (basePool.length < expectedPairs) {
        const fallback = MATCHING_ICONS_POOL.find(
          (p) => !basePool.some((b) => b.pairKey === p.key)
        );
        if (!fallback) break;
        basePool.push({
          id: `card-mig-${basePool.length}-${fallback.key}`,
          pairKey: fallback.key,
          label: fallback.labelTh,
          iconName: fallback.icon,
          isMatched: false,
          isFaceUp: false,
        });
      }

      basePool.forEach((c, idx) => {
        const label = MATCHING_CARD_DICTIONARY[c.pairKey]?.th || c.label || c.pairKey;
        const matched = Boolean(c.isMatched);
        migratedPairs.push(
          {
            id: `${c.id || `card-${idx}`}-a`,
            pairKey: c.pairKey,
            label,
            iconName: c.iconName || 'Layers',
            isMatched: matched,
            matchedByTeamId: c.matchedByTeamId,
            isFaceUp: matched,
          },
          {
            id: `${c.id || `card-${idx}`}-b`,
            pairKey: c.pairKey,
            label,
            iconName: c.iconName || 'Layers',
            isMatched: matched,
            matchedByTeamId: c.matchedByTeamId,
            isFaceUp: matched,
          }
        );
      });

      const matchedPairsCount = basePool.filter((c) => c.isMatched).length;
      updatedCardMatching = {
        boardCards: migratedPairs,
        totalPairs: expectedPairs,
        matchedPairsCount,
        phase: 'idle',
        activeTeamId: null,
        firstPickIndex: null,
        secondPickIndex: null,
        firstPickWasExposed: false,
        turnCounter: 0,
      };
    } else {
      updatedCardMatching = generateCardMatchingState(durationPreset, 'th');
    }
  }

    const migratedEventLogs = (Array.isArray(raw.eventLogs) ? raw.eventLogs : []).map((log) => ({
      ...log,
      questionId: log.questionId || undefined,
    }));

    return {
      ...raw,
      durationPreset,
      timeLimitMinutes: limit,
      timeRemainingSeconds: raw.timeRemainingSeconds ?? limit * 60,
      teams: migratedTeams,
      awardedQuestionIds: raw.awardedQuestionIds || raw.usedQuestionIds || [],
      usedQuestionIds: raw.usedQuestionIds || [],
      eventLogs: migratedEventLogs,
      endReason: raw.endReason || undefined,
      bingoState: updatedBingo,
      snakesLaddersState: updatedSnakes,
      cardMatchingState: updatedCardMatching,
    };
}

export function migrateSessionsList(sessions: Session[]): Session[] {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((s) => migrateSession(s));
}

export function loadSessions(): Session[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: Session[] = JSON.parse(raw);
    const migrated = migrateSessionsList(parsed);
    const now = Date.now();
    // Auto-prune guest sessions older than 24 hours
    const active = migrated.filter((s) => {
      if (isGuestSession(s)) {
        return getGuestSessionRemainingMs(s, now) > 0;
      }
      return true;
    });
    if (active.length !== migrated.length) {
      saveSessions(active);
    }
    return active;
  } catch (err) {
    console.error('Failed to load sessions from storage:', err);
    return [];
  }
}

export function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions to storage:', err);
  }
}

export function saveSingleSession(session: Session): Session[] {
  const current = loadSessions();
  const migrated = migrateSession(session);
  const index = current.findIndex((s) => s.id === migrated.id);
  let updated: Session[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...migrated, updatedAt: Date.now() };
  } else {
    updated = [migrated, ...current];
  }
  saveSessions(updated);
  // Logged-in teacher: also save to the database through the API
  scheduleServerSave(index >= 0 ? updated[index] : migrated);
  return updated;
}

export function deleteSession(sessionId: string): Session[] {
  const current = loadSessions();
  const updated = current.filter((s) => s.id !== sessionId);
  saveSessions(updated);
  deleteServerSession(sessionId);
  return updated;
}

/** After login: keep the guest sessions in this browser and replace the rest with the teacher's sessions from the database. */
export function replaceTeacherSessions(serverSessions: Session[]): Session[] {
  const guests = loadSessions().filter((s) => isGuestSession(s));
  const merged = [...serverSessions, ...guests];
  saveSessions(merged);
  return merged;
}

/** After logout: remove the teacher's sessions from this browser (they stay in the database). */
export function removeTeacherSessions(): Session[] {
  const guests = loadSessions().filter((s) => isGuestSession(s));
  saveSessions(guests);
  return guests;
}
