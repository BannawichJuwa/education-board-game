import { BingoState, Team } from '../types';
import { TERRITORY_POINTS_PER_TILE } from '../config/gameRules';

export interface TeamTerritoryStat {
  teamId: string;
  tilesHeld: number;
  largestConnectedRegion: number;
  territoryScore: number;
  completedLines: number;
  possibleLines: number;
  isAlive: boolean;
}

/**
 * Generates all winning line index sets (rows, columns, 2 main diagonals) for a grid of size N.
 */
export function getBingoLines(gridSize: number): number[][] {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      row.push(r * gridSize + c);
    }
    lines.push(row);
  }

  // Columns
  for (let c = 0; c < gridSize; c++) {
    const col: number[] = [];
    for (let r = 0; r < gridSize; r++) {
      col.push(r * gridSize + c);
    }
    lines.push(col);
  }

  // Diagonal 1 (top-left to bottom-right)
  const diag1: number[] = [];
  // Diagonal 2 (top-right to bottom-left)
  const diag2: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    diag1.push(i * gridSize + i);
    diag2.push(i * gridSize + (gridSize - 1 - i));
  }
  lines.push(diag1, diag2);

  return lines;
}

/**
 * Computes 4-neighbor largest connected region of claimed tiles for a team.
 */
export function getLargestConnectedRegion(bingoState: BingoState, teamId: string): number {
  const { gridSize, tiles } = bingoState;
  const visited = new Set<number>();
  let maxRegion = 0;

  const isTeamTile = (r: number, c: number) => {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
    const idx = r * gridSize + c;
    return tiles[idx]?.claimedByTeamId === teamId;
  };

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const startIdx = r * gridSize + c;
      if (!isTeamTile(r, c) || visited.has(startIdx)) continue;

      let regionSize = 0;
      const queue: [number, number][] = [[r, c]];
      visited.add(startIdx);

      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        regionSize++;

        const neighbors: [number, number][] = [
          [cr - 1, cc],
          [cr + 1, cc],
          [cr, cc - 1],
          [cr, cc + 1],
        ];

        for (const [nr, nc] of neighbors) {
          const nIdx = nr * gridSize + nc;
          if (isTeamTile(nr, nc) && !visited.has(nIdx)) {
            visited.add(nIdx);
            queue.push([nr, nc]);
          }
        }
      }

      if (regionSize > maxRegion) {
        maxRegion = regionSize;
      }
    }
  }

  return maxRegion;
}

/**
 * Computes territory stats per team:
 * tilesHeld, largestConnectedRegion (4-neighbor flood fill), territoryScore = tilesHeld * TERRITORY_POINTS_PER_TILE
 * plus line completion and alive status.
 */
export function getTerritoryStats(
  bingoState: BingoState,
  teams: Team[]
): Record<string, TeamTerritoryStat> {
  const lines = getBingoLines(bingoState.gridSize);
  const winningLinesNeeded = bingoState.winningLinesNeeded || 1;
  const stats: Record<string, TeamTerritoryStat> = {};

  for (const team of teams) {
    const tilesHeld = bingoState.tiles.filter((t) => t.claimedByTeamId === team.id).length;
    const largestConnectedRegion = getLargestConnectedRegion(bingoState, team.id);
    const territoryScore = tilesHeld * TERRITORY_POINTS_PER_TILE;

    let completedLines = 0;
    let unblockedIncompleteLines = 0;

    for (const lineIndices of lines) {
      const allOwnedByTeam = lineIndices.every(
        (idx) => bingoState.tiles[idx]?.claimedByTeamId === team.id
      );
      if (allOwnedByTeam) {
        completedLines++;
        continue;
      }

      const hasOpponentTile = lineIndices.some((idx) => {
        const owner = bingoState.tiles[idx]?.claimedByTeamId;
        return Boolean(owner && owner !== team.id);
      });

      if (!hasOpponentTile) {
        unblockedIncompleteLines++;
      }
    }

    const remainingNeeded = Math.max(0, winningLinesNeeded - completedLines);
    const isAlive = unblockedIncompleteLines >= remainingNeeded;

    stats[team.id] = {
      teamId: team.id,
      tilesHeld,
      largestConnectedRegion,
      territoryScore,
      completedLines,
      possibleLines: completedLines + unblockedIncompleteLines,
      isAlive,
    };
  }

  return stats;
}

/**
 * Returns true if at least one team can still complete `winningLinesNeeded` lines.
 * A team is "alive" if the number of lines (rows, columns, 2 diagonals) that contain
 * no tile claimed by another team is >= its remaining lines needed.
 */
export function canAnyTeamStillComplete(bingoState: BingoState, teams: Team[]): boolean {
  const stats = getTerritoryStats(bingoState, teams);
  return teams.some((t) => stats[t.id]?.isAlive);
}

/**
 * Ranks teams for Bingo when no team won by completing a line:
 * 1. tilesHeld descending
 * 2. largestConnectedRegion descending
 * 3. quiz score descending
 */
export function rankTeamsByBingoTerritory(bingoState: BingoState, teams: Team[]): Team[] {
  const stats = getTerritoryStats(bingoState, teams);
  return [...teams].sort((a, b) => {
    const statA = stats[a.id];
    const statB = stats[b.id];
    if ((statB?.tilesHeld || 0) !== (statA?.tilesHeld || 0)) {
      return (statB?.tilesHeld || 0) - (statA?.tilesHeld || 0);
    }
    if ((statB?.largestConnectedRegion || 0) !== (statA?.largestConnectedRegion || 0)) {
      return (statB?.largestConnectedRegion || 0) - (statA?.largestConnectedRegion || 0);
    }
    return b.score - a.score;
  });
}
