import React, { useState } from 'react';
import { BingoState, Session } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  getBingoTileDisplayLabel,
  getTeamPalette,
  getTerritoryStats,
  rankTeamsByBingoTerritory,
} from '../../utils/storage';
import { PixelIcon } from '../PixelIcon';

interface BingoGameProps {
  session: Session;
  bingoState: BingoState;
  onClaimTile: (tileIndex: number, teamId: string) => void;
  selectedRespondingTeamId: string | null;
  viewMode?: 'split' | 'board_only';
}

export const BingoGame: React.FC<BingoGameProps> = ({
  session,
  bingoState,
  onClaimTile,
  selectedRespondingTeamId,
  viewMode = 'split',
}) => {
  const { t, language } = useLanguage();
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  const eligibleTeamIdx = session.teams.findIndex(
    (item) => item.id === bingoState.eligibleClaimTeamId
  );
  const eligibleTeam =
    eligibleTeamIdx >= 0 ? session.teams[eligibleTeamIdx] : undefined;
  const eligiblePalette = eligibleTeam
    ? getTeamPalette(eligibleTeam, eligibleTeamIdx)
    : undefined;

  const respondingTeam = session.teams.find(
    (item) => item.id === selectedRespondingTeamId
  );

  const gridSize = bingoState.gridSize; // 4 or 5
  const totalTiles = gridSize * gridSize;
  const isSplit = viewMode === 'split';
  const isTerritoryMode = Boolean(bingoState.territoryMode);

  // Compute Territory & Line stats per team
  const territoryStats = getTerritoryStats(bingoState, session.teams);
  const unclaimedCount = bingoState.tiles.filter((tile) => !tile.claimedByTeamId).length;

  // Determine current territory leader (only if at least 1 tile is claimed)
  const territoryRanked = rankTeamsByBingoTerritory(bingoState, session.teams);
  const territoryLeaderId =
    territoryRanked[0] && (territoryStats[territoryRanked[0].id]?.tilesHeld || 0) > 0
      ? territoryRanked[0].id
      : null;

  return (
    <div className="space-y-4">
      {/* Territory Mode Alert Banner */}
      {isTerritoryMode && (
        <div className="px-window bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] border-3 border-[var(--px-border)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-px-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-px-pink,#FF8FA3)] text-[#2A2350] border-2 border-[var(--px-border)] shadow-[2px_2px_0px_var(--px-hard-shadow)] flex items-center justify-center flex-shrink-0">
              <PixelIcon name="trophy" size={22} />
            </div>
            <div>
              <h3 className="font-pixel font-bold text-sm sm:text-base text-[#2A2350]">
                {t('bingoTerritoryBannerTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[#2A2350] font-medium">
                {t('bingoTerritoryBannerDesc')}
              </p>
            </div>
          </div>
          <span className="px-badge bg-[var(--px-surface)] text-[var(--px-text)] text-xs flex-shrink-0">
            TERRITORY MODE ACTIVE
          </span>
        </div>
      )}

      {/* Main Window for Bingo Board */}
      <div className="px-window overflow-hidden">
        <div className="px-titlebar">
          <div className="flex items-center gap-2 truncate">
            <PixelIcon name="grid" size={18} />
            <span className="truncate text-sm sm:text-base">
              bingo_grid.exe — {t('bingoBoardTitle', { size: gridSize })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs">
              {isTerritoryMode
                ? language === 'en'
                  ? 'MOST TILES WINS!'
                  : 'ยึดช่องมากสุดชนะ!'
                : t('bingoGoalNotice')}
            </span>
            <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] text-xs hidden sm:inline-flex num">
              {t('bingoUnclaimedCount', { count: unclaimedCount })}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-5 space-y-4">
          {/* Segmented Territory Bar in Team Colors */}
          <div className="px-panel-inset p-3 space-y-2 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-pixel">
              <span className="font-bold text-[var(--px-text)] flex items-center gap-1.5">
                <PixelIcon name="star" size={14} />
                <span>
                  {language === 'en'
                    ? 'Live Territory Map Control'
                    : 'สัดส่วนการยึดพื้นที่บนกระดาน (Territory Bar)'}
                </span>
              </span>
              <span className="text-[var(--px-text-muted)] font-bold num">
                {t('bingoUnclaimedCount', { count: unclaimedCount })} / {totalTiles}
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-6 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] p-0.5 flex gap-0.5 overflow-hidden">
              {session.teams.map((team, idx) => {
                const stat = territoryStats[team.id];
                const held = stat?.tilesHeld || 0;
                if (held === 0) return null;
                const widthPct = (held / totalTiles) * 100;
                const palette = getTeamPalette(team, idx);
                return (
                  <div
                    key={team.id}
                    onMouseEnter={() => setHoveredTeamId(team.id)}
                    onMouseLeave={() => setHoveredTeamId(null)}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: palette.hex,
                      borderColor: palette.outlineHex,
                      color: palette.textHex,
                    }}
                    className="h-full border flex items-center justify-center font-pixel text-[13px] font-bold truncate px-1 transition-all num"
                    title={`${team.name}: ${held} tiles (${Math.round(widthPct)}%)`}
                  >
                    {held}
                  </div>
                );
              })}
              {unclaimedCount > 0 && (
                <div
                  style={{ width: `${(unclaimedCount / totalTiles) * 100}%` }}
                  className="h-full bg-[var(--px-surface-sunken)] flex items-center justify-center font-pixel text-[13px] text-[var(--px-text-muted)] truncate num"
                >
                  {unclaimedCount}
                </div>
              )}
            </div>
          </div>

          {/* Active Claim Status Banner */}
          {eligibleTeam && eligiblePalette ? (
            <div
              className="p-3 border-3 flex items-center justify-between gap-3 shadow-[4px_4px_0px_var(--px-hard-shadow)]"
              style={{
                backgroundColor: eligiblePalette.lightHex,
                borderColor: eligiblePalette.outlineHex,
                color: '#2A2350',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PixelIcon name="sparkle" size={20} />
                <div className="min-w-0">
                  <div className="font-pixel text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
                    <span>
                      {t('bingoAnsweredCanClaim')} {eligibleTeam.name}
                    </span>
                  </div>
                  <p className="text-xs truncate">
                    {language === 'en'
                      ? 'Click any unclaimed tile below to claim it for your team!'
                      : 'คลิกเลือกช่องว่างด้านล่างเพื่อยึดพื้นที่ให้ทีมของคุณ!'}
                  </p>
                </div>
              </div>
              <span
                className="px-badge text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: eligiblePalette.hex,
                  borderColor: eligiblePalette.outlineHex,
                  color: eligiblePalette.textHex,
                }}
              >
                1 TILE CLAIM
              </span>
            </div>
          ) : respondingTeam ? (
            <div className="p-2.5 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2A2350]">
              <PixelIcon name="smiley" size={16} />
              <span>
                {respondingTeam.name}{' '}
                {language === 'en'
                  ? 'is answering... Mark Correct to unlock tile claim!'
                  : 'กำลังตอบคำถาม... กด "ตอบถูกต้อง" เพื่อปลดล็อกสิทธิ์ยึดช่อง!'}
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border-muted)] flex items-center gap-2 text-xs text-[var(--px-text-muted)]">
              <PixelIcon name="lock" size={16} />
              <span>{t('bingoLockedNotice')}</span>
            </div>
          )}

          {/* Bingo Grid Container */}
          <div
            className="grid gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {bingoState.tiles.map((tile, idx) => {
              const claimedTeamIdx = session.teams.findIndex(
                (item) => item.id === tile.claimedByTeamId
              );
              const claimedTeam =
                claimedTeamIdx >= 0 ? session.teams[claimedTeamIdx] : undefined;
              const claimedPalette = claimedTeam
                ? getTeamPalette(claimedTeam, claimedTeamIdx)
                : undefined;

              const isClaimed = Boolean(claimedTeam);
              const canClaim = !isClaimed && Boolean(eligibleTeam);
              const isHighlightedTeam =
                hoveredTeamId && tile.claimedByTeamId === hoveredTeamId;
              const isDimmedTeam =
                hoveredTeamId && tile.claimedByTeamId && tile.claimedByTeamId !== hoveredTeamId;
              const isLeaderTileInTerritory =
                isTerritoryMode &&
                territoryLeaderId &&
                tile.claimedByTeamId === territoryLeaderId;

              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={!canClaim}
                  onClick={() => canClaim && eligibleTeam && onClaimTile(idx, eligibleTeam.id)}
                  style={
                    isClaimed && claimedPalette
                      ? {
                          backgroundColor: claimedPalette.hex,
                          borderColor: claimedPalette.outlineHex,
                          color: claimedPalette.textHex,
                        }
                      : undefined
                  }
                  className={`aspect-square min-h-[72px] sm:min-h-[86px] p-1.5 sm:p-2 flex flex-col items-center justify-between text-center relative border-3 transition-transform ${
                    isClaimed
                      ? `shadow-[3px_3px_0px_var(--px-hard-shadow)] ${
                          isHighlightedTeam
                            ? 'ring-4 ring-[var(--color-px-yellow)] -translate-y-1 z-10'
                            : isDimmedTeam
                            ? 'opacity-45'
                            : isLeaderTileInTerritory
                            ? 'animate-px-pulse'
                            : ''
                        }`
                      : canClaim
                      ? 'bg-[var(--px-surface)] hover:bg-[var(--color-px-yellow)] text-[var(--px-text)] border-[var(--px-border)] shadow-[4px_4px_0px_var(--px-hard-shadow)] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                      : 'bg-[var(--px-surface-sunken)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] shadow-[2px_2px_0px_var(--px-hard-shadow)] cursor-not-allowed opacity-85'
                  }`}
                >
                  {/* Tile Top: Number and Status Icon */}
                  <div className="w-full flex items-center justify-between pointer-events-none">
                    <span
                      className={`text-[13px] sm:text-xs font-pixel font-bold px-1.5 py-0.5 border border-[var(--px-border)] num ${
                        isClaimed
                          ? 'bg-[var(--px-surface-2)] text-[var(--px-text)]'
                          : canClaim
                          ? 'bg-[var(--color-px-mint)] text-[#2A2350]'
                          : 'bg-[var(--px-surface-sunken)] text-[var(--px-text-muted)]'
                      }`}
                    >
                      #{tile.id}
                    </span>
                    {isClaimed ? (
                      <PixelIcon
                        name={isLeaderTileInTerritory ? 'trophy' : 'check'}
                        size={14}
                      />
                    ) : !canClaim ? (
                      <PixelIcon name="lock" size={12} />
                    ) : (
                      <PixelIcon name="cursor" size={14} />
                    )}
                  </div>

                  {/* Tile Middle: Text label */}
                  <div className="my-auto px-0.5 w-full flex items-center justify-center pointer-events-none">
                    <span className={`font-bold text-xs sm:text-sm leading-tight break-words line-clamp-2 text-center ${
                      isClaimed ? 'text-[#2A2350]' : 'text-[var(--px-text)]'
                    }`}>
                      {getBingoTileDisplayLabel(tile, language)}
                    </span>
                  </div>

                  {/* Tile Bottom: Claimed team or action */}
                  <div className="w-full pointer-events-none">
                    {isClaimed && claimedTeam ? (
                      <div className="text-[13px] font-pixel font-bold truncate bg-[var(--px-surface-2)] border border-[var(--px-border)] py-0.5 px-1 text-[var(--px-text)]">
                        {claimedTeam.name}
                      </div>
                    ) : canClaim ? (
                      <div className="text-[13px] font-pixel font-bold text-[#2A2350] bg-[var(--color-px-mint)] border border-[var(--px-border)] py-0.5 px-1 truncate">
                        {t('bingoClaimTileAction')}
                      </div>
                    ) : (
                      <div className="text-[13px] font-pixel text-[var(--px-text-muted)] truncate">
                        {t('bingoMustAnswerCorrect')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Standings & Territory Stats Window */}
      <div className="px-window p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-pixel font-bold text-[var(--px-text)] text-sm sm:text-base flex items-center gap-2">
            <PixelIcon name="trophy" size={18} />
            <span>{t('bingoProgressTitle')}</span>
          </h3>
          <span className="text-xs text-[var(--px-text-muted)] font-medium">
            {t('bingoHoverHint')}
          </span>
        </div>

        <div
          className={`grid ${
            isSplit ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          } gap-2.5`}
        >
          {session.teams.map((team, idx) => {
            const palette = getTeamPalette(team, idx);
            const stat = territoryStats[team.id] || {
              teamId: team.id,
              tilesHeld: 0,
              largestConnectedRegion: 0,
              territoryScore: 0,
              completedLines: 0,
              possibleLines: 0,
              isAlive: true,
            };
            const isBingo = stat.completedLines >= (bingoState.winningLinesNeeded || 1);
            const isLeader = isTerritoryMode && territoryLeaderId === team.id;

            return (
              <div
                key={team.id}
                onMouseEnter={() => setHoveredTeamId(team.id)}
                onMouseLeave={() => setHoveredTeamId(null)}
                className={`p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0px_var(--px-hard-shadow)] space-y-2 transition-transform cursor-pointer text-[var(--px-text)] ${
                  hoveredTeamId === team.id ? '-translate-y-0.5 ring-2 ring-[var(--color-px-yellow)]' : ''
                } ${isLeader ? 'bg-[var(--px-surface)]' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-3.5 h-3.5 border-2 flex-shrink-0"
                      style={{
                        backgroundColor: palette.hex,
                        borderColor: palette.outlineHex,
                      }}
                    />
                    <span className="font-bold text-xs sm:text-sm text-[var(--px-text)] truncate">
                      {team.name}
                    </span>
                    {isLeader && (
                      <span className="px-1.5 py-0.5 bg-[var(--color-px-yellow)] text-[#2A2350] border border-[var(--px-border)] font-pixel text-[13px] font-bold">
                        ★ #1
                      </span>
                    )}
                  </div>
                  <span className="font-pixel text-xs font-bold px-2 py-0.5 bg-[var(--px-surface-sunken)] text-[var(--px-text)] border border-[var(--px-border)] num">
                    {team.score} {t('pointsUnit')}
                  </span>
                </div>

                {/* Line Alive / Blocked Badge + Territory Stats */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--px-border-muted)] text-xs font-pixel">
                  <span className="px-1.5 py-0.5 bg-[var(--color-px-sky)] text-[#2A2350] border border-[var(--px-border)] font-bold num">
                    {t('bingoTilesHeld', { count: stat.tilesHeld })}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--px-surface-sunken)] text-[var(--px-text)] border border-[var(--px-border)] num">
                    {t('bingoLargestRegion', { size: stat.largestConnectedRegion })}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--color-px-yellow)] text-[#2A2350] border border-[var(--px-border)] num">
                    {t('bingoTerritoryPts', { pts: stat.territoryScore })}
                  </span>

                  {isBingo ? (
                    <span className="px-2 py-0.5 bg-[var(--color-px-yellow)] text-[#2A2350] border-2 border-[var(--px-border)] font-bold animate-px-bob">
                      BINGO! 🎉
                    </span>
                  ) : stat.isAlive ? (
                    <span className="px-1.5 py-0.5 bg-[var(--color-px-mint)] border border-[var(--px-border)] text-[#2A2350] font-bold num">
                      ✓ {t('bingoLinePossible')} ({stat.possibleLines})
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-[var(--color-px-error)] border border-[var(--px-border)] text-[#7A1D28] font-bold">
                      ✗ {t('bingoLineBlocked')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
