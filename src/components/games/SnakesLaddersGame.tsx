import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Session, SnakesLaddersState, Team } from '../../types';
import { playDiceRollSound } from '../../utils/audio';
import { DiceFace } from './DiceFace';
import { DiceRollAnnouncementModal, DiceRollResultInfo } from './DiceRollAnnouncementModal';
import { PawnLayer, PixelPawnMascot } from './PawnLayer';
import { useLanguage } from '../../context/LanguageContext';
import { PixelIcon } from '../PixelIcon';
import { getTeamPalette } from '../../utils/storage';
import { GAME_RULES } from '../../config/gameRules';

interface SnakesLaddersGameProps {
  session: Session;
  snakesLaddersState: SnakesLaddersState;
  onPawnMove: (teamId: string, steps: number) => void;
  selectedRespondingTeamId: string | null;
  viewMode?: 'split' | 'board_only';
}

export const SnakesLaddersGame: React.FC<SnakesLaddersGameProps> = ({
  session,
  snakesLaddersState,
  onPawnMove,
  viewMode = 'split',
}) => {
  const { t, language } = useLanguage();
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplayDice, setCurrentDisplayDice] = useState<number>(
    snakesLaddersState.lastDiceRoll || 1
  );
  const [isRollModalOpen, setIsRollModalOpen] = useState(false);
  const [activeRollTeam, setActiveRollTeam] = useState<Team | null>(null);
  const [rollResult, setRollResult] = useState<DiceRollResultInfo | null>(null);

  const [animStatus, setAnimStatus] = useState<{
    animatingTeamId: string | null;
    pulsingTile: number | null;
    activeLadderFrom: number | null;
    activeSnakeFrom: number | null;
    stepCount: number | null;
  }>({
    animatingTeamId: null,
    pulsingTile: null,
    activeLadderFrom: null,
    activeSnakeFrom: null,
    stepCount: null,
  });

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const eligibleTeam = session.teams.find((tItem) => tItem.id === snakesLaddersState.eligibleRollTeamId);
  const boardSize = snakesLaddersState.boardSize || GAME_RULES.QUICK_SNAKES_BOARD_SIZE; // 30 or 36
  const cols = GAME_RULES.SNAKES_BOARD_COLS; // 6
  const rows = Math.ceil(boardSize / cols);
  const isSplit = viewMode === 'split';

  // Generate grid mapping (boustrophedon pattern: row 0 bottom left-to-right, row 1 right-to-left)
  const gridRows: number[][] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const rowNumbers: number[] = [];
    const isEvenFromBottom = r % 2 === 0;
    const startNum = r * cols + 1;

    for (let c = 0; c < cols; c++) {
      const num = isEvenFromBottom ? startNum + c : startNum + (cols - 1 - c);
      if (num <= boardSize) {
        rowNumbers.push(num);
      }
    }
    gridRows.push(rowNumbers);
  }

  const getLadderOrSnake = (tileNum: number) => {
    return (snakesLaddersState.laddersAndSnakes || []).find((item) => item.from === tileNum);
  };

  const handleRollDice = (targetTeam?: Team) => {
    const teamToRoll = targetTeam || eligibleTeam;
    if (
      !teamToRoll ||
      teamToRoll.id !== snakesLaddersState.eligibleRollTeamId ||
      isRolling ||
      animStatus.animatingTeamId === teamToRoll.id
    ) {
      return;
    }

    setActiveRollTeam(teamToRoll);
    setRollResult(null);
    setIsRollModalOpen(true);
    setIsRolling(true);
    playDiceRollSound();

    let rollCounter = 0;
    const stepMs = 55;
    const maxIterations = Math.max(8, Math.floor(GAME_RULES.DICE_TUMBLE_DURATION_MS / stepMs));
    const interval = window.setInterval(() => {
      const randomFace = Math.floor(Math.random() * 6) + 1;
      setCurrentDisplayDice(randomFace);
      rollCounter++;

      if (rollCounter >= maxIterations) {
        window.clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setCurrentDisplayDice(finalValue);
        setIsRolling(false);

        const fromPosition = teamToRoll.pawnPosition || 1;
        const targetPosition = Math.min(boardSize, fromPosition + finalValue);
        const event = getLadderOrSnake(targetPosition);
        const finalPosition = event ? event.to : targetPosition;
        const isWinner = finalPosition >= boardSize;

        setRollResult({
          team: teamToRoll,
          rolledValue: finalValue,
          fromPosition,
          targetPosition,
          finalPosition,
          event,
          isWinner,
        });
      }
    }, stepMs);
  };

  // Auto-pop up dice roll modal immediately when a team answers correctly
  useEffect(() => {
    if (
      snakesLaddersState.eligibleRollTeamId &&
      snakesLaddersState.rollTriggerTimestamp &&
      !isRolling &&
      !isRollModalOpen
    ) {
      const team = session.teams.find((tItem) => tItem.id === snakesLaddersState.eligibleRollTeamId);
      if (team) {
        handleRollDice(team);
      }
    }
  }, [snakesLaddersState.rollTriggerTimestamp, snakesLaddersState.eligibleRollTeamId]);

  // Instant logical state update (NFR-02): PawnLayer animates visually when `lastMove.id` updates
  const handleConfirmPawnMove = () => {
    if (!rollResult || !activeRollTeam) return;
    const { rolledValue } = rollResult;
    const movingTeam = activeRollTeam;

    setIsRollModalOpen(false);
    setRollResult(null);
    setActiveRollTeam(null);

    // Commit move immediately to state; PawnLayer handles the hop-by-hop / ladder / snake visual animation
    onPawnMove(movingTeam.id, rolledValue);
  };

  const animatingTeam = animStatus.animatingTeamId
    ? session.teams.find((tItem) => tItem.id === animStatus.animatingTeamId)
    : null;

  return (
    <div className="space-y-4">
      {/* Game Header: Status Notice & Dice Trigger */}
      <div className="px-window p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-px-yellow)] text-[#2A2350] border-3 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-center justify-center flex-shrink-0">
            <PixelIcon name="dice" size={22} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--px-text)] flex items-center gap-2">
              <span>{t('snakesBoardTitle', { size: boardSize })}</span>
              <span className="px-badge bg-[var(--color-px-sky)] text-[#2A2350] num">
                {language === 'en' ? `Tile 1 ➔ ${boardSize}` : `ช่อง 1 ➔ ${boardSize}`}
              </span>
            </h2>
            <p className="text-xs text-[var(--px-text-muted)] font-bold leading-normal">
              {t('snakesTeacherRuleNotice')}
            </p>
          </div>
        </div>

        {/* Dice Control Box */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {eligibleTeam ? (
            <div className="flex items-center gap-2.5 bg-[var(--color-px-mint)] text-[#2A2350] p-2 border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)]">
              <div className="flex items-center gap-2 pl-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[13px] text-[#2A2350] font-bold uppercase">
                    <PixelIcon name="check" size={11} />
                    <span>{language === 'en' ? 'Correct!' : 'ตอบถูก!'}</span>
                  </div>
                  <span className="text-xs font-bold text-[#2A2350] truncate max-w-[100px] block">
                    {eligibleTeam.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isRolling || animStatus.animatingTeamId === eligibleTeam.id}
                onClick={() => handleRollDice(eligibleTeam)}
                className="px-btn px-3.5 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 flex-shrink-0"
              >
                <PixelIcon name="dice" size={16} />
                <span>{isRolling ? t('snakesRollingTitle') : (language === 'en' ? 'Roll Dice!' : 'ทอยลูกเต๋า!')}</span>
              </button>

              <div title={`Dice value: ${currentDisplayDice}`} className="flex-shrink-0">
                <DiceFace value={currentDisplayDice} size="sm" isRolling={isRolling} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[var(--px-surface-sunken)] py-2 px-3 border-2 border-[var(--px-border-muted)] text-xs text-[var(--px-text)]">
              <div className="w-7 h-7 bg-[var(--px-surface)] border-2 border-[var(--px-border)] flex items-center justify-center flex-shrink-0">
                <PixelIcon name="lock" size={14} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-[var(--px-text)]">
                  {language === 'en' ? 'Dice Locked' : 'ลูกเต๋าถูกล็อก'}
                </p>
                <p className="text-[13px] text-[var(--px-text-muted)] font-bold">
                  {language === 'en' ? 'Answer correctly to roll' : 'ตอบถูกเพื่อรับสิทธิ์ทอย'}
                </p>
              </div>
              <div className="opacity-65 pointer-events-none pl-1">
                <DiceFace value={currentDisplayDice} size="sm" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Pawn Hopping / Skip Notice Banner */}
      {animatingTeam && (
        <div className="px-window bg-[var(--color-px-yellow)] text-[#2A2350] px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#2A2350]">
            <PixelIcon name="sparkle" size={16} />
            <span>
              {animStatus.activeLadderFrom
                ? (language === 'en'
                    ? `🪜 ${animatingTeam.name} is climbing the ladder!`
                    : `🪜 ${animatingTeam.name} กำลังปีนบันไดขึ้นทางลัด!`)
                : animStatus.activeSnakeFrom
                ? (language === 'en'
                    ? `🐍 Oh no! ${animatingTeam.name} is sliding down a snake!`
                    : `🐍 โอ๊ะโอ! ${animatingTeam.name} กำลังลื่นลงตามตัวงู!`)
                : (language === 'en'
                    ? `🐾 ${animatingTeam.name} hopping...${animStatus.stepCount ? ` (Step ${animStatus.stepCount})` : ''}`
                    : `🐾 ${animatingTeam.name} กำลังกระโดดเดินหมาก...${animStatus.stepCount ? ` (ก้าวที่ ${animStatus.stepCount})` : ''}`)}
            </span>
          </div>
          <span className="px-badge bg-[var(--px-surface)] text-[var(--px-text)] text-[13px]">
            {t('snakesSkipAnimHint')}
          </span>
        </div>
      )}

      {/* Main Board Layout */}
      <div className={`grid ${isSplit ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-4`}>
        {/* Snakes & Ladders Board Window */}
        <div className={`${isSplit ? 'w-full' : 'lg:col-span-3'} px-window overflow-hidden`}>
          <div className="px-titlebar">
            <div className="px-titlebar-title">
              <PixelIcon name="snake" size={16} />
              <span>board_map_{boardSize}.exe</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-[13px]">
                🪜 {language === 'en' ? 'Ladder' : 'บันได'}
              </span>
              <span className="px-badge bg-[var(--color-px-pink)] text-[#2A2350] text-[13px]">
                🐍 {language === 'en' ? 'Snake' : 'งู'}
              </span>
            </div>
          </div>

          <div
            ref={boardContainerRef}
            className="p-3 sm:p-4 md:p-5 bg-[var(--px-surface)] relative"
          >
            <div className="space-y-1.5 sm:space-y-2 relative z-10">
              {gridRows.map((rowTiles, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {rowTiles.map((tileNum) => {
                    const event = getLadderOrSnake(tileNum);
                    const isLadder = event?.type === 'ladder';
                    const isSnake = event?.type === 'snake';
                    const isFinish = tileNum === boardSize;
                    const isStart = tileNum === 1;
                    const isPulsing = animStatus.pulsingTile === tileNum;
                    const isGlowingLadder = animStatus.activeLadderFrom === tileNum;
                    const isWigglingSnake = animStatus.activeSnakeFrom === tileNum;

                    return (
                      <div
                        key={tileNum}
                        ref={(el) => {
                          tileRefs.current[tileNum] = el;
                        }}
                        title={
                          isFinish
                            ? (language === 'en' ? 'Finish Line 🏁' : 'เส้นชัยชนะเกม 🏁')
                            : isStart
                            ? (language === 'en' ? 'Start Point 🚀' : 'จุดเริ่มต้น 🚀')
                            : isLadder
                            ? (language === 'en' ? `Ladder: Climb to Tile ${event?.to}` : `บันได: ปีนขึ้นช่อง ${event?.to}`)
                            : isSnake
                            ? (language === 'en' ? `Snake: Slide down to Tile ${event?.to}` : `งูพิษ: เลื่อนลงช่อง ${event?.to}`)
                            : (language === 'en' ? `Tile ${tileNum}` : `ช่องที่ ${tileNum}`)
                        }
                        className={`aspect-square min-h-[64px] sm:min-h-[76px] p-1 sm:p-1.5 flex flex-col justify-between relative border-3 transition-colors ${
                          isPulsing
                            ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] scale-[1.03]'
                            : isFinish
                            ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                            : isLadder
                            ? `bg-[#E2FAEE] text-[#0E5832] border-[#157F4B] ${isGlowingLadder ? 'ring-4 ring-[var(--color-px-yellow)]' : ''}`
                            : isSnake
                            ? `bg-[#FFE5E8] text-[#7A1D28] border-[#B91C47] ${isWigglingSnake ? 'px-wiggle-exposed' : ''}`
                            : tileNum % 2 === 0
                            ? 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)]'
                            : 'bg-[var(--px-surface-sunken)] text-[var(--px-text)] border-[var(--px-border)]'
                        }`}
                      >
                        {/* Tile Number and Badges */}
                        <div className="flex items-center justify-between pointer-events-none">
                          <span
                            className={`text-[13px] sm:text-xs font-bold px-1 border num ${
                              isFinish
                                ? 'bg-[var(--color-px-pink)] text-[#2A2350] border-[var(--px-border)]'
                                : isLadder
                                ? 'bg-white text-[#0E5832] border-[#157F4B]'
                                : isSnake
                                ? 'bg-white text-[#7A1D28] border-[#B91C47]'
                                : 'bg-[var(--px-surface)] text-[var(--px-text)] border-[var(--px-border)]'
                            }`}
                          >
                            {tileNum}
                          </span>

                          {isLadder && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[13px] sm:text-[13px] font-bold text-[#0E5832] bg-white px-1 border border-[#157F4B] num"
                            >
                              <ArrowUpRight className="w-2.5 h-2.5" />
                              <span>{event.to}</span>
                            </span>
                          )}

                          {isSnake && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[13px] sm:text-[13px] font-bold text-[#7A1D28] bg-white px-1 border border-[#B91C47] num"
                            >
                              <ArrowDownRight className="w-2.5 h-2.5" />
                              <span>{event.to}</span>
                            </span>
                          )}

                          {isFinish && (
                            <PixelIcon name="trophy" size={14} />
                          )}
                        </div>

                        {/* Middle icon / label */}
                        <div className="text-center my-auto px-0.5 pointer-events-none">
                          {isStart && (
                            <span className="text-[13px] sm:text-[13px] font-bold text-[var(--px-text)] uppercase block">
                              {language === 'en' ? 'START 🚀' : 'เริ่ม 🚀'}
                            </span>
                          )}
                          {isFinish && (
                            <span className="text-[13px] sm:text-[13px] font-bold text-[#2A2350] uppercase block">
                              {language === 'en' ? 'GOAL 🏁' : 'เส้นชัย 🏁'}
                            </span>
                          )}
                          {isLadder && (
                            <span className="inline-flex items-center justify-center gap-0.5 text-[13px] sm:text-[13px] text-[#0E5832] font-bold">
                              <PixelIcon name="ladder" size={12} />
                              <span className="hidden sm:inline">{language === 'en' ? 'UP' : 'ขึ้น'}</span>
                            </span>
                          )}
                          {isSnake && (
                            <span className="inline-flex items-center justify-center gap-0.5 text-[13px] sm:text-[13px] text-[#7A1D28] font-bold">
                              <PixelIcon name="snake" size={12} />
                              <span className="hidden sm:inline">{language === 'en' ? 'SLIDE' : 'งู'}</span>
                            </span>
                          )}
                        </div>

                        {/* Spacer for PawnLayer overlay */}
                        <div className="h-4 sm:h-5" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Animated Pawn Overlay Layer */}
            <PawnLayer
              teams={session.teams}
              boardSize={boardSize}
              cols={cols}
              laddersAndSnakes={snakesLaddersState.laddersAndSnakes || []}
              lastMove={snakesLaddersState.lastMove}
              tileRefs={tileRefs}
              boardContainerRef={boardContainerRef}
              onAnimationStatusChange={setAnimStatus}
            />
          </div>
        </div>

        {/* Side Panel: Team Mascots Progress & Legend */}
        <div className={`${isSplit ? 'w-full' : 'lg:col-span-1'} space-y-4`}>
          <div className="px-window p-4 space-y-3">
            <h3 className="font-bold text-[var(--px-text)] text-xs sm:text-sm flex items-center gap-2">
              <PixelIcon name="smiley" size={16} />
              <span>{language === 'en' ? 'Team Mascot Positions' : 'ตำแหน่งหมากมาสคอตแต่ละกลุ่ม'}</span>
            </h3>

            <div className={`grid ${isSplit ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'} gap-2.5`}>
              {session.teams.map((team, idx) => {
                const pos = team.pawnPosition || 1;
                const percent = Math.min(100, Math.round((pos / boardSize) * 100));
                const palette = getTeamPalette(team, idx);
                const isTeamMoving = animStatus.animatingTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className="p-2.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <PixelPawnMascot
                          fillHex={palette.hex}
                          outlineHex={palette.outlineHex}
                          expression={isTeamMoving ? 'happy' : 'normal'}
                          facing="right"
                          size={20}
                        />
                        <span className="font-bold text-[var(--px-text)] text-xs truncate">
                          {team.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold text-[var(--px-text)] flex-shrink-0 num"
                      >
                        #{pos}/{boardSize}
                      </span>
                    </div>

                    {/* Pixel Progress Bar */}
                    <div className="px-progress h-2.5">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: palette.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isSplit && (
            <div className="px-window p-4 text-xs text-[var(--px-text)] space-y-2">
              <span className="font-bold block">{language === 'en' ? 'Map Highlights:' : 'ข้อมูลเส้นทางลัด:'}</span>
              <div className="space-y-1.5 text-[13px] font-bold">
                <div className="flex items-center gap-2 text-[#0E5832]">
                  <PixelIcon name="ladder" size={14} />
                  <span>{language === 'en' ? 'Ladders: Climb up to shortcut tile' : 'บันได: ปีนขึ้นสู่ช่องทางลัดทันที'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#7A1D28]">
                  <PixelIcon name="snake" size={14} />
                  <span>{language === 'en' ? 'Snakes: Slide down backward' : 'งูพิษ: เลื่อนถอยหลังลงมาที่หางงู'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Dice Roll Announcement Modal */}
      {isRollModalOpen && activeRollTeam && (
        <DiceRollAnnouncementModal
          isOpen={isRollModalOpen}
          activeRollTeam={activeRollTeam}
          isRolling={isRolling}
          currentDisplayValue={currentDisplayDice}
          rollResult={rollResult}
          onConfirm={handleConfirmPawnMove}
        />
      )}
    </div>
  );
};
