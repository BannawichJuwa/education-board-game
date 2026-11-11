import React from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';

interface ConfirmFinishGameModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmFinish: () => void;
}

export const ConfirmFinishGameModal: React.FC<ConfirmFinishGameModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirmFinish,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen || !session) return null;

  const sortedTeams = [...session.teams].sort((a, b) => b.score - a.score);
  const leadingTeam = sortedTeams[0];

  return (
    <div className="px-modal-overlay">
      <div 
        className="px-window w-full max-w-lg bg-[var(--px-surface)] text-[var(--px-text)] p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-dialog-title"
      >
        {/* Titlebar */}
        <div className="px-titlebar bg-[var(--color-px-mint)] text-[#2A2350]">
          <div className="flex items-center gap-2 text-[#2A2350]">
            <PixelIcon name="trophy" size={16} />
            <span className="font-bold tracking-wider">FINISH_GAME.EXE</span>
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
            <PixelIcon name="trophy" size={20} />
          </div>
          <div>
            <h3 id="finish-dialog-title" className="text-base font-bold font-pixel text-[var(--px-text)]">
              {t('finishModalTitle')}
            </h3>
            <p className="text-xs text-[var(--px-text-muted)]">
              {t('finishModalSubtitle')}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          {/* Overwrite Warning Box */}
          <div className="p-3 bg-[var(--px-error)] border-2 border-[#7A1D28] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#7A1D28] flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 text-xs text-[#7A1D28] leading-relaxed">
              <strong className="text-xs font-bold block font-pixel">
                {t('finishWarningTitle')}
              </strong>
              <p>
                {t('finishWarningBody')}
              </p>
              <p className="text-[13px] opacity-90">
                {language === 'en'
                  ? 'Upon confirmation, results will be saved and you will leave the active game with 2 options: Return to Menu, or View Saved Sessions.'
                  : 'เมื่อยืนยันแล้ว ระบบจะบันทึกผลและออกจากหน้าเกมทันที โดยจะมีเพียง 2 ตัวเลือก คือ กลับไปในหน้าเมนู หรือ ดู session ที่สร้าง'}
              </p>
            </div>
          </div>

          {/* Current Score Summary */}
          <div className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--px-text-muted)] font-pixel">
              <span>{t('currentScoresToSave')}</span>
              {leadingTeam && (
                <span className="text-[var(--px-text)] font-bold">
                  {t('leaderLabel')}: {leadingTeam.name} (<span className="num">{leadingTeam.score}</span> {t('pointsUnit')})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-dashed border-[var(--px-border)]/40">
              {sortedTeams.map((team, idx) => (
                <div
                  key={team.id}
                  className="p-2 bg-[var(--px-surface-sunken)] border border-[var(--px-border)] flex items-center justify-between text-xs font-pixel"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[13px] text-[var(--px-text-muted)]">#{idx + 1}</span>
                    <span
                      className="w-2.5 h-2.5 border border-[var(--px-border)] flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-[var(--px-text)] truncate font-bold">{team.name}</span>
                  </div>
                  <strong className="text-[var(--px-text)] ml-1 num">{team.score}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[var(--px-surface-sunken)] border-t-2 border-[var(--px-border)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-btn-secondary text-xs py-2 px-3.5 cursor-pointer"
          >
            {t('resumePlaying')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmFinish();
              onClose();
            }}
            id="confirm-finish-game-btn"
            className="px-btn bg-[var(--color-px-mint)] text-[#2A2350] text-xs py-2 px-4 flex items-center gap-1.5 font-pixel font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('confirmFinishBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};