import React from 'react';
import { 
  Hand, ChevronRight
} from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { getTeamPalette } from '../utils/storage';

interface TeacherControlBarProps {
  session: Session;
  selectedRespondingTeamId: string | null;
  onSelectRespondingTeam: (teamId: string | null) => void;
  onCorrectAnswer: (teamId: string) => void;
  onWrongAnswer: (teamId: string) => void;
  onOpenQuestionModal: () => void;
  onNextQuestion: () => void;
  onFinishSession: () => void;
  isGameEvaluating?: boolean;
  isScoringLocked?: boolean;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  onAddMinuteTimer?: () => void;
  onToggleCollapse?: () => void;
}

export const TeacherControlBar: React.FC<TeacherControlBarProps> = ({
  session,
  selectedRespondingTeamId,
  onSelectRespondingTeam,
  onCorrectAnswer,
  onWrongAnswer,
  onOpenQuestionModal,
  onNextQuestion,
  onFinishSession,
  isGameEvaluating = false,
  isScoringLocked = false,
  onToggleTimer,
  onAddMinuteTimer,
  onToggleCollapse,
}) => {
  const { t, language } = useLanguage();
  const activeQuestion = session.questions.find((q) => q.id === session.activeQuestionId);
  const selectedTeam = session.teams.find((tItem) => tItem.id === selectedRespondingTeamId);

  const isQuestionAwarded = activeQuestion 
    ? (session.usedQuestionIds?.includes(activeQuestion.id) || session.awardedQuestionIds?.includes(activeQuestion.id)) 
    : false;

  const isCardMatching = session.gameType === 'card_matching';
  const cardPhase = session.cardMatchingState?.phase || 'idle';
  const isWaitingForFirstCardPick = isCardMatching && selectedTeam && (cardPhase === 'idle' || cardPhase === 'pick_first');
  const isCardTurnBusy = isCardMatching && (cardPhase === 'pick_second' || cardPhase === 'resolving');

  const remaining = session.timeRemainingSeconds ?? ((session.timeLimitMinutes || 10) * 60);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isTimeLow = remaining <= 60 && remaining > 0;
  const isTimesUp = remaining <= 0;

  return (
    <aside aria-label="แผงควบคุมของอาจารย์ผู้สอน" className="bg-[var(--color-px-window)] border-t-3 border-[var(--color-px-ink)] px-4 py-3 z-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Left: Active Question Quick View & Trigger + Game Timer */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenQuestionModal}
            className="px-btn px-3 py-2 text-xs flex items-center gap-1.5 flex-shrink-0"
          >
            <PixelIcon name="computer" size={14} />
            <span>{t('projectorModeBtn')}</span>
          </button>

          {/* Mini Live Timer Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-[var(--px-border)] font-bold text-xs flex-shrink-0 ${
            isTimesUp
              ? 'bg-[var(--color-px-error)] text-[#7A1D28] animate-pulse'
              : isTimeLow
              ? 'bg-[var(--color-px-yellow)] text-[#2A2350] animate-pulse'
              : 'bg-[var(--px-surface-2)] text-[var(--px-text)]'
          }`}>
            <PixelIcon name="clock" size={14} />
            <span className="num">{isTimesUp ? (language === 'en' ? "Time's up!" : 'หมดเวลา!') : timeFormatted}</span>
            {onToggleTimer && (
              <button
                type="button"
                onClick={onToggleTimer}
                className="p-1 hover:bg-[var(--px-surface-sunken)] border border-[var(--px-border)] ml-0.5 cursor-pointer"
                title={session.isTimerRunning === false ? 'Play' : 'Pause'}
              >
                {session.isTimerRunning === false ? (
                  <PixelIcon name="play" size={11} />
                ) : (
                  <PixelIcon name="pause" size={11} />
                )}
              </button>
            )}
            {onAddMinuteTimer && (
              <button
                type="button"
                onClick={onAddMinuteTimer}
                className="px-1 py-0.5 hover:bg-[var(--px-surface-sunken)] border border-[var(--px-border)] text-[13px] font-bold num cursor-pointer"
                title="+1 Minute"
              >
                +1m
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1 px-panel-inset px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--px-text)] font-bold">
                {language === 'en' ? 'Question' : 'คำถาม'} ({activeQuestion ? `+${activeQuestion.points} ${t('pointsUnit')}` : (language === 'en' ? 'None' : 'ไม่มี')}):
              </span>
              {isQuestionAwarded && (
                <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-[13px] py-0 flex items-center gap-1">
                  <PixelIcon name="check" size={10} />
                  {t('alreadyAwardedTag')}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--px-text)] truncate font-bold mt-0.5">
              {activeQuestion ? activeQuestion.text : (language === 'en' ? 'Press "Next" or open question panel to ask' : 'กด "ถัดไป" หรือเปิดจอคำถามเพื่อเริ่มถามคำถาม')}
            </p>
          </div>

          <button
            type="button"
            onClick={onNextQuestion}
            className="px-btn px-btn-secondary p-2 flex-shrink-0 cursor-pointer"
            title="Next Question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Hand-Raise & Responding Team Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs text-[var(--px-text)] font-bold mr-1">
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('chooseHandRaisedTeam')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {session.teams.map((team, idx) => {
              const isSelected = selectedRespondingTeamId === team.id;
              const palette = getTeamPalette(team, idx);
              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={isCardTurnBusy}
                  onClick={() => onSelectRespondingTeam(isSelected ? null : team.id)}
                  style={{
                    backgroundColor: isSelected ? palette.hex : 'var(--px-surface-2)',
                    borderColor: palette.outlineHex,
                    color: isSelected ? '#2A2350' : 'var(--px-text)',
                  }}
                  className={`px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 border-2 cursor-pointer ${
                    isSelected
                      ? 'shadow-[2px_2px_0_var(--px-hard-shadow)] -translate-y-0.5'
                      : 'hover:bg-[var(--px-surface-sunken)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 border border-[var(--px-border)]"
                    style={{ backgroundColor: palette.hex }}
                  />
                  <span className="truncate max-w-[90px]">{team.name}</span>
                  <span className="text-[13px] opacity-80 num">({team.score})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Instructor Judgement Buttons (Correct / Wrong) & Anti-Spam */}
        <div className="flex items-center gap-2 justify-end">
          {selectedTeam ? (
            <div className="flex items-center gap-2 bg-[var(--px-surface-sunken)] p-1.5 border-2 border-[var(--px-border)]">
              <span className="text-xs px-2 py-0.5 text-[var(--px-text)] font-bold hidden md:inline truncate max-w-[100px]">
                {selectedTeam.name}:
              </span>

              {isQuestionAwarded ? (
                <div
                  className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] flex items-center gap-1"
                  title="Already awarded"
                >
                  <PixelIcon name="check" size={12} />
                  <span>{t('alreadyAwardedTag')}</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isGameEvaluating || isScoringLocked || Boolean(isWaitingForFirstCardPick) || isCardTurnBusy}
                  onClick={() => onCorrectAnswer(selectedTeam.id)}
                  className="px-btn px-btn-mint px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                  title="Correct answer"
                >
                  <PixelIcon name="check" size={12} />
                  <span>{isScoringLocked ? t('savingScore') : t('correctAnswerBtn')}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isGameEvaluating || isScoringLocked || isQuestionAwarded || Boolean(isWaitingForFirstCardPick) || isCardTurnBusy}
                onClick={() => onWrongAnswer(selectedTeam.id)}
                className="px-btn px-btn-danger px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                title="Wrong answer"
              >
                <PixelIcon name="close" size={12} />
                <span>{t('wrongAnswerBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-[var(--px-text-muted)] font-bold px-2.5 py-1 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
              ({t('chooseHandRaisedTeamPrompt')})
            </div>
          )}

          <button
            type="button"
            onClick={onFinishSession}
            className="px-btn px-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 flex-shrink-0"
            title="Finish Game & Save Score"
          >
            <PixelIcon name="trophy" size={14} />
            <span className="hidden sm:inline">{t('finishGameBtn')}</span>
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-btn px-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 flex-shrink-0"
              title={language === 'en' ? 'Hide Teacher Bar' : 'ซ่อนแถบควบคุมอาจารย์'}
            >
              <span className="text-[13px] hidden md:inline">{language === 'en' ? 'Hide' : 'ซ่อน'}</span>
              <span className="text-xs">▼</span>
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};
