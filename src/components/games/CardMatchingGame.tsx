import React, { useState } from 'react';
import { CardMatchingState, Session } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCardDisplayLabel, getCardEmoji, getTeamPalette } from '../../utils/storage';
import { PixelIcon } from '../PixelIcon';
import { playCardFlipSound, playCorrectSound, playWrongSound } from '../../utils/audio';

interface CardMatchingGameProps {
  session: Session;
  cardMatchingState: CardMatchingState;
  onEvaluateMatch: (
    teamId: string,
    cardIndex1: number,
    cardIndex2: number,
    isMatch: boolean
  ) => void;
  selectedRespondingTeamId: string | null;
  viewMode?: 'split' | 'board_only';
}

export const CardMatchingGame: React.FC<CardMatchingGameProps> = ({
  session,
  cardMatchingState,
  onEvaluateMatch,
  selectedRespondingTeamId,
  viewMode = 'split',
}) => {
  const { t, language } = useLanguage();
  const [firstFlippedIndex, setFirstFlippedIndex] = useState<number | null>(null);
  const [secondFlippedIndex, setSecondFlippedIndex] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatingResult, setEvaluatingResult] = useState<{
    success: boolean;
    card1Name: string;
    card2Name: string;
    teamName: string;
  } | null>(null);

  const selectedTeam = session.teams.find((tItem) => tItem.id === selectedRespondingTeamId);
  const totalCards = cardMatchingState.boardCards.length;
  // Quick: 20 cards (4x5), Standard: 30 cards (5x6)
  const isQuickMode = totalCards <= 20;

  const handleCardClick = (index: number) => {
    if (isEvaluating || !selectedTeam) return;

    const card = cardMatchingState.boardCards[index];
    if (!card || card.isMatched) return;

    // Pick First Card
    if (firstFlippedIndex === null) {
      setFirstFlippedIndex(index);
      playCardFlipSound();
      return;
    }

    // Pick Second Card
    if (secondFlippedIndex === null) {
      if (index === firstFlippedIndex) return; // Cannot pick same card twice

      setSecondFlippedIndex(index);
      setIsEvaluating(true);
      playCardFlipSound();

      const card1 = cardMatchingState.boardCards[firstFlippedIndex];
      const card2 = card;
      const isMatch = card1.pairKey === card2.pairKey;
      const card1Name = `${getCardEmoji(card1.pairKey)} ${getCardDisplayLabel(card1, language)}`;
      const card2Name = `${getCardEmoji(card2.pairKey)} ${getCardDisplayLabel(card2, language)}`;

      // Brief reveal then sound
      setTimeout(() => {
        if (isMatch) {
          playCorrectSound();
          setEvaluatingResult({
            success: true,
            card1Name,
            card2Name,
            teamName: selectedTeam.name,
          });
        } else {
          playWrongSound();
          setEvaluatingResult({
            success: false,
            card1Name,
            card2Name,
            teamName: selectedTeam.name,
          });
        }

        // Display outcome clearly for 1.3s before committing to state
        setTimeout(() => {
          onEvaluateMatch(selectedTeam.id, firstFlippedIndex, index, isMatch);
          setFirstFlippedIndex(null);
          setSecondFlippedIndex(null);
          setIsEvaluating(false);
          setEvaluatingResult(null);
        }, 1300);
      }, 350);
    }
  };

  return (
    <div className="space-y-4">
      {/* Window Wrapper for Card Matching Stage */}
      <div className="px-window overflow-hidden">
        {/* Titlebar */}
        <div className="px-titlebar px-titlebar-pink">
          <div className="flex items-center gap-2 truncate">
            <PixelIcon name="cards" size={18} />
            <span className="truncate text-sm sm:text-base font-bold">
              card_match.exe — {language === 'en' ? 'Card Matching Memory Game' : 'เกมจับคู่ภาพความจำ'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs font-bold num">
              {cardMatchingState.matchedPairsCount || 0} / {cardMatchingState.totalPairs}{' '}
              {language === 'en' ? 'PAIRS' : 'คู่'}
            </span>
            <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] text-xs hidden sm:inline-flex font-bold num border border-[var(--px-border)]">
              {totalCards} {language === 'en' ? 'CARDS' : 'ใบ'}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-5 space-y-4 bg-[var(--px-surface)] text-[var(--px-text)]">
          {/* Active Turn Guidance Banner */}
          <div className="px-panel-inset p-3 sm:p-3.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {selectedTeam ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] flex items-center justify-center text-[#2A2350] flex-shrink-0 animate-px-pulse">
                  <PixelIcon name="sparkle" size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap">
                    <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-xs font-bold">
                      {selectedTeam.name}
                    </span>
                    <span className="text-[var(--px-text)] font-pixel">
                      {firstFlippedIndex === null
                        ? (language === 'en' ? '➔ Flip Card #1' : '➔ เลือกเปิดไพ่ใบที่ 1')
                        : secondFlippedIndex === null
                        ? (language === 'en' ? '➔ Flip Card #2' : '➔ เลือกเปิดไพ่ใบที่ 2')
                        : (language === 'en' ? '⏳ Evaluating...' : '⏳ กำลังตรวจสอบ...')}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--px-text-muted)] mt-0.5">
                    {language === 'en'
                      ? 'Team answered correctly! Click 2 cards to find a match (+20 pts bonus).'
                      : 'ตอบคำถามถูกต้อง! คลิกการ์ด 2 ใบเพื่อทดสอบการจับคู่ (คู่ละ +20 แต้มพิเศษ)'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--px-text-muted)]">
                <PixelIcon name="cursor" size={16} />
                <span>
                  {language === 'en'
                    ? '👈 Judge a team\'s answer as Correct first in the panel to award card-flipping turns!'
                    : '👈 กดตัดสินว่าทีมตอบคำถามถูกต้องในแผงควบคุม เพื่อมอบสิทธิ์เปิดการ์ด 2 ใบ'}
                </span>
              </div>
            )}

            {/* Result Toast Banner */}
            {evaluatingResult && (
              <div
                className={`px-3 py-1.5 border-2 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0_var(--px-hard-shadow)] animate-in fade-in ${
                  evaluatingResult.success
                    ? 'bg-[var(--color-px-mint)] text-[#2A2350] border-[#157F4B]'
                    : 'bg-[var(--color-px-error)] text-[#7A1D28] border-[#B91C47]'
                }`}
              >
                <PixelIcon name={evaluatingResult.success ? 'check' : 'close'} size={14} />
                <span>
                  {evaluatingResult.success
                    ? (language === 'en'
                        ? `Match! ${evaluatingResult.teamName} +20 pts!`
                        : `ภาพตรงกัน จับคู่สำเร็จ! ${evaluatingResult.teamName} ได้รับ +20 แต้ม!`)
                    : (language === 'en'
                        ? 'Mismatch! Cards flip back face-down.'
                        : 'ภาพไม่ตรงกัน! การ์ดจะพลิกกลับตามเดิม')}
                </span>
              </div>
            )}
          </div>

          {/* Cards Grid: Quick = 4x5 (20 cards), Standard = 5x6 (30 cards) */}
          <div
            className={`grid gap-2 sm:gap-2.5 ${
              isQuickMode
                ? 'grid-cols-4 sm:grid-cols-5'
                : 'grid-cols-5 sm:grid-cols-6'
            }`}
          >
            {cardMatchingState.boardCards.map((card, idx) => {
              const isFirst = firstFlippedIndex === idx;
              const isSecond = secondFlippedIndex === idx;
              const isFlipped = isFirst || isSecond;
              const isMatched = card.isMatched;
              const matchedTeam = session.teams.find((tItem) => tItem.id === card.matchedByTeamId);
              const matchedPalette = matchedTeam
                ? getTeamPalette(matchedTeam, session.teams.findIndex((t) => t.id === matchedTeam.id))
                : null;

              const isClickable = selectedTeam && !isMatched && !isFlipped && !isEvaluating;

              return (
                <button
                  key={card.id || `card-${idx}`}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-[4/5] min-h-[80px] sm:min-h-[105px] border-3 p-1.5 sm:p-2 flex flex-col items-center justify-between transition-all select-none relative group overflow-hidden ${
                    isMatched
                      ? 'border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] opacity-90 scale-[0.98]'
                      : isFlipped
                      ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350] shadow-[4px_4px_0_var(--px-hard-shadow)] -translate-y-1 ring-3 ring-[var(--color-accent-strong)]'
                      : isClickable
                      ? 'bg-[var(--px-surface-2)] hover:bg-[var(--px-surface-sunken)] border-[var(--px-border)] text-[var(--px-text)] shadow-[3px_3px_0_var(--px-hard-shadow)] hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-[var(--px-surface-sunken)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] opacity-60 cursor-not-allowed shadow-[1px_1px_0_var(--px-hard-shadow)]'
                  }`}
                  style={
                    isMatched && matchedPalette
                      ? {
                          backgroundColor: matchedPalette.hex,
                          borderColor: matchedPalette.outlineHex,
                          color: '#2A2350',
                        }
                      : undefined
                  }
                >
                  {/* Top Bar: Card Number & Match Badge */}
                  <div className="w-full flex items-center justify-between text-[11px] font-bold num pointer-events-none">
                    <span
                      className={`px-1 rounded-none border ${
                        isMatched
                          ? 'bg-black/30 text-white border-transparent'
                          : isFlipped
                          ? 'bg-[#2A2350] text-[#FFE36E] border-[#2A2350]'
                          : 'bg-[var(--px-surface)] text-[var(--px-text)] border-[var(--px-border)]'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    {isMatched && (
                      <span className="px-1 bg-black/40 text-white text-[10px] truncate max-w-[65px]">
                        {matchedTeam?.name || '✓'}
                      </span>
                    )}
                  </div>

                  {/* Card Center: Emoji Icon or Card Back Star */}
                  <div className="my-auto flex flex-col items-center justify-center pointer-events-none">
                    {isFlipped || isMatched ? (
                      <div className="text-center animate-in zoom-in-75">
                        <span className="text-2xl sm:text-3xl block leading-none filter drop-shadow">
                          {getCardEmoji(card.pairKey)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center opacity-70 group-hover:opacity-100 transition">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--px-surface)] border-2 border-[var(--px-border)] flex items-center justify-center text-[var(--px-text)] shadow-[1px_1px_0_var(--px-hard-shadow)]">
                          <PixelIcon name="star" size={14} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Label */}
                  <div className="w-full text-center pointer-events-none">
                    {isFlipped || isMatched ? (
                      <span className="font-bold text-[10px] sm:text-xs leading-tight line-clamp-1 truncate block font-pixel">
                        {getCardDisplayLabel(card, language)}
                      </span>
                    ) : (
                      <span className="font-pixel text-[10px] text-[var(--px-text-muted)] opacity-60 block">
                        ???
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
