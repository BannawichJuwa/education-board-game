/**
 * Connects the web app to the Spring Boot REST API.
 *
 * How it works (simple to explain):
 *  - The browser keeps a working copy of the sessions (localStorage) so the game stays fast.
 *  - When a teacher is logged in, every change is also sent to the API, which saves it in the
 *    database (MySQL on Google Cloud, H2 on a local computer).
 *  - Guest Mode (not logged in) never talks to the API; its sessions stay in the browser for 24 hours.
 */
import { Session, Team, UserAccount } from '../types';
import { DEFAULT_TEAM_PALETTES, getTeamPalette, migrateSession } from '../utils/storage';
import { DB_LIMITS, fit, fitPoints } from '../config/dbLimits';

const TOKEN_KEY = 'education_board_game_token_v3';

// ------------------------------------------------------------------ token
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export const isServerMode = () => !!getToken();

/** Server ids are numbers ("12"); local / guest ids look like "session-1730...". */
export const isServerId = (id: string | null | undefined) => !!id && /^\d+$/.test(id);

// ------------------------------------------------------------------ fetch helper
export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error');
  }
  if (!res.ok) {
    let code = 'server_error';
    try {
      code = (await res.json()).error || code;
    } catch {
      // No JSON body. In development the Vite proxy answers 502/500 with plain text when the
      // Spring Boot backend is not running, so report it as "cannot connect" instead.
      if (res.status >= 500) code = 'network_error';
    }
    throw new ApiError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ------------------------------------------------------------------ API shapes (see SessionDtos.java)
export interface TeacherDto {
  id: string;
  username: string;
  name: string;
  createdAt: number;
  lastLoginAt: number | null;
}

interface TeamDto {
  id: string | null;
  name: string;
  color: string;
  score: number;
  winner: boolean;
  students: { id: string | null; name: string }[];
  correctAnswersCount?: number;
  wrongAnswersCount?: number;
}

interface QuestionDto {
  id: string | null;
  text: string;
  answer: string;
  points: number;
  category?: string | null;
  explanation?: string | null;
  order: number;
}

interface SessionDto {
  id: string | null;
  title: string;
  subject: string | null;
  gameType: Session['gameType'];
  status: Session['status'];
  durationPreset: Session['durationPreset'];
  boardSize?: number | null;
  timeLimitMinutes: number;
  timeRemainingSeconds: number | null;
  createdAt: number | null;
  completedAt: number | null;
  endReason: string | null;
  boardState: string | null;
  teams: TeamDto[];
  questions: QuestionDto[];
}

export const toUserAccount = (t: TeacherDto): UserAccount => ({
  id: t.id,
  username: t.username,
  name: t.name,
  createdAt: t.createdAt,
  lastLoginAt: t.lastLoginAt ?? t.createdAt,
});

// ------------------------------------------------------------------ Session <-> API mapping

/** Winning team of a finished game: the team the game declared (winnerTeamId), otherwise the top score. */
function winnerIds(s: Session): Set<string> {
  if (s.status !== 'completed' || s.teams.length === 0) return new Set();
  if (s.winnerTeamId) return new Set([s.winnerTeamId]);
  const top = [...s.teams].sort((a, b) => b.score - a.score)[0];
  return new Set([top.id]);
}

function toDto(s: Session): SessionDto {
  const winners = winnerIds(s);
  // Everything that is not a table column goes into BOARD_STATE_JSON.
  const boardState = {
    bingoState: s.bingoState,
    snakesLaddersState: s.snakesLaddersState,
    cardMatchingState: s.cardMatchingState,
    eventLogs: s.eventLogs,
    usedQuestionIds: s.usedQuestionIds,
    awardedQuestionIds: s.awardedQuestionIds,
    activeQuestionId: s.activeQuestionId,
    currentTurnTeamIndex: s.currentTurnTeamIndex,
    isTimerRunning: s.isTimerRunning,
    winnerTeamId: s.winnerTeamId,
    updatedAt: s.updatedAt,
    teamState: Object.fromEntries(
      s.teams.map((t) => [
        t.id,
        {
          pawnPosition: t.pawnPosition,
          bingoTilesClaimed: t.bingoTilesClaimed,
          matchesFound: t.matchesFound,
          stealsCount: t.stealsCount,
          correctAnswersCount: t.correctAnswersCount,
          wrongAnswersCount: t.wrongAnswersCount,
        },
      ])
    ),
  };
  return {
    id: isServerId(s.id) ? s.id : null,
    title: fit(s.title, DB_LIMITS.sessionName),
    subject: s.subject ? fit(s.subject, DB_LIMITS.lessonName) : null,
    gameType: s.gameType,
    status: s.status,
    durationPreset: s.durationPreset,
    timeLimitMinutes: s.timeLimitMinutes,
    timeRemainingSeconds: s.timeRemainingSeconds ?? null,
    createdAt: s.createdAt ?? null,
    completedAt: s.completedAt ?? null,
    endReason: s.endReason ?? null,
    boardState: JSON.stringify(boardState),
    teams: s.teams.map((t, i) => ({
      id: isServerId(t.id) ? t.id : null,
      name: fit(t.name, DB_LIMITS.teamName),
      color: getTeamPalette(t, i).key,
      score: t.score,
      winner: winners.has(t.id),
      students: t.students.map((name) => ({ id: null, name: fit(name, DB_LIMITS.studentName) })),
    })),
    questions: s.questions.map((q, i) => ({
      id: isServerId(q.id) ? q.id : null,
      text: q.text,
      answer: fit(q.answer, DB_LIMITS.correctAnswer),
      points: fitPoints(q.points),
      category: q.category ? fit(q.category, DB_LIMITS.category) : null,
      explanation: q.explanation ?? null,
      order: i + 1,
    })),
  };
}

function fromDto(d: SessionDto, userId: string): Session {
  let extra: Record<string, any> = {};
  try {
    extra = d.boardState ? JSON.parse(d.boardState) : {};
  } catch {
    extra = {};
  }
  const teamState: Record<string, Partial<Team>> = extra.teamState || {};
  const teams: Team[] = d.teams.map((t, i) => {
    const palette = DEFAULT_TEAM_PALETTES.find((p) => p.key === t.color) || DEFAULT_TEAM_PALETTES[i % 6];
    return {
      ...(teamState[t.id as string] || {}),
      id: t.id as string,
      name: t.name,
      color: palette.color,
      badgeColor: palette.badgeColor,
      textColor: palette.textColor,
      students: t.students.map((st) => st.name),
      score: t.score,
      // Counted by the server from the ANSWER table
      correctAnswersCount: t.correctAnswersCount ?? 0,
      wrongAnswersCount: t.wrongAnswersCount ?? 0,
    };
  });
  const questions = d.questions.map((q) => ({
    id: q.id as string,
    text: q.text,
    answer: q.answer,
    points: q.points,
    category: q.category ?? undefined,
    explanation: q.explanation ?? undefined,
  }));
  return migrateSession({
    id: d.id as string,
    title: d.title,
    subject: d.subject ?? undefined,
    createdAt: d.createdAt ?? Date.now(),
    completedAt: d.completedAt ?? undefined,
    updatedAt: extra.updatedAt ?? d.createdAt ?? Date.now(),
    status: d.status,
    gameType: d.gameType,
    durationPreset: d.durationPreset,
    timeLimitMinutes: d.timeLimitMinutes,
    timeRemainingSeconds: d.timeRemainingSeconds ?? undefined,
    isTimerRunning: extra.isTimerRunning,
    teams,
    questions,
    activeQuestionId: extra.activeQuestionId ?? questions[0]?.id ?? null,
    usedQuestionIds: extra.usedQuestionIds ?? [],
    awardedQuestionIds: extra.awardedQuestionIds ?? [],
    eventLogs: extra.eventLogs ?? [],
    currentTurnTeamIndex: extra.currentTurnTeamIndex ?? 0,
    winnerTeamId: extra.winnerTeamId,
    endReason: (d.endReason ?? undefined) as Session['endReason'],
    userId,
    isGuest: false,
    bingoState: extra.bingoState,
    snakesLaddersState: extra.snakesLaddersState,
    cardMatchingState: extra.cardMatchingState,
  });
}

/** Replaces local ids (team-..., q-...) with the ids the database gave them, everywhere in the session. */
function replaceIds(s: Session, map: Map<string, string>): Session {
  let json = JSON.stringify(s);
  map.forEach((newId, oldId) => {
    if (oldId && oldId !== newId) json = json.split(JSON.stringify(oldId)).join(JSON.stringify(newId));
  });
  return JSON.parse(json);
}

// ------------------------------------------------------------------ operations used by the app
/** Creating: POST the new session; returns the same session with database ids. */
export async function createSessionOnServer(s: Session): Promise<Session> {
  const created = await api<SessionDto>('/sessions', 'POST', toDto(s));
  const map = new Map<string, string>([[s.id, created.id as string]]);
  s.teams.forEach((t, i) => created.teams[i] && map.set(t.id, created.teams[i].id as string));
  s.questions.forEach((q, i) => created.questions[i] && map.set(q.id, created.questions[i].id as string));
  const withIds = replaceIds(s, map);
  await api('/sessions/' + withIds.id, 'PUT', toDto(withIds)); // store the board with the new ids
  return withIds;
}

/** Listing: all sessions of the logged-in teacher. */
export async function fetchServerSessions(userId: string): Promise<Session[]> {
  const list = await api<SessionDto[]>('/sessions');
  return list.map((d) => fromDto(d, userId));
}

/** Searching: ids of the sessions that match a keyword / status (done by the database). */
export async function searchServerSessionIds(keyword: string, status: string): Promise<Set<string>> {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set('q', keyword.trim());
  if (status && status !== 'all') params.set('status', status);
  const list = await api<SessionDto[]>('/sessions?' + params.toString());
  return new Set(list.map((d) => d.id as string));
}

// Updating: save progress at most once per 700 ms per session (the timer saves every 5 s).
const pending = new Map<string, Session>();
const timers = new Map<string, number>();

export function scheduleServerSave(s: Session) {
  if (!isServerMode() || !isServerId(s.id) || s.isGuest) return;
  pending.set(s.id, s);
  if (timers.has(s.id)) return;
  timers.set(
    s.id,
    window.setTimeout(async () => {
      timers.delete(s.id);
      const latest = pending.get(s.id);
      pending.delete(s.id);
      if (!latest) return;
      try {
        await api('/sessions/' + latest.id, 'PUT', toDto(latest));
      } catch (e) {
        console.error('Could not save session to the server', e);
      }
    }, 700)
  );
}

/** Deleting. */
export function deleteServerSession(id: string) {
  if (!isServerMode() || !isServerId(id)) return;
  pending.delete(id);
  api('/sessions/' + id, 'DELETE').catch((e) => console.error('Could not delete session on the server', e));
}

/** Records the teacher's Correct / Wrong decision as one ANSWER row. */
export function recordServerAnswer(sessionId: string, teamId: string, questionId: string | undefined, correct: boolean) {
  if (!isServerMode() || !isServerId(sessionId) || !isServerId(teamId) || !isServerId(questionId)) return;
  api('/answers', 'POST', { teamId: Number(teamId), questionId: Number(questionId), correct }).catch((e) => {
    if (!(e instanceof ApiError && e.code === 'already_awarded')) console.error('Could not record answer', e);
  });
}

/** Restart: clears the answer history of a session. */
export function clearServerAnswers(sessionId: string) {
  if (!isServerMode() || !isServerId(sessionId)) return;
  api('/sessions/' + sessionId + '/answers', 'DELETE').catch((e) => console.error('Could not clear answers', e));
}
