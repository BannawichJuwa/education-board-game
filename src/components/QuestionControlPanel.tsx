import React, { useState } from 'react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getTeamPalette } from '../utils/storage';
import { PixelIcon } from './PixelIcon';

interface QuestionControlPanelProps {
  session: Session;
  selectedRespondingTeamId: string | null;
  onSelectRespondingTeam: (teamId: string | null) => void;
  onCorrectAnswer: (teamId: string) => void;
  onWrongAnswer: (teamId: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onSelectQuestion: (questionId: string) => void;
  onOpenFullscreenModal: () => void;
  onRequestFinishGame: () => void;
  isGameEvaluating?: boolean;
  isScoringLocked?: boolean;
}

export const QuestionControlPanel: React.FC<QuestionControlPanelProps> = ({
  session,
  selectedRespondingTeamId,
  onSelectRespondingTeam,
  onCorrectAnswer,
  onWrongAnswer,
  onNextQuestion,
  onPrevQuestion,
  onSelectQuestion,
  onOpenFullscreenModal,
  onRequestFinishGame,
  isGameEvaluating = false,
  isScoringLocked = false,
}) => {
  const { t, language } = useLanguage();
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = session.questions;
  const activeQuestion =
    questions.find((q) => q.id === session.activeQuestionId) || questions[0];
  const activeIndex = questions.findIndex((q) => q.id === activeQuestion?.id);
  const selectedTeam = session.teams.find(
    (tItem) => tItem.id === selectedRespondingTeamId
  );

  // Check if active question is already answered & awarded points
  const isQuestionAwarded = activeQuestion
    ? Boolean(
        session.usedQuestionIds?.includes(activeQuestion.id) ||
          session.awardedQuestionIds?.includes(activeQuestion.id)
      )
    : false;

  // Next question that has not been scored yet (forward first, then from the start).
  const isAwarded = (id: string) =>
    Boolean(session.usedQuestionIds?.includes(id) || session.awardedQuestionIds?.includes(id));
  const nextOpenQuestion =
    questions.slice(activeIndex + 1).find((q) => !isAwarded(q.id)) ||
    questions.slice(0, Math.max(activeIndex, 0)).find((q) => !isAwarded(q.id));
  const allQuestionsUsed = questions.length > 0 && !nextOpenQuestion && isQuestionAwarded;

  const categoryDisplay = activeQuestion?.category
    ? activeQuestion.category.toLowerCase() === 'general' ||
      activeQuestion.category === 'ทั่วไป'
      ? language === 'en'
        ? 'General'
        : 'ทั่วไป'
      : activeQuestion.category
    : language === 'en'
    ? 'General'
    : 'ทั่วไป';

  return (
    <div className="px-window overflow-hidden flex flex-col">
      {/* Window Titlebar */}
      <div className="px-titlebar px-titlebar-mint">
        <div className="flex items-center gap-2 truncate">
          <PixelIcon name="envelope" size={18} />
          <span className="truncate text-sm sm:text-base">
            quiz_judge.exe — {t('questionPanelTitle')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isQuestionAwarded && (
            <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-[13px]">
              ✓ {t('alreadyAwardedTag')}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenFullscreenModal}
            className="px-btn px-btn-secondary py-1 px-2.5 text-xs cursor-pointer"
            title="Projector Mode (Fullscreen)"
          >
            <PixelIcon name="computer" size={14} />
            <span className="hidden sm:inline">{t('projectorModeBtn')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Category & Points Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] text-xs border border-[var(--px-border)]">
            {t('categoryLabel')}: <strong className="ml-1">{categoryDisplay}</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="px-badge bg-[var(--px-surface-sunken)] text-[var(--px-text)] text-xs border border-[var(--px-border)]">
              {t('questionCurrentOfTotal', {
                current: activeIndex + 1,
                total: questions.length,
              })}
            </span>
            <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs">
              <PixelIcon name="star" size={13} />
              <span>
                +{activeQuestion?.points || 10} {t('pointsUnit')}
              </span>
            </span>
          </div>
        </div>

        {/* Question Display Box */}
        <div className="px-panel-inset p-4 bg-[var(--px-surface-sunken)]">
          <p className="text-base sm:text-lg font-bold text-[var(--px-text)] leading-relaxed break-words">
            {activeQuestion
              ? activeQuestion.text
              : language === 'en'
              ? 'No question in this session.'
              : 'ยังไม่มีคำถามใน Session นี้'}
          </p>
        </div>

        {/* Already Scored Alert Banner */}
        {isQuestionAwarded && !allQuestionsUsed && (
          <div className="p-2.5 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PixelIcon name="check" size={16} />
              <span>{t('antiDuplicateWarning')}</span>
            </div>
            <button
              type="button"
              onClick={() => (nextOpenQuestion ? onSelectQuestion(nextOpenQuestion.id) : onNextQuestion())}
              className="px-btn py-1 px-2.5 text-xs flex-shrink-0 cursor-pointer"
            >
              <span>{t('nextQuestionBtn')} ➔</span>
            </button>
          </div>
        )}

        {/* Every question has been scored: the only way forward is to finish the game */}
        {allQuestionsUsed && (
          <div className="p-2.5 bg-[var(--color-px-yellow,#FFE57A)] border-2 border-[var(--px-border)] text-[#2A2350] text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PixelIcon name="trophy" size={16} />
              <span>
                {language === 'en'
                  ? 'All questions have been answered! Finish the game to see the results.'
                  : 'ตอบคำถามครบทุกข้อแล้ว! กดจบเกมเพื่อดูผลการแข่งขัน'}
              </span>
            </div>
            <button
              type="button"
              onClick={onRequestFinishGame}
              className="px-btn px-btn-pink py-1 px-2.5 text-xs flex-shrink-0 cursor-pointer"
            >
              <span>{t('finishGameBtn')}</span>
            </button>
          </div>
        )}

        {/* Reveal Answer Box (Teacher Check) */}
        {activeQuestion?.answer && (
          <div>
            <button
              type="button"
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-btn px-btn-pink py-1 px-3 text-xs cursor-pointer"
            >
              <PixelIcon name="sparkle" size={14} />
              <span>{showAnswer ? t('hideAnswerBtn') : t('showAnswerBtn')}</span>
            </button>
            {showAnswer && (
              <div className="mt-2 p-3 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-xs sm:text-sm text-[#2A2350] space-y-1">
                <div className="break-words font-bold">
                  <span>{t('answerKeyPrefix')} </span>
                  {activeQuestion.answer}
                </div>
                {activeQuestion.explanation && (
                  <div className="text-xs pt-1 border-t border-[var(--px-border)]/30 break-words">
                    <span className="font-bold">{t('explanationPrefix')}</span>{' '}
                    {activeQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Question Prev / Next Win98 Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-[var(--px-border)]/40">
          <button
            type="button"
            onClick={onPrevQuestion}
            disabled={activeIndex <= 0}
            className="px-btn px-btn-secondary py-1.5 px-3 text-xs cursor-pointer"
          >
            <span>◀ {t('prevQuestionBtn')}</span>
          </button>

          <span className="font-pixel font-bold text-xs text-[var(--px-text)] px-2 py-1 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] num">
            {activeIndex + 1} / {questions.length}
          </span>

          <button
            type="button"
            onClick={onNextQuestion}
            disabled={activeIndex >= questions.length - 1}
            className="px-btn px-btn-secondary py-1.5 px-3 text-xs cursor-pointer"
          >
            <span>{t('nextQuestionBtn')} ▶</span>
          </button>
        </div>

        {/* Responding Team & Teacher Judgement Section */}
        <div className="pt-3 border-t-3 border-[var(--px-border)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-pixel font-bold text-[var(--px-text)] flex items-center gap-1.5">
              <PixelIcon name="cursor" size={16} />
              <span>{t('chooseHandRaisedTeam')}</span>
            </span>
            {selectedTeam && (
              <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs truncate max-w-[170px]">
                {t('respondingTeam')}: <strong>{selectedTeam.name}</strong>
              </span>
            )}
          </div>

          {/* Team Selector Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {session.teams.map((team, idx) => {
              const isSelected = selectedRespondingTeamId === team.id;
              const palette = getTeamPalette(team, idx);

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onSelectRespondingTeam(isSelected ? null : team.id)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: palette.hex,
                          borderColor: palette.outlineHex,
                          color: '#2A2350',
                        }
                      : undefined
                  }
                  className={`px-3 py-2 border-2 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 transition-transform cursor-pointer ${
                    isSelected
                      ? 'shadow-[4px_4px_0px_var(--px-hard-shadow)] -translate-y-0.5 ring-2 ring-[var(--px-yellow)]'
                      : 'bg-[var(--px-surface-2)] hover:bg-[var(--px-surface-sunken)] text-[var(--px-text)] border-[var(--px-border)] shadow-[2px_2px_0px_var(--px-hard-shadow)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-3 h-3 border border-[var(--px-border)] flex-shrink-0"
                      style={{ backgroundColor: palette.hex }}
                    />
                    <span className="truncate">{team.name}</span>
                  </div>
                  <strong className="font-pixel text-xs flex-shrink-0 num">
                    {team.score}
                  </strong>
                </button>
              );
            })}
          </div>

          {/* Judgement Action Buttons */}
          {selectedTeam ? (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                {isQuestionAwarded ? (
                  <div
                    className="py-2.5 px-3 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] font-pixel font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 opacity-80 cursor-not-allowed"
                    title="Already awarded"
                  >
                    <PixelIcon name="check" size={16} />
                    <span>{t('alreadyAwardedTag')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-score-correct"
                    disabled={isGameEvaluating || isScoringLocked || isQuestionAwarded}
                    onClick={() => onCorrectAnswer(selectedTeam.id)}
                    className="px-btn px-btn-mint py-2.5 px-3 text-xs sm:text-sm cursor-pointer"
                  >
                    <PixelIcon name="check" size={16} />
                    <span>
                      {isScoringLocked ? t('savingScore') : t('correctAnswerBtn')}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-score-wrong"
                  disabled={isGameEvaluating || isScoringLocked || isQuestionAwarded}
                  onClick={() => onWrongAnswer(selectedTeam.id)}
                  className="px-btn px-btn-danger py-2.5 px-3 text-xs sm:text-sm cursor-pointer"
                >
                  <PixelIcon name="close" size={16} />
                  <span>{t('wrongAnswerBtn')}</span>
                </button>
              </div>

              {isScoringLocked && (
                <div className="p-2 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-xs font-pixel font-bold text-[#2A2350] text-center">
                  ★ {t('antiSpamLocked')}
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onRequestFinishGame}
                  className="px-btn px-btn-pink text-xs py-1.5 px-3 cursor-pointer"
                >
                  <PixelIcon name="trophy" size={15} />
                  <span>{t('finishGameBtn')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[var(--px-surface-sunken)] border-2 border-dashed border-[var(--px-border)] flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--px-text)] font-bold">
                👈 {t('chooseHandRaisedTeamPrompt')}
              </span>
              <button
                type="button"
                onClick={onRequestFinishGame}
                className="px-btn px-btn-pink text-xs py-1.5 px-3 flex-shrink-0 cursor-pointer"
              >
                <PixelIcon name="trophy" size={15} />
                <span>{t('finishGameBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
