import React, { useState } from 'react';
import { 
  Eye, EyeOff, ChevronLeft, ChevronRight, 
  Hand, Shuffle
} from 'lucide-react';
import { Question, Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { getTeamPalette } from '../utils/storage';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  activeQuestion: Question | null;
  onSelectQuestion: (questionId: string) => void;
  onCorrectAnswer: (teamId: string) => void;
  onWrongAnswer: (teamId: string) => void;
  selectedRespondingTeamId: string | null;
  onSelectRespondingTeam: (teamId: string | null) => void;
  isScoringLocked?: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  session,
  activeQuestion,
  onSelectQuestion,
  onCorrectAnswer,
  onWrongAnswer,
  selectedRespondingTeamId,
  onSelectRespondingTeam,
  isScoringLocked = false,
}) => {
  const { t, language } = useLanguage();
  const [showAnswer, setShowAnswer] = useState(false);

  if (!isOpen || !activeQuestion) return null;

  const currentIndex = session.questions.findIndex((q) => q.id === activeQuestion.id);
  const totalQuestions = session.questions.length;
  const selectedTeam = session.teams.find((tItem) => tItem.id === selectedRespondingTeamId);

  const isQuestionAwarded = activeQuestion 
    ? (session.usedQuestionIds?.includes(activeQuestion.id) || session.awardedQuestionIds?.includes(activeQuestion.id)) 
    : false;

  const isCardMatching = session.gameType === 'card_matching';
  const cardPhase = session.cardMatchingState?.phase || 'idle';
  const isWaitingForFirstCardPick = isCardMatching && selectedTeam && (cardPhase === 'idle' || cardPhase === 'pick_first');
  const isCardTurnBusy = isCardMatching && (cardPhase === 'pick_second' || cardPhase === 'resolving');

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      onSelectQuestion(session.questions[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setShowAnswer(false);
      onSelectQuestion(session.questions[currentIndex + 1].id);
    }
  };

  const handleRandom = () => {
    const unpicked = session.questions.filter((q) => q.id !== activeQuestion.id);
    if (unpicked.length > 0) {
      const rand = unpicked[Math.floor(Math.random() * unpicked.length)];
      setShowAnswer(false);
      onSelectQuestion(rand.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 px-modal-overlay">
      <div className="px-window w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Window Titlebar */}
        <div className="px-titlebar">
          <div className="px-titlebar-title">
            <PixelIcon name="computer" size={16} />
            <span>question.exe — {t('questionCurrentOfTotal', { current: currentIndex + 1, total: totalQuestions })}</span>
          </div>
          <div className="px-titlebar-controls">
            <button
              type="button"
              onClick={handleRandom}
              className="px-titlebar-btn"
              title="Random Question"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-titlebar-btn px-titlebar-btn-close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub-Toolbar */}
        <div className="px-5 py-2.5 border-b-3 border-[var(--px-border)] bg-[var(--px-surface-sunken)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350]">
              {t('questionCurrentOfTotal', { current: currentIndex + 1, total: totalQuestions })}
            </span>
            {activeQuestion.category && (
              <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--px-border)]">
                {activeQuestion.category}
              </span>
            )}
            <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] flex items-center gap-1">
              <PixelIcon name="star" size={12} />
              <span>+{activeQuestion.points} {t('pointsUnit')}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRandom}
              className="px-btn px-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{t('randomQuestionBtn')}</span>
            </button>
          </div>
        </div>

        {/* Question Projector Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 flex flex-col justify-center text-center space-y-6 bg-[var(--px-surface)] text-[var(--px-text)]">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="px-badge bg-[var(--color-px-sky)] text-[#2A2350]">
              QUESTION FOR THE CLASS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--px-text)] leading-snug">
              "{activeQuestion.text}"
            </h2>
          </div>

          {/* Instructor Answer Toggle Box */}
          <div className="max-w-xl mx-auto w-full">
            {showAnswer ? (
              <div className="p-4 bg-[var(--color-px-mint)] text-[#2A2350] border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>{t('answerKeyPrefix')}</span>
                  <button
                    type="button"
                    onClick={() => setShowAnswer(false)}
                    className="underline flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{t('hideAnswerBtn')}</span>
                  </button>
                </div>
                <p className="text-lg font-bold text-[#2A2350]">
                  {activeQuestion.answer || (language === 'en' ? '(No answer specified)' : '(อาจารย์ไม่ได้ระบุเฉลยไว้)')}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="px-btn px-btn-secondary px-4 py-2 text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{t('showAnswerBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hand-raise response bar directly in question modal */}
        <div className="p-4 sm:p-5 bg-[var(--px-surface-sunken)] border-t-3 border-[var(--px-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--px-text)] font-bold flex items-center gap-1.5">
              <Hand className="w-4 h-4 text-[var(--px-text)]" />
              <span>{t('chooseHandRaisedTeamPrompt')}</span>
            </span>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="px-btn px-btn-secondary p-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[var(--px-text)] px-2">
                {currentIndex + 1} / {totalQuestions}
              </span>
              <button
                type="button"
                disabled={currentIndex === totalQuestions - 1}
                onClick={handleNext}
                className="px-btn px-btn-secondary p-1.5 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isWaitingForFirstCardPick && (
            <div className="p-2.5 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-xs font-bold text-[#2A2350] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <PixelIcon name="cards" size={14} />
                <span>{t('cardNeedFirstPickNotice')}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-btn px-2.5 py-1 text-xs cursor-pointer"
              >
                {language === 'en' ? 'Go to Board' : 'ไปที่กระดาน'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {session.teams.map((tItem, idx) => {
                const isSelected = selectedRespondingTeamId === tItem.id;
                const palette = getTeamPalette(tItem, idx);
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    disabled={isCardTurnBusy}
                    onClick={() => onSelectRespondingTeam(isSelected ? null : tItem.id)}
                    style={{
                      backgroundColor: isSelected ? palette.hex : 'var(--px-surface-2)',
                      borderColor: palette.outlineHex,
                      color: isSelected ? '#2A2350' : 'var(--px-text)',
                    }}
                    className={`px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 border-3 cursor-pointer ${
                      isSelected
                        ? 'shadow-[3px_3px_0_var(--px-hard-shadow)] -translate-y-0.5'
                        : 'hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 border border-[var(--px-border)]"
                      style={{ backgroundColor: palette.hex }}
                    />
                    <span>{tItem.name}</span>
                    <span className="opacity-80 text-[13px]">({tItem.score} {t('pointsUnit')})</span>
                  </button>
                );
              })}
            </div>

            {selectedTeam && (
              <div className="flex items-center gap-2">
                {isQuestionAwarded ? (
                  <div
                    className="px-badge bg-[var(--color-px-mint)] py-2 px-3 flex items-center gap-1.5"
                    title="Already awarded"
                  >
                    <PixelIcon name="check" size={14} />
                    <span>{t('alreadyAwardedTag')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isScoringLocked || Boolean(isWaitingForFirstCardPick) || isCardTurnBusy}
                    onClick={() => {
                      onCorrectAnswer(selectedTeam.id);
                      onClose();
                    }}
                    className="px-btn px-btn-mint px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <PixelIcon name="check" size={14} />
                    <span>{isScoringLocked ? t('savingScore') : `${t('correctAnswerBtn')} (+${activeQuestion.points} ${t('pointsUnit')})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isScoringLocked || isQuestionAwarded || Boolean(isWaitingForFirstCardPick) || isCardTurnBusy}
                  onClick={() => onWrongAnswer(selectedTeam.id)}
                  className="px-btn px-btn-danger px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <PixelIcon name="close" size={14} />
                  <span>{t('wrongAnswerBtn')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
