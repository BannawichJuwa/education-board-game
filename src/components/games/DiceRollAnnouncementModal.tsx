import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Team, SnakeLadderBoardItem } from '../../types';
import { DiceFace } from './DiceFace';
import { useLanguage } from '../../context/LanguageContext';
import { PixelIcon } from '../PixelIcon';
import { getTeamPalette } from '../../utils/storage';
import { GAME_RULES } from '../../config/gameRules';

export interface DiceRollResultInfo {
  team: Team;
  rolledValue: number;
  fromPosition: number;
  targetPosition: number;
  finalPosition: number;
  event?: SnakeLadderBoardItem;
  isWinner: boolean;
}

interface DiceRollAnnouncementModalProps {
  isOpen: boolean;
  isRolling: boolean;
  currentDisplayValue: number;
  activeRollTeam: Team | null;
  rollResult: DiceRollResultInfo | null;
  onConfirm: () => void;
}

export const DiceRollAnnouncementModal: React.FC<DiceRollAnnouncementModalProps> = ({
  isOpen,
  isRolling,
  currentDisplayValue,
  activeRollTeam,
  rollResult,
  onConfirm,
}) => {
  const { t, language } = useLanguage();

  // Auto close timer when roll completes so pawn animation plays on the board
  useEffect(() => {
    if (!isOpen || isRolling || !rollResult) return;
    const timer = window.setTimeout(() => {
      onConfirm();
    }, GAME_RULES.DICE_RESULT_AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, isRolling, rollResult, onConfirm]);

  // Also allow Space or Enter to confirm immediately
  useEffect(() => {
    if (!isOpen || isRolling || !rollResult) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isRolling, rollResult, onConfirm]);

  if (!isOpen) return null;

  const teamPalette = activeRollTeam ? getTeamPalette(activeRollTeam, 0) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 px-modal-overlay">
      <div className="px-window w-full max-w-md overflow-hidden">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="px-titlebar-title">
            <PixelIcon name="dice" size={16} />
            <span>dice_roller.exe — {activeRollTeam?.name || ''}</span>
          </div>
          <div className="px-titlebar-controls">
            {!isRolling && rollResult && (
              <button
                type="button"
                onClick={onConfirm}
                className="px-titlebar-btn px-titlebar-btn-close"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6 text-center space-y-5 bg-[var(--px-surface)] text-[var(--px-text)]">
          {/* Header / Team Banner */}
          <div className="space-y-2">
            {activeRollTeam && teamPalette && (
              <div
                style={{
                  backgroundColor: teamPalette.hex,
                  borderColor: teamPalette.outlineHex,
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1 border-3 text-xs font-bold text-[#2A2350] shadow-[3px_3px_0_var(--px-hard-shadow)]"
              >
                <PixelIcon name="check" size={14} />
                <span>
                  {language === 'en'
                    ? `Correct! ${activeRollTeam.name} rolls the dice`
                    : `ตอบถูก! ${activeRollTeam.name} ได้สิทธิ์ทอยลูกเต๋า`}
                </span>
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--px-text)] pt-1">
              {isRolling ? t('snakesRollingTitle') : t('snakesRolledResult')}
            </h3>
          </div>

          {/* Dice Animation Area */}
          <div className="flex flex-col items-center justify-center py-3 relative">
            <DiceFace
              value={currentDisplayValue}
              size="xl"
              isRolling={isRolling}
            />

            <div className="mt-4 min-h-[46px] flex items-center justify-center">
              {isRolling ? (
                <span className="px-badge bg-[var(--color-px-sky)] text-[#2A2350] animate-pulse text-sm">
                  {language === 'en' ? '🎲 Tumbling dice...' : '🎲 กำลังเขย่าลูกเต๋า...'}
                </span>
              ) : (
                <motion.div
                  initial={{ scale: 0.4, y: 12, opacity: 0 }}
                  animate={{ scale: [1.25, 0.94, 1], y: 0, opacity: 1 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-px-yellow)] text-[#2A2350] border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)]"
                >
                  <PixelIcon name="sparkle" size={16} />
                  <span className="text-sm font-bold text-[#2A2350]">
                    {t('snakesGotPoints')}
                  </span>
                  <span
                    className="px-2.5 py-0.5 bg-white border-2 border-[#2A2350] text-2xl font-bold text-[#2A2350] num"
                  >
                    +{currentDisplayValue}!
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Movement and Outcome Details (Shown when roll finishes) */}
          {!isRolling && rollResult && (
            <div className="space-y-3">
              {/* Movement step indicator */}
              <div className="px-panel-inset p-3 flex items-center justify-center gap-3 text-sm bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
                <div className="text-center">
                  <span className="text-[13px] text-[var(--px-text-muted)] font-bold block">{t('snakesFromTile')}</span>
                  <strong className="text-[var(--px-text)] font-bold text-base num">
                    #{rollResult.fromPosition}
                  </strong>
                </div>

                <div className="flex items-center gap-1 bg-[var(--color-px-yellow)] px-2.5 py-1 border-2 border-[var(--px-border)] text-xs font-bold text-[#2A2350]">
                  <span>{t('snakesWalkStep', { step: rollResult.rolledValue })}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>

                <div className="text-center">
                  <span className="text-[13px] text-[var(--px-text-muted)] font-bold block">{t('snakesToTile')}</span>
                  <strong className="text-[var(--px-text)] font-bold text-base num">
                    #{rollResult.targetPosition}
                  </strong>
                </div>
              </div>

              {/* Special Board Events (Ladder / Snake) */}
              {rollResult.event?.type === 'ladder' && (
                <div className="p-2.5 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] text-xs font-bold flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {t('snakesLadderClimbed', { from: rollResult.targetPosition, to: rollResult.finalPosition })}
                  </span>
                </div>
              )}

              {rollResult.event?.type === 'snake' && (
                <div className="p-2.5 bg-[var(--color-px-error)] border-2 border-[var(--px-border)] text-[#7A1D28] text-xs font-bold flex items-center justify-center gap-2">
                  <ArrowDownRight className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {t('snakesSnakeBitten', { from: rollResult.targetPosition, to: rollResult.finalPosition })}
                  </span>
                </div>
              )}

              {/* Confirm / Start Hop Animation Button */}
              <button
                type="button"
                onClick={onConfirm}
                className="w-full px-btn px-btn-mint py-3 px-4 text-sm flex items-center justify-center gap-2"
              >
                <PixelIcon name="play" size={16} />
                <span>{t('snakesConfirmMoveBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
