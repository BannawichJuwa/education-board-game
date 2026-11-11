import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Team, SnakeLadderBoardItem, SnakesLaddersLastMove } from '../../types';
import { getTeamPalette } from '../../utils/storage';
import { playHopSound, playLadderSound, playSnakeSound } from '../../utils/audio';
import { GAME_RULES } from '../../config/gameRules';

export type MascotExpression = 'normal' | 'happy' | 'shocked' | 'dizzy' | 'cheer';

interface TileCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FootprintItem {
  id: string;
  tile: number;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

interface LandingSparkle {
  id: string;
  x: number;
  y: number;
  color: string;
  kind: 'dust' | 'sparkle' | 'dizzy';
}

interface PawnVisualState {
  tile: number;
  x: number;
  y: number;
  arcOffsetY: number;
  scaleX: number;
  scaleY: number;
  shadowScale: number;
  wobbleDeg: number;
  facing: 'left' | 'right';
  expression: MascotExpression;
  stepCounter: number | null;
  isMoving: boolean;
}

interface PawnLayerProps {
  teams: Team[];
  boardSize: number;
  cols: number;
  laddersAndSnakes: SnakeLadderBoardItem[];
  lastMove?: SnakesLaddersLastMove;
  tileRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
  onAnimationStatusChange?: (status: {
    animatingTeamId: string | null;
    pulsingTile: number | null;
    activeLadderFrom: number | null;
    activeSnakeFrom: number | null;
    stepCount: number | null;
  }) => void;
}

// Cute 16x16 Pixel Mascot Sprite per Team Color & Expression
export const PixelPawnMascot: React.FC<{
  fillHex: string;
  outlineHex: string;
  expression: MascotExpression;
  facing: 'left' | 'right';
  size?: number;
}> = ({ fillHex, outlineHex, expression, facing, size = 34 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      style={{
        imageRendering: 'pixelated',
        transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      className="select-none overflow-visible"
    >
      {/* Cute Ears / Antenna */}
      <path fill={outlineHex} d="M3 1h3v2H3V1zm7 0h3v2h-3V1z" />
      <path fill={fillHex} d="M4 2h1v1H4V2zm7 0h1v1h-1V2z" />

      {/* Outer Dark Pixel Outline (Projector Safe) */}
      <path
        fill={outlineHex}
        d="M3 3h10v1h1v1h1v7h-1v1h-1v2h-2v-1H5v1H3v-2H2v-1H1V5h1V4h1V3z"
      />

      {/* Body Pastel Fill */}
      <path
        fill={fillHex}
        d="M4 4h8v1h1v6h-1v1H4v-1H3V5h1V4z"
      />

      {/* Top Highlight */}
      <path fill="#FFFFFF" fillOpacity={0.65} d="M4 4h6v1H4V4zM3 5h1v2H3V5z" />

      {/* Rosy Pixel Cheeks */}
      <path fill="#FF6B8B" d="M3 8h2v1H3V8zm8 0h2v1h-2V8z" />

      {/* Eyes & Mouth by Expression */}
      {expression === 'normal' && (
        <>
          <path fill="#231942" d="M5 6h2v2H5V6zm5 0h2v2h-2V6z" />
          <path fill="#FFFFFF" d="M5 6h1v1H5V6zm5 0h1v1h-1V6z" />
          <path fill="#231942" d="M6 9h4v1H6V9z" />
        </>
      )}

      {expression === 'happy' && (
        <>
          {/* ^ ^ Happy Eyes */}
          <path fill="#231942" d="M4 7h1V6h1v1h1v1H4V7zm5 0h1V6h1v1h1v1H9V7z" />
          {/* Open Happy Smile */}
          <path fill="#231942" d="M6 9h4v2H6V9z" />
          <path fill="#FF8FA3" d="M7 10h2v1H7v-1z" />
        </>
      )}

      {expression === 'cheer' && (
        <>
          {/* Starry/Sparkle Eyes + Crown */}
          <path fill="#FFE36E" d="M6 1h4v2H6V1z" />
          <path fill="#231942" d="M5 6h2v2H5V6zm5 0h2v2h-2V6z" />
          <path fill="#FFE36E" d="M5 6h1v1H5V6zm5 0h1v1h-1V6z" />
          <path fill="#231942" d="M5 9h6v2H5V9z" />
          <path fill="#FF8FA3" d="M6 10h4v1H6v-1z" />
        </>
      )}

      {expression === 'shocked' && (
        <>
          {/* Wide O O Eyes + O Mouth + Sweat Drop */}
          <path fill="#FFFFFF" d="M4 5h3v3H4V5zm5 0h3v3H9V5z" />
          <path fill="#231942" d="M5 6h1v1H5V6zm5 0h1v1h-1V6z" />
          <path fill="#231942" d="M7 9h2v2H7V9z" />
          <path fill="#7EC8F8" d="M13 4h1v2h-1V4z" />
        </>
      )}

      {expression === 'dizzy' && (
        <>
          {/* X X / Spiral Eyes + Wavy Mouth */}
          <path fill="#231942" d="M4 6h1v1h1V6h1v1H6v1h1v1H6V8H5v1H4V8h1V7H4V6zm6 0h1v1h1V6h1v1h-1v1h1v1h-1V8h-1v1h-1V8h1V7h-1V6z" />
          <path fill="#231942" d="M5 10h2V9h2v1h2v1H9v-1H7v1H5v-1z" />
        </>
      )}
    </svg>
  );
};

function getRowDirection(tileNum: number, cols: number): 'left' | 'right' {
  const rowFromBottom = Math.floor((tileNum - 1) / cols);
  return rowFromBottom % 2 === 0 ? 'right' : 'left';
}

export const PawnLayer: React.FC<PawnLayerProps> = ({
  teams,
  boardSize,
  cols,
  laddersAndSnakes,
  lastMove,
  tileRefs,
  boardContainerRef,
  onAnimationStatusChange,
}) => {
  const [tileCenters, setTileCenters] = useState<Record<number, TileCoord>>({});
  const [footprints, setFootprints] = useState<FootprintItem[]>([]);
  const [sparkles, setSparkles] = useState<LandingSparkle[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeLadderFrom, setActiveLadderFrom] = useState<number | null>(null);
  const [activeSnakeFrom, setActiveSnakeFrom] = useState<number | null>(null);

  // Track visual state per team
  const [pawnStates, setPawnStates] = useState<Record<string, PawnVisualState>>({});

  // Prevent replaying old moves on mount/refresh
  const processedMoveIdsRef = useRef<Set<string>>(
    new Set(lastMove?.id ? [lastMove.id] : [])
  );
  const moveQueueRef = useRef<SnakesLaddersLastMove[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const skipRequestedRef = useRef<boolean>(false);
  const tileCentersRef = useRef<Record<number, TileCoord>>({});

  // Measure tile centers relative to boardContainerRef
  const measureTiles = useCallback(() => {
    const container = boardContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const nextCenters: Record<number, TileCoord> = {};
    for (let t = 1; t <= boardSize; t++) {
      const el = tileRefs.current[t];
      if (el) {
        const rect = el.getBoundingClientRect();
        nextCenters[t] = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      }
    }
    tileCentersRef.current = nextCenters;
    setTileCenters(nextCenters);
  }, [boardContainerRef, boardSize, tileRefs]);

  useEffect(() => {
    measureTiles();
    const container = boardContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      measureTiles();
    });
    ro.observe(container);
    window.addEventListener('resize', measureTiles);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureTiles);
    };
  }, [boardContainerRef, measureTiles]);

