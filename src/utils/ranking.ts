import { Session, Team } from '../types';
import { getTerritoryStats } from './bingoUtils';

/**
 * Standings shared by the Save / End Game modal (UI-13), the victory page (UI-14),
 * the scoreboard (UI-15), the CSV export and the server sync (IS_WINNER).
 *
 * Standard competition ranking: teams with equal results share a rank and the
 * next rank is skipped (1, 1, 3). No team is picked arbitrarily when results tie.
 */
export interface RankedTeam {
  team: Team;
  rank: number;
  isTied: boolean;
}

/** Team that reached the game goal on the board (Bingo line, Snakes & Ladders finish tile). */
export function getDeclaredWinnerId(session: Session): string | undefined {
  const id =
    session.gameType === 'bingo'
      ? session.bingoState?.winnerTeamId
      : session.gameType === 'snakes_ladders'
      ? session.snakesLaddersState?.winnerTeamId
      : undefined;
  return id && session.teams.some((t) => t.id === id) ? id : undefined;
}

export function rankTeams(session: Session): RankedTeam[] {
  const declaredId = getDeclaredWinnerId(session);
  // Bingo with no line winner: tiles held -> largest connected region -> quiz score
  const stats =
    session.gameType === 'bingo' && session.bingoState && !declaredId
      ? getTerritoryStats(session.bingoState, session.teams)
      : null;
  const key = (t: Team): number[] =>
    stats
      ? [stats[t.id]?.tilesHeld || 0, stats[t.id]?.largestConnectedRegion || 0, t.score || 0]
      : [t.score || 0];
  const compare = (a: Team, b: Team) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
    return 0;
  };

  const result: RankedTeam[] = [];
  const declared = declaredId ? session.teams.find((t) => t.id === declaredId) : undefined;
  if (declared) result.push({ team: declared, rank: 1, isTied: false });

  const rest = session.teams.filter((t) => t.id !== declaredId).sort(compare);
  const offset = result.length;
  rest.forEach((team, i) => {
    const sameAsPrevious = i > 0 && compare(rest[i - 1], team) === 0;
    const rank = sameAsPrevious ? result[result.length - 1].rank : i + 1 + offset;
    result.push({ team, rank, isTied: false });
  });

  result.forEach((r) => {
    r.isTied = result.filter((x) => x.rank === r.rank).length > 1;
  });
  return result;
}

/** All teams in first place. More than one team means a tie (co-champions). */
export function getWinnerTeams(session: Session): Team[] {
  if (session.teams.length === 0) return [];
  return rankTeams(session)
    .filter((r) => r.rank === 1)
    .map((r) => r.team);
}

/** "Team A & Team B" */
export function joinTeamNames(teams: Team[]): string {
  return teams.map((t) => t.name).join(' & ');
}
