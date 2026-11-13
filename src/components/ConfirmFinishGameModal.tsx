import React from 'react';
import { AlertTriangle, Save, Flag } from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { rankTeams, getWinnerTeams, joinTeamNames } from '../utils/ranking';
import { getTeamPalette } from '../utils/storage';

/**
 * UI-13: Save Session Options & Finish Game Modal ("Save Session or End Game").
 * Option 1 keeps the session in progress, option 2 ends it and opens the scoreboard.
 */
interface ConfirmFinishGameModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveForLater: () => void;
  onConfirmFinish: () => void;
}

export const ConfirmFinishGameModal: React.FC<ConfirmFinishGameModalProps> = ({
  session,
  isOpen,
  onClose,
  onSaveForLater,
  onConfirmFinish,
}) => {
  const { t } = useLanguage();
  if (!isOpen || !session) return null;

  const ranked = rankTeams(session);
  const leaders = getWinnerTeams(session);
  const isTie = leaders.length > 1;

  return (
    <div className="px-modal-overlay">
      <div
        className="px-window w-full max-w-2xl bg-[var(--px-surface)] text-[var(--px-text)] p-0 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-dialog-title"
      >
        {/* Titlebar */}
        <div className="px-titlebar bg-[var(--color-px-mint)] text-[#2A2350]">
          <div className="flex items-center gap-2 text-[#2A2350]">
            <PixelIcon name="trophy" size={16} />
            <span className="font-bold tracking-wider">SAVE_OR_END.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="px-btn px-1 py-0.5 text-xs font-mono font-bold leading-none bg-white text-[#2A2350] cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_var(--px-hard-shadow)]">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 id="finish-dialog-title" className="text-base font-bold font-pixel text-[var(--px-text)]">
              {t('saveOrEndTitle')}
            </h3>
            <p className="text-xs text-[var(--px-text-muted)]">{t('saveOrEndSubtitle')}</p>
          </div>
        </div>

        <div className="p-5 pt-3 space-y-3.5">
          {/* Two option cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Save Session (to resume later) */}
            <div className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--px-text-muted)] uppercase">{t('optionOneLabel')}</span>
                <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-[11px] font-bold">
                  {t('statusInProgress')}
                </span>
              </div>
              <h4 className="font-pixel font-bold text-sm text-[var(--px-text)]">{t('saveForLaterTitle')}</h4>
              <p className="text-xs text-[var(--px-text-muted)] leading-relaxed flex-1">{t('saveForLaterDesc')}</p>
              <button
                type="button"
                id="save-session-for-later-btn"
                onClick={onSaveForLater}
                className="px-btn px-btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-pixel font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveForLaterBtn')}</span>
              </button>
            </div>

            {/* Option 2: Save Session and End Game (with Scoreboard) */}
            <div className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--px-text-muted)] uppercase">{t('optionTwoLabel')}</span>
                <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-[11px] font-bold">
                  {t('endedAndScoreboardBadge')}
                </span>
              </div>
              <h4 className="font-pixel font-bold text-sm text-[var(--px-text)]">{t('saveAndEndTitle')}</h4>
              <p className="text-xs text-[var(--px-text-muted)] leading-relaxed flex-1">{t('saveAndEndDesc')}</p>
              <button
                type="button"
                id="confirm-finish-game-btn"
                onClick={onConfirmFinish}
                className="px-btn bg-[var(--color-px-mint)] text-[#2A2350] text-xs py-2 px-3 flex items-center justify-center gap-1.5 font-pixel font-bold cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t('saveAndEndBtn')}</span>
              </button>
            </div>
          </div>

          {/* Live Score Summary */}
          <div
            id="live-score-summary"
            className="p-3.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--px-text-muted)] font-pixel">
              <span>{t('liveScoreSummary')}</span>
              {leaders.length > 0 && (
                <span className="text-[var(--px-text)] font-bold">
                  {isTie
                    ? `${t('tieLabel')}: ${joinTeamNames(leaders)}`
                    : `${t('leaderLabel')}: ${leaders[0].name}`}{' '}
                  (<span className="num">{leaders[0].score}</span> {t('pointsUnit')})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-dashed border-[var(--px-border)]/40">
              {ranked.map(({ team, rank, isTied }) => (
                <div
                  key={team.id}
                  className={`p-2 border flex items-center justify-between text-xs font-pixel ${
                    rank === 1
                      ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)]'
                      : 'bg-[var(--px-surface)] border-[var(--px-border)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[13px] opacity-75 num">#{rank}{isTied ? '=' : ''}</span>
                    <span
                      className="w-2.5 h-2.5 border border-[var(--px-border)] flex-shrink-0"
                      style={{ backgroundColor: getTeamPalette(team, Math.max(0, session.teams.findIndex((x) => x.id === team.id))).hex }}
                    />
                    <span className="truncate font-bold">{team.name}</span>
                  </div>
                  <strong className="ml-1 num">{team.score}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Guest 24-hour warning */}
          {session.isGuest && (
            <div
              id="finish-guest-warning"
              className="p-3 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs leading-relaxed">
                <strong className="block font-pixel">{t('guestBannerTitle')}</strong>
                <p>{t('guestSaveWarning')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[var(--px-surface-sunken)] border-t-2 border-[var(--px-border)] flex items-center justify-end gap-2">
          <button
            type="button"
            id="finish-modal-cancel-btn"
            onClick={onClose}
            className="px-btn-secondary text-xs py-2 px-3.5 cursor-pointer"
          >
            {t('resumePlaying')}
          </button>
        </div>
      </div>
    </div>
  );
};
