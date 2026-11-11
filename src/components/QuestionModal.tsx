import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Hand, Pause, Play, SkipForward } from 'lucide-react';
import { Question, Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { getTeamPalette } from '../utils/storage';

/**
 * Projector Mode (fullscreen, continuous play).
 *
 * One loop per question, without leaving fullscreen:
 *   1. question — show the question, teacher picks the team that raised a hand, judges Correct / Wrong
 *   2. reveal   — show the answer key (and who scored) BEFORE the game action
 *   3. action   — the game board for this turn (roll dice / claim bingo tile / flip 2 cards)
 *   4. next     — once the action is done, auto-advance to the next unanswered question
 */

type Stage = 'question' | 'reveal' | 'action' | 'all_done';

/** Seconds to wait after the board action before moving to the next question. */
const AUTO_NEXT_SECONDS = 5;

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
  /** The live game board, rendered inside the projector during the action stage. */
  gameBoard: React.ReactNode;
  /** True while a team still has to do its board action (roll / claim / flip). */
  isActionPending: boolean;
  /** Moves to the next question that has not been scored yet. Returns false when none are left. */
  onNextOpenQuestion: () => boolean;
  onRequestFinishGame: () => void;
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
  gameBoard,
  isActionPending,
  onNextOpenQuestion,
  onRequestFinishGame,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [stage, setStage] = useState<Stage>('question');
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoringTeamId, setScoringTeamId] = useState<string | null>(null);
  const [wrongNotice, setWrongNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountdownPaused, setIsCountdownPaused] = useState(false);
  const wasOpenRef = useRef(false);

  const questionId = activeQuestion?.id ?? null;

  // When the projector opens: resume an unfinished board action, otherwise start at the question
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setShowAnswer(false);
      setWrongNotice(null);
      setCountdown(null);
      setIsCountdownPaused(false);
      setStage(isActionPending ? 'action' : 'question');
    }
    wasOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // A different question was picked → back to the question stage
  useEffect(() => {
    if (!isOpen) return;
    setShowAnswer(false);
    setWrongNotice(null);
    setCountdown(null);
    setIsCountdownPaused(false);
    setStage((prev) => (prev === 'action' && isActionPending ? prev : 'question'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  // Board action finished → start the auto-next countdown
  useEffect(() => {
    if (stage === 'action' && !isActionPending && countdown === null) {
      setCountdown(AUTO_NEXT_SECONDS);
      setIsCountdownPaused(false);
    }
  }, [stage, isActionPending, countdown]);

  useEffect(() => {
    if (countdown === null || isCountdownPaused || stage !== 'action') return;
    if (countdown <= 0) {
      goToNextQuestion();
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, isCountdownPaused, stage]);

  // Hide the "wrong answer" notice after a moment
  useEffect(() => {
    if (!wrongNotice) return;
    const id = window.setTimeout(() => setWrongNotice(null), 2500);
    return () => window.clearTimeout(id);
  }, [wrongNotice]);

  if (!isOpen || !activeQuestion) return null;

  const questions = session.questions;
  const currentIndex = questions.findIndex((q) => q.id === activeQuestion.id);
  const totalQuestions = questions.length;
  const answeredCount = questions.filter(
    (q) => session.usedQuestionIds?.includes(q.id) || session.awardedQuestionIds?.includes(q.id)
  ).length;
  const selectedTeam = session.teams.find((tItem) => tItem.id === selectedRespondingTeamId);
  const scoringTeam = session.teams.find((tItem) => tItem.id === scoringTeamId);

  const isQuestionAwarded =
    session.usedQuestionIds?.includes(activeQuestion.id) || session.awardedQuestionIds?.includes(activeQuestion.id);

  const gameType = session.gameType;
  const actionLabel =
    gameType === 'snakes_ladders'
      ? isEn ? 'Roll the dice' : 'ไปทอยลูกเต๋า'
      : gameType === 'bingo'
      ? isEn ? 'Claim a Bingo tile' : 'ไปยึดช่องบิงโก'
      : isEn ? 'Flip 2 cards' : 'ไปเปิดไพ่ 2 ใบ';
  const actionHint =
    gameType === 'snakes_ladders'
      ? isEn ? 'rolls the dice and moves the pawn' : 'ทอยลูกเต๋าและเดินหมาก'
      : gameType === 'bingo'
      ? isEn ? 'picks one tile to claim' : 'เลือกยึด 1 ช่องบนกระดานบิงโก'
      : isEn ? 'flips 2 cards to find a pair' : 'เปิดไพ่ 2 ใบเพื่อหาคู่ที่ตรงกัน';

  const answerText =
    activeQuestion.answer || (isEn ? '(No answer key was entered)' : '(อาจารย์ไม่ได้ระบุเฉลยไว้)');

  const handleCorrect = () => {
    if (!selectedTeam || isScoringLocked || isQuestionAwarded) return;
    setScoringTeamId(selectedTeam.id);
    onCorrectAnswer(selectedTeam.id);
    setShowAnswer(true);
    setStage('reveal');
  };

  const handleWrong = () => {
    if (!selectedTeam || isScoringLocked || isQuestionAwarded) return;
    onWrongAnswer(selectedTeam.id);
    setWrongNotice(
      isEn
        ? `${selectedTeam.name} answered wrong — another team may answer.`
        : `${selectedTeam.name} ตอบผิด — เปิดให้ทีมอื่นยกมือตอบต่อได้`
    );
  };

  const handleSkipWithAnswer = () => {
    setScoringTeamId(null);
    onSelectRespondingTeam(null);
    setShowAnswer(true);
    setStage('reveal');
  };

  const goToAction = () => {
    setCountdown(null);
    setIsCountdownPaused(false);
    setStage('action');
  };

  function goToNextQuestion() {
    setCountdown(null);
    setIsCountdownPaused(false);
    setShowAnswer(false);
    setScoringTeamId(null);
    const moved = onNextOpenQuestion();
    setStage(moved ? 'question' : 'all_done');
  }

  const handlePrev = () => {
    if (currentIndex > 0) onSelectQuestion(questions[currentIndex - 1].id);
  };
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) onSelectQuestion(questions[currentIndex + 1].id);
  };

  // ---------- UI pieces ----------

  const scoreStrip = (
    <div className="flex flex-wrap items-center gap-1.5">
      {session.teams.map((tItem, idx) => {
        const palette = getTeamPalette(tItem, idx);
        return (
          <span
            key={tItem.id}
            className="px-2 py-1 text-xs sm:text-sm font-bold border-2 flex items-center gap-1.5 bg-[var(--px-surface-2)] text-[var(--px-text)]"
            style={{ borderColor: palette.outlineHex }}
          >
            <span className="w-2.5 h-2.5 border border-[var(--px-border)]" style={{ backgroundColor: palette.hex }} />
            <span className="truncate max-w-[120px]">{tItem.name}</span>
            <strong className="num">{tItem.score}</strong>
          </span>
        );
      })}
    </div>
  );

  const stepIndicator = (
    <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold">
      {[
        { key: 'question', label: isEn ? '1 Question' : '1 คำถาม' },
        { key: 'reveal', label: isEn ? '2 Answer' : '2 เฉลย' },
        { key: 'action', label: isEn ? '3 Play' : '3 เล่นเกม' },
      ].map((s) => (
        <span
          key={s.key}
          className={`px-2 py-0.5 border-2 border-[var(--px-border)] ${
            stage === s.key
              ? 'bg-[var(--color-px-yellow)] text-[#2A2350]'
              : 'bg-[var(--px-surface-2)] text-[var(--px-text-muted)]'
          }`}
        >
          {s.label}
        </span>
      ))}
    </div>
  );

  const answerBox = (big: boolean) => (
    <div
      className={`bg-[var(--color-px-mint)] text-[#2A2350] border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)] text-left ${
        big ? 'p-5 sm:p-7 space-y-3' : 'p-3 space-y-1'
      }`}
    >
      <div className={`font-bold ${big ? 'text-sm sm:text-base' : 'text-xs'}`}>{t('answerKeyPrefix')}</div>
      <p className={`font-bold break-words ${big ? 'text-2xl sm:text-4xl leading-snug' : 'text-base'}`}>{answerText}</p>
      {activeQuestion.explanation && (
        <p className={`pt-2 border-t border-[#2A2350]/30 break-words ${big ? 'text-base sm:text-lg' : 'text-xs'}`}>
          <span className="font-bold">{t('explanationPrefix')}</span> {activeQuestion.explanation}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[var(--px-surface)] text-[var(--px-text)]"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Projector mode' : 'โหมดฉายเต็มจอ'}
    >
      {/* Title bar */}
      <div className="px-titlebar flex-shrink-0">
        <div className="px-titlebar-title min-w-0">
          <PixelIcon name="computer" size={16} />
          <span className="truncate">
            {isEn ? 'Projector Mode' : 'โหมดฉายเต็มจอ'} — {session.title}
          </span>
        </div>
        <div className="px-titlebar-controls">
          <button
            type="button"
            onClick={onClose}
            className="px-titlebar-btn px-titlebar-btn-close"
            aria-label={isEn ? 'Exit projector mode' : 'ออกจากโหมดฉายเต็มจอ'}
            title={isEn ? 'Exit projector mode' : 'ออกจากโหมดฉายเต็มจอ'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status bar: progress + steps + scores */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 border-b-3 border-[var(--px-border)] bg-[var(--px-surface-sunken)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350]">
            {t('questionCurrentOfTotal', { current: currentIndex + 1, total: totalQuestions })}
          </span>
          <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--px-border)] num">
            {isEn ? `Answered ${answeredCount}/${totalQuestions}` : `ตอบแล้ว ${answeredCount}/${totalQuestions} ข้อ`}
          </span>
          {stepIndicator}
        </div>
        {scoreStrip}
      </div>

      {/* ---------- Stage: QUESTION ---------- */}
      {stage === 'question' && (
        <>
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-center text-center gap-6">
            <div className="space-y-4 max-w-5xl mx-auto w-full">
              <div className="flex flex-wrap items-center justify-center gap-2">
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-snug break-words">
                {activeQuestion.text}
              </h2>
            </div>

            {isQuestionAwarded && (
              <div className="max-w-xl mx-auto w-full p-3 bg-[var(--color-px-mint)] text-[#2A2350] border-2 border-[var(--px-border)] font-bold text-sm flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} />
                  {isEn ? 'This question was already scored.' : 'ข้อนี้ให้คะแนนไปแล้ว'}
                </span>
                <button type="button" onClick={goToNextQuestion} className="px-btn px-3 py-1 text-xs">
                  {isEn ? 'Next question ➔' : 'ข้อถัดไป ➔'}
                </button>
              </div>
            )}

            {/* Teacher-only peek at the answer */}
            <div className="max-w-xl mx-auto w-full">
              {showAnswer ? (
                <div className="space-y-2">
                  {answerBox(false)}
                  <button
                    type="button"
                    onClick={() => setShowAnswer(false)}
                    className="underline inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{t('hideAnswerBtn')}</span>
                  </button>
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

          {/* Judge bar */}
          <div className="flex-shrink-0 p-4 sm:p-5 bg-[var(--px-surface-sunken)] border-t-3 border-[var(--px-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Hand className="w-4 h-4" />
                <span>{t('chooseHandRaisedTeamPrompt')}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentIndex <= 0}
                  onClick={handlePrev}
                  className="px-btn px-btn-secondary p-1.5 cursor-pointer"
                  aria-label={t('prevQuestionBtn')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2 num">
                  {currentIndex + 1} / {totalQuestions}
                </span>
                <button
                  type="button"
                  disabled={currentIndex >= totalQuestions - 1}
                  onClick={handleNext}
                  className="px-btn px-btn-secondary p-1.5 cursor-pointer"
                  aria-label={t('nextQuestionBtn')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {wrongNotice && (
              <div role="status" className="p-2.5 bg-[var(--color-px-error)] text-[#7A1D28] border-2 border-[#B91C47] text-sm font-bold flex items-center gap-2">
                <PixelIcon name="close" size={14} />
                <span>{wrongNotice}</span>
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
                      disabled={isQuestionAwarded}
                      onClick={() => onSelectRespondingTeam(isSelected ? null : tItem.id)}
                      style={{
                        backgroundColor: isSelected ? palette.hex : 'var(--px-surface-2)',
                        borderColor: palette.outlineHex,
                        color: isSelected ? '#2A2350' : 'var(--px-text)',
                      }}
                      className={`px-3 py-2 text-sm font-bold transition flex items-center gap-1.5 border-3 cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed ${
                        isSelected ? 'shadow-[3px_3px_0_var(--px-hard-shadow)] -translate-y-0.5' : 'hover:bg-[var(--px-surface-sunken)]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 border border-[var(--px-border)]" style={{ backgroundColor: palette.hex }} />
                      <span>{tItem.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedTeam && !isQuestionAwarded && (
                  <>
                    <button
                      type="button"
                      disabled={isScoringLocked}
                      onClick={handleCorrect}
                      className="px-btn px-btn-mint px-4 py-2 text-sm flex items-center gap-1.5"
                    >
                      <PixelIcon name="check" size={14} />
                      <span>
                        {isScoringLocked
                          ? t('savingScore')
                          : `${t('correctAnswerBtn')} (+${activeQuestion.points} ${t('pointsUnit')})`}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isScoringLocked}
                      onClick={handleWrong}
                      className="px-btn px-btn-danger px-4 py-2 text-sm flex items-center gap-1.5"
                    >
                      <PixelIcon name="close" size={14} />
                      <span>{t('wrongAnswerBtn')}</span>
                    </button>
                  </>
                )}
                {!isQuestionAwarded && (
                  <button
                    type="button"
                    onClick={handleSkipWithAnswer}
                    className="px-btn px-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
                    title={isEn ? 'Nobody got it — show the answer and move on' : 'ไม่มีทีมตอบถูก — เฉลยแล้วไปข้อถัดไป'}
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>{isEn ? 'Nobody got it · reveal & skip' : 'ไม่มีใครตอบถูก · เฉลยและข้าม'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------- Stage: REVEAL (answer key before the board action) ---------- */}
      {stage === 'reveal' && (
        <>
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-center gap-6">
            <div className="max-w-4xl mx-auto w-full space-y-5 text-center">
              <p className="text-lg sm:text-2xl font-bold text-[var(--px-text-muted)] break-words">{activeQuestion.text}</p>
              {answerBox(true)}
              {scoringTeam ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-px-yellow)] text-[#2A2350] border-3 border-[var(--px-border)] font-bold text-base sm:text-xl shadow-[3px_3px_0_var(--px-hard-shadow)]">
                  <PixelIcon name="trophy" size={18} />
                  <span>
                    {isEn
                      ? `${scoringTeam.name} is correct! +${activeQuestion.points} pts`
                      : `${scoringTeam.name} ตอบถูก! +${activeQuestion.points} แต้ม`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--px-surface-2)] border-3 border-[var(--px-border)] font-bold text-base">
                  {isEn ? 'No team scored on this question.' : 'ข้อนี้ไม่มีทีมได้คะแนน'}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 p-4 sm:p-5 bg-[var(--px-surface-sunken)] border-t-3 border-[var(--px-border)] flex flex-wrap items-center justify-end gap-3">
            {scoringTeam ? (
              <>
                <span className="text-sm font-bold mr-auto">
                  {isEn ? `Next: ${scoringTeam.name} ${actionHint}` : `ต่อไป: ${scoringTeam.name} ${actionHint}`}
                </span>
                <button type="button" onClick={goToAction} className="px-btn px-btn-mint px-5 py-2.5 text-sm sm:text-base flex items-center gap-2">
                  <span>{actionLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button type="button" onClick={goToNextQuestion} className="px-btn px-5 py-2.5 text-sm sm:text-base flex items-center gap-2">
                <span>{isEn ? 'Next question' : 'ข้อถัดไป'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}

      {/* ---------- Stage: ACTION (live game board) ---------- */}
      {stage === 'action' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 sm:p-5">
            <div className="max-w-6xl mx-auto w-full">{gameBoard}</div>
          </div>
          <div className="flex-shrink-0 p-3 sm:p-4 bg-[var(--px-surface-sunken)] border-t-3 border-[var(--px-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm font-bold min-w-0 break-words">
              <span className="text-[var(--px-text-muted)]">{t('answerKeyPrefix')} </span>
              <span>{answerText}</span>
            </div>
            {isActionPending ? (
              <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-sm animate-px-pulse">
                {isEn ? `Waiting: ${actionHint}…` : `รอ: ${actionHint}…`}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCountdownPaused((p) => !p)}
                  className="px-btn px-btn-secondary px-2.5 py-2 text-xs flex items-center gap-1"
                  aria-label={isCountdownPaused ? (isEn ? 'Resume' : 'นับต่อ') : (isEn ? 'Pause' : 'หยุดนับ')}
                >
                  {isCountdownPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isCountdownPaused ? (isEn ? 'Resume' : 'นับต่อ') : (isEn ? 'Wait' : 'หยุดรอ')}</span>
                </button>
                <button type="button" onClick={goToNextQuestion} className="px-btn px-btn-mint px-5 py-2.5 text-sm sm:text-base flex items-center gap-2">
                  <span>
                    {isEn ? 'Next question' : 'ข้อถัดไป'}
                    {!isCountdownPaused && countdown !== null ? ` (${countdown})` : ''}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------- Stage: ALL DONE ---------- */}
      {stage === 'all_done' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <PixelIcon name="trophy" size={48} />
          <h2 className="text-3xl sm:text-4xl font-bold">
            {isEn ? 'All questions have been answered!' : 'ตอบคำถามครบทุกข้อแล้ว!'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => setStage('question')} className="px-btn px-btn-secondary px-4 py-2 text-sm">
              {isEn ? 'Back to questions' : 'กลับไปดูคำถาม'}
            </button>
            <button type="button" onClick={onRequestFinishGame} className="px-btn px-btn-pink px-5 py-2.5 text-sm flex items-center gap-2">
              <PixelIcon name="trophy" size={16} />
              <span>{t('finishGameBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