  // Sync idle pawns with logical positions when not animating
  useEffect(() => {
    setPawnStates((prev) => {
      const next: Record<string, PawnVisualState> = { ...prev };
      teams.forEach((team) => {
        const existing = next[team.id];
        if (existing && existing.isMoving) {
          return;
        }
        const logicalTile = Math.min(boardSize, Math.max(1, team.pawnPosition || 1));
        const coord = tileCenters[logicalTile] || { x: 0, y: 0 };
        next[team.id] = {
          tile: logicalTile,
          x: coord.x,
          y: coord.y,
          arcOffsetY: 0,
          scaleX: 1,
          scaleY: 1,
          shadowScale: 1,
          wobbleDeg: 0,
          facing: getRowDirection(logicalTile, cols),
          expression: existing?.expression === 'cheer' ? 'cheer' : 'normal',
          stepCounter: null,
          isMoving: false,
        };
      });
      return next;
    });
  }, [teams, tileCenters, boardSize, cols]);

  // Clean up expired footprints periodically
  useEffect(() => {
    if (footprints.length === 0) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setFootprints((prev) =>
        prev.filter((fp) => now - fp.createdAt < GAME_RULES.FOOTPRINT_FADE_MS)
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [footprints.length]);

  const spawnSparkle = useCallback((x: number, y: number, color: string, kind: LandingSparkle['kind'] = 'dust') => {
    const id = `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSparkles((prev) => [...prev, { id, x, y, color, kind }]);
    window.setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 550);
  }, []);

  // Sleep helper that resolves early if skip is requested
  const waitMs = (ms: number) =>
    new Promise<void>((resolve) => {
      if (skipRequestedRef.current) {
        resolve();
        return;
      }
      const start = performance.now();
      const check = () => {
        if (skipRequestedRef.current || performance.now() - start >= ms) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });

  // Process the move queue
  const processNextMove = useCallback(async () => {
    if (isAnimatingRef.current) return;
    const nextMove = moveQueueRef.current.shift();
    if (!nextMove) {
      setActiveTeamId(null);
      setActiveLadderFrom(null);
      setActiveSnakeFrom(null);
      onAnimationStatusChange?.({
        animatingTeamId: null,
        pulsingTile: null,
        activeLadderFrom: null,
        activeSnakeFrom: null,
        stepCount: null,
      });
      return;
    }

    isAnimatingRef.current = true;
    skipRequestedRef.current = false;
    setActiveTeamId(nextMove.teamId);

    const teamIdx = teams.findIndex((t) => t.id === nextMove.teamId);
    const team = teams[teamIdx];
    const palette = getTeamPalette(team, Math.max(0, teamIdx));
    const centers = tileCentersRef.current;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const snapToFinal = () => {
      const endCoord = centers[nextMove.to] || { x: 0, y: 0 };
      setPawnStates((prev) => ({
        ...prev,
        [nextMove.teamId]: {
          tile: nextMove.to,
          x: endCoord.x,
          y: endCoord.y,
          arcOffsetY: 0,
          scaleX: 1,
          scaleY: 1,
          shadowScale: 1,
          wobbleDeg: 0,
          facing: getRowDirection(nextMove.to, cols),
          expression: nextMove.kind === 'finish' ? 'cheer' : 'normal',
          stepCounter: null,
          isMoving: false,
        },
      }));
    };

    if (prefersReducedMotion) {
      playHopSound(1);
      snapToFinal();
      await waitMs(180);
      isAnimatingRef.current = false;
      processNextMove();
      return;
    }

    // 1. Tile-by-tile arc hops from `from` -> `landed`
    const totalSteps = Math.max(0, nextMove.landed - nextMove.from);
    const hopDurationMs =
      totalSteps > 0
        ? Math.max(
            GAME_RULES.PAWN_MIN_HOP_DURATION_MS,
            Math.min(
              GAME_RULES.PAWN_HOP_DURATION_MS,
              Math.floor(GAME_RULES.PAWN_TOTAL_HOP_CAP_MS / totalSteps)
            )
          )
        : GAME_RULES.PAWN_HOP_DURATION_MS;

    let currentTile = nextMove.from;

    for (let step = 1; step <= totalSteps; step++) {
      if (skipRequestedRef.current) break;

      const prevTile = currentTile;
      const targetTile = Math.min(boardSize, nextMove.from + step);
      currentTile = targetTile;

      const fromCoord = centers[prevTile] || { x: 0, y: 0 };
      const toCoord = centers[targetTile] || fromCoord;

      // Determine travel direction (diagonal/upward at row turns, otherwise row direction)
      const dx = toCoord.x - fromCoord.x;
      const facing: 'left' | 'right' =
        Math.abs(dx) > 4
          ? dx >= 0
            ? 'right'
            : 'left'
          : getRowDirection(targetTile, cols);

      // Leave a fading pixel footprint on previous tile
      setFootprints((prev) => [
        ...prev,
        {
          id: `fp-${Date.now()}-${prevTile}-${step}`,
          tile: prevTile,
          x: fromCoord.x,
          y: fromCoord.y + 8,
          color: palette.outlineHex,
          createdAt: Date.now(),
        },
      ]);

      playHopSound(step);

      onAnimationStatusChange?.({
        animatingTeamId: nextMove.teamId,
        pulsingTile: targetTile,
        activeLadderFrom: null,
        activeSnakeFrom: null,
        stepCount: step,
      });

      // Mid-air stretch phase
      const midX = (fromCoord.x + toCoord.x) / 2;
      const midY = (fromCoord.y + toCoord.y) / 2;
      setPawnStates((prev) => ({
        ...prev,
        [nextMove.teamId]: {
          tile: targetTile,
          x: midX,
          y: midY,
          arcOffsetY: -GAME_RULES.PAWN_HOP_ARC_HEIGHT_PX,
          scaleX: 0.86,
          scaleY: 1.18,
          shadowScale: 0.55,
          wobbleDeg: facing === 'right' ? 6 : -6,
          facing,
          expression: 'happy',
          stepCounter: step,
          isMoving: true,
        },
      }));

      await waitMs(Math.floor(hopDurationMs * 0.52));
      if (skipRequestedRef.current) break;

      // Landing squash phase
      spawnSparkle(toCoord.x, toCoord.y + 6, palette.hex, 'dust');
      setPawnStates((prev) => ({
        ...prev,
        [nextMove.teamId]: {
          tile: targetTile,
          x: toCoord.x,
          y: toCoord.y,
          arcOffsetY: 0,
          scaleX: 1.24,
          scaleY: 0.78,
          shadowScale: 1.1,
          wobbleDeg: 0,
          facing,
          expression: 'happy',
          stepCounter: step,
          isMoving: true,
        },
      }));

      await waitMs(Math.floor(hopDurationMs * 0.48));
    }

    // 2. Ladder Climb or Snake Slide if landed != to
    if (!skipRequestedRef.current && nextMove.to !== nextMove.landed) {
      const startCoord = centers[nextMove.landed] || { x: 0, y: 0 };
      const endCoord = centers[nextMove.to] || startCoord;

      if (nextMove.kind === 'ladder' || nextMove.to > nextMove.landed) {
        // Happy jump + Ladder Climb (600-800ms, wobble, sparkles at top)
        setActiveLadderFrom(nextMove.landed);
        onAnimationStatusChange?.({
          animatingTeamId: nextMove.teamId,
          pulsingTile: nextMove.to,
          activeLadderFrom: nextMove.landed,
          activeSnakeFrom: null,
          stepCount: null,
        });
        playLadderSound();

        const climbSteps = 8;
        const stepTime = Math.floor(GAME_RULES.PAWN_LADDER_CLIMB_MS / climbSteps);
        for (let i = 1; i <= climbSteps; i++) {
          if (skipRequestedRef.current) break;
          const t = i / climbSteps;
          // Smooth ease-in-out
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const curX = startCoord.x + (endCoord.x - startCoord.x) * eased;
          const curY = startCoord.y + (endCoord.y - startCoord.y) * eased;
          const wobble = i % 2 === 0 ? 8 : -8;

          setPawnStates((prev) => ({
            ...prev,
            [nextMove.teamId]: {
              tile: nextMove.to,
              x: curX,
              y: curY,
              arcOffsetY: -6,
              scaleX: 0.95,
              scaleY: 1.08,
              shadowScale: 0.7,
              wobbleDeg: wobble,
              facing: endCoord.x >= startCoord.x ? 'right' : 'left',
              expression: 'happy',
              stepCounter: null,
              isMoving: true,
            },
          }));
          await waitMs(stepTime);
        }

        spawnSparkle(endCoord.x, endCoord.y - 6, '#FFE36E', 'sparkle');
        setActiveLadderFrom(null);
      } else if (nextMove.kind === 'snake' || nextMove.to < nextMove.landed) {
        // Shocked face + Snake Slide along curved squiggle path + Squash & Dizzy Stars
        setActiveSnakeFrom(nextMove.landed);
        onAnimationStatusChange?.({
          animatingTeamId: nextMove.teamId,
          pulsingTile: nextMove.to,
          activeLadderFrom: null,
          activeSnakeFrom: nextMove.landed,
          stepCount: null,
        });
        playSnakeSound();

        // Brief shocked jump before sliding
        setPawnStates((prev) => ({
          ...prev,
          [nextMove.teamId]: {
            tile: nextMove.landed,
            x: startCoord.x,
            y: startCoord.y,
            arcOffsetY: -14,
            scaleX: 0.85,
            scaleY: 1.2,
            shadowScale: 0.6,
            wobbleDeg: -10,
            facing: 'left',
            expression: 'shocked',
            stepCounter: null,
            isMoving: true,
          },
        }));
        await waitMs(160);

        const slideSteps = 10;
        const stepTime = Math.floor(GAME_RULES.PAWN_SNAKE_SLIDE_MS / slideSteps);
        for (let i = 1; i <= slideSteps; i++) {
          if (skipRequestedRef.current) break;
          const t = i / slideSteps;
          // Squiggly S-curve offset
          const squiggleX = Math.sin(t * Math.PI * 3) * 16;
          const curX = startCoord.x + (endCoord.x - startCoord.x) * t + squiggleX;
          const curY = startCoord.y + (endCoord.y - startCoord.y) * t;

          setPawnStates((prev) => ({
            ...prev,
            [nextMove.teamId]: {
              tile: nextMove.to,
              x: curX,
              y: curY,
              arcOffsetY: 0,
              scaleX: 1.06,
              scaleY: 0.94,
              shadowScale: 0.9,
              wobbleDeg: Math.sin(t * Math.PI * 4) * 14,
              facing: squiggleX >= 0 ? 'right' : 'left',
              expression: 'shocked',
              stepCounter: null,
              isMoving: true,
            },
          }));
          await waitMs(stepTime);
        }

        // Squash & Dizzy Stars at bottom of snake
        if (!skipRequestedRef.current) {
          spawnSparkle(endCoord.x, endCoord.y - 12, '#FF9AA2', 'dizzy');
          setPawnStates((prev) => ({
            ...prev,
            [nextMove.teamId]: {
              tile: nextMove.to,
              x: endCoord.x,
              y: endCoord.y,
              arcOffsetY: 2,
              scaleX: 1.3,
              scaleY: 0.72,
              shadowScale: 1.2,
              wobbleDeg: 0,
              facing: getRowDirection(nextMove.to, cols),
              expression: 'dizzy',
              stepCounter: null,
              isMoving: true,
            },
          }));
          await waitMs(380);
        }
        setActiveSnakeFrom(null);
      }
    }

    // 3. Finish line dance + confetti if kind === 'finish'
    if (!skipRequestedRef.current && (nextMove.kind === 'finish' || nextMove.to >= boardSize)) {
      const endCoord = centers[nextMove.to] || { x: 0, y: 0 };
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#F8C4DC', '#A8D4F5', '#FFE36E', '#A8E6CF', '#FF8FA3', '#C49BFF'],
        shapes: ['square'],
      });

      for (let d = 0; d < 3; d++) {
        if (skipRequestedRef.current) break;
        setPawnStates((prev) => ({
          ...prev,
          [nextMove.teamId]: {
            tile: nextMove.to,
            x: endCoord.x,
            y: endCoord.y,
            arcOffsetY: d % 2 === 0 ? -16 : 0,
            scaleX: d % 2 === 0 ? 0.9 : 1.15,
            scaleY: d % 2 === 0 ? 1.15 : 0.88,
            shadowScale: d % 2 === 0 ? 0.6 : 1.1,
            wobbleDeg: d % 2 === 0 ? 10 : -10,
            facing: d % 2 === 0 ? 'right' : 'left',
            expression: 'cheer',
            stepCounter: null,
            isMoving: true,
          },
        }));
        await waitMs(160);
      }
    }

    // Final settle at destination tile
    snapToFinal();
    isAnimatingRef.current = false;
    processNextMove();
  }, [boardSize, cols, onAnimationStatusChange, spawnSparkle, teams]);

  // Enqueue new `lastMove` when `lastMove.id` changes
  useEffect(() => {
    if (!lastMove || !lastMove.id) return;
    if (processedMoveIdsRef.current.has(lastMove.id)) return;

    processedMoveIdsRef.current.add(lastMove.id);
    moveQueueRef.current.push(lastMove);
    measureTiles();
    processNextMove();
  }, [lastMove, measureTiles, processNextMove]);

  // Allow Space key or clicking overlay to skip active animation
  const handleSkipAnimation = useCallback(() => {
    if (!isAnimatingRef.current) return;
    skipRequestedRef.current = true;
    moveQueueRef.current = [];
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isAnimatingRef.current) {
        e.preventDefault();
        handleSkipAnimation();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkipAnimation]);

  // Group idle pawns by tile so multiple pawns on the same tile arrange in a non-overlapping circle
  const getCircleOffset = (teamId: string, tileNum: number, isMoving: boolean) => {
    if (isMoving) return { dx: 0, dy: 0 };
    const peersOnTile = teams.filter((t) => {
      const st = pawnStates[t.id];
      const tTile = st ? st.tile : t.pawnPosition || 1;
      return tTile === tileNum && !st?.isMoving;
    });
    if (peersOnTile.length <= 1) return { dx: 0, dy: 0 };

    const idx = peersOnTile.findIndex((t) => t.id === teamId);
    const radius = peersOnTile.length === 2 ? 11 : 14;
    const angle = (2 * Math.PI * idx) / peersOnTile.length - Math.PI / 4;
    return {
      dx: Math.round(Math.cos(angle) * radius),
      dy: Math.round(Math.sin(angle) * radius),
    };
  };

  return (
    <div
      onClick={activeTeamId ? handleSkipAnimation : undefined}
      className={`absolute inset-0 z-20 ${
        activeTeamId ? 'cursor-pointer' : 'pointer-events-none'
      }`}
      title={activeTeamId ? 'Click or press Space to skip animation' : undefined}
    >
      {/* SVG Layer for Ladders and Snakes connecting tile centers */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {laddersAndSnakes.map((item, idx) => {
          const fromC = tileCenters[item.from];
          const toC = tileCenters[item.to];
          if (!fromC || !toC) return null;

          const isActiveLadder = item.type === 'ladder' && activeLadderFrom === item.from;
          const isActiveSnake = item.type === 'snake' && activeSnakeFrom === item.from;

          if (item.type === 'ladder') {
            const dx = toC.x - fromC.x;
            const dy = toC.y - fromC.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * 6;
            const ny = (dx / len) * 6;
            const rungs = 5;

            return (
              <g
                key={`ladder-${idx}`}
                opacity={isActiveLadder ? 1 : 0.45}
                className={isActiveLadder ? ' drop-shadow-[0_0_6px_#FFE36E]' : ''}
              >
                {/* Two rails */}
                <line
                  x1={fromC.x - nx}
                  y1={fromC.y - ny}
                  x2={toC.x - nx}
                  y2={toC.y - ny}
                  stroke={isActiveLadder ? '#FFE36E' : '#157F4B'}
                  strokeWidth={isActiveLadder ? 4 : 3}
                  strokeLinecap="square"
                />
                <line
                  x1={fromC.x + nx}
                  y1={fromC.y + ny}
                  x2={toC.x + nx}
                  y2={toC.y + ny}
                  stroke={isActiveLadder ? '#FFE36E' : '#157F4B'}
                  strokeWidth={isActiveLadder ? 4 : 3}
                  strokeLinecap="square"
                />
                {/* Rungs */}
                {Array.from({ length: rungs }).map((_, rIdx) => {
                  const t = (rIdx + 1) / (rungs + 1);
                  const rx = fromC.x + dx * t;
                  const ry = fromC.y + dy * t;
                  return (
                    <line
                      key={rIdx}
                      x1={rx - nx}
                      y1={ry - ny}
                      x2={rx + nx}
                      y2={ry + ny}
                      stroke={isActiveLadder ? '#4A3D8F' : '#157F4B'}
                      strokeWidth={2.5}
                    />
                  );
                })}
              </g>
            );
          }

          // Snake path with curve
          const midX = (fromC.x + toC.x) / 2 + 18;
          const midY = (fromC.y + toC.y) / 2;
          const pathD = `M ${fromC.x} ${fromC.y} Q ${midX} ${midY} ${toC.x} ${toC.y}`;

          return (
            <g key={`snake-${idx}`} opacity={isActiveSnake ? 1 : 0.42}>
              <path
                d={pathD}
                fill="none"
                stroke={isActiveSnake ? '#B91C47' : '#FF8FA3'}
                strokeWidth={isActiveSnake ? 6 : 4}
                strokeDasharray="6 4"
                strokeLinecap="square"
              />
              {/* Snake Head at `from` */}
              <rect
                x={fromC.x - 5}
                y={fromC.y - 5}
                width={10}
                height={10}
                fill="#FF8FA3"
                stroke="#B91C47"
                strokeWidth={2}
                className={isActiveSnake ? 'px-wiggle-exposed' : ''}
              />
            </g>
          );
        })}
      </svg>

      {/* Fading Pixel Footprints along the hop path */}
      <AnimatePresence>
        {footprints.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 0.85, scale: 1 }}
            animate={{ opacity: 0, scale: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: GAME_RULES.FOOTPRINT_FADE_MS / 1000 }}
            style={{
              left: fp.x - 6,
              top: fp.y - 4,
              backgroundColor: fp.color,
            }}
            className="absolute w-3 h-2 border border-white pointer-events-none"
          />
        ))}
      </AnimatePresence>

      {/* Landing Dust / Sparkles / Dizzy Stars */}
      <AnimatePresence>
        {sparkles.map((sp) => (
          <motion.div
            key={sp.id}
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, y: -12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ left: sp.x - 14, top: sp.y - 14 }}
            className="absolute pointer-events-none flex items-center justify-center w-7 h-7 font-bold text-xs text-[var(--color-px-ink-dark)]"
          >
            {sp.kind === 'dizzy' ? '💫★' : sp.kind === 'sparkle' ? '✨★' : '✦·✦'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Team Mascot Pawns */}
      {teams.map((team, idx) => {
        const palette = getTeamPalette(team, idx);
        const state = pawnStates[team.id];
        const logicalTile = Math.min(boardSize, Math.max(1, team.pawnPosition || 1));
        const fallbackCoord = tileCenters[logicalTile];
        if (!state && !fallbackCoord) return null;

        const tileNum = state ? state.tile : logicalTile;
        const baseX = state ? state.x : fallbackCoord.x;
        const baseY = state ? state.y : fallbackCoord.y;
        const isMoving = Boolean(state?.isMoving);
        const isActive = activeTeamId === team.id;

        const { dx, dy } = getCircleOffset(team.id, tileNum, isMoving);
        const finalX = baseX + dx;
        const finalY = baseY + dy;
        const arcOffsetY = state?.arcOffsetY || 0;
        const scaleX = state?.scaleX || 1;
        const scaleY = state?.scaleY || 1;
        const shadowScale = state?.shadowScale || 1;
        const wobbleDeg = state?.wobbleDeg || 0;
        const facing = state?.facing || 'right';
        const expression = state?.expression || 'normal';
        const stepCounter = state?.stepCounter ?? null;

        return (
          <motion.div
            key={team.id}
            animate={{
              x: finalX - 18,
              y: finalY - 22,
            }}
            transition={{
              type: 'tween',
              duration: isMoving ? 0.11 : 0.2,
              ease: 'easeOut',
            }}
            style={{
              zIndex: isActive || isMoving ? 40 : 25 + idx,
            }}
            className="absolute top-0 left-0 w-9 h-10 flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Floating Step Counter (1, 2, 3...) above active pawn */}
            <AnimatePresence>
              {stepCounter !== null && (
                <motion.div
                  key={`step-${stepCounter}`}
                  initial={{ opacity: 0, y: 4, scale: 0.7 }}
                  animate={{ opacity: 1, y: -6, scale: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    backgroundColor: '#FFE36E',
                    borderColor: '#4A3D8F',
                    fontFamily: 'var(--font-display)',
                  }}
                  className="absolute -top-6 px-1.5 py-0.2 border-2 text-[13px] font-bold text-[#4A3D8F] shadow-[2px_2px_0_#4A3D8F] whitespace-nowrap"
                >
                  {stepCounter}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dizzy Orbiting Stars */}
            {expression === 'dizzy' && (
              <div className="absolute -top-4 text-[13px] font-bold text-[#B91C47] animate-bounce">
                ★ ✦ ★
              </div>
            )}

            {/* Pixel Mascot Sprite with Arc Lift & Squash/Stretch */}
            <motion.div
              animate={{
                y: arcOffsetY,
                scaleX,
                scaleY,
                rotate: wobbleDeg,
              }}
              transition={{ duration: 0.09, ease: 'easeOut' }}
              className={!isMoving ? 'px-bob-idle' : ''}
            >
              <PixelPawnMascot
                fillHex={palette.hex}
                outlineHex={palette.outlineHex}
                expression={expression}
                facing={facing}
                size={32}
              />
            </motion.div>

            {/* Ground Shadow (shrinks mid-air) */}
            <motion.div
              animate={{
                scale: shadowScale,
                opacity: shadowScale < 0.8 ? 0.35 : 0.65,
              }}
              transition={{ duration: 0.09 }}
              className="w-6 h-1.5 bg-[#4A3D8F] -mt-1"
            />

            {/* Tiny Team Tag */}
            <span
              style={{
                backgroundColor: palette.hex,
                borderColor: palette.outlineHex,
              }}
              className="px-1 py-0 text-[13px] font-bold text-[#2A2350] border-2 leading-tight shadow-[1px_1px_0_#4A3D8F] -mt-0.5 max-w-[46px] truncate"
            >
              {team.name.slice(0, 4)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
