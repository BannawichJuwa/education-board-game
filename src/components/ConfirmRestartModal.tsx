import React from 'react';
import { RotateCcw, AlertTriangle, Play } from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';

interface ConfirmRestartModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestart: (session: Session) => void;
}

export const ConfirmRestartModal: React.FC<ConfirmRestartModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirmRestart,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen || !session) return null;

  return (
    <div className="px-modal-overlay">
      <div 
        className="px-window w-full max-w-md bg-[var(--px-surface)] text-[var(--px-text)] p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-dialog-title"
      >
        {/* Titlebar */}
        <div className="px-titlebar bg-[var(--color-px-yellow)] text-[#2A2350]">
          <div className="flex items-center gap-2 text-[#2A2350]">
            <PixelIcon name="settings" size={16} />
            <span className="font-bold tracking-wider">RESTART_GAME.EXE</span>
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
          <div className="w-10 h-10 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_var(--px-hard-shadow)]">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 id="restart-dialog-title" className="text-base font-bold font-pixel text-[var(--px-text)]">
              {t('restartModalTitle')}
            </h3>
            <p className="text-xs text-[var(--px-text-muted)]">
              {t('restartModalSubtitle')}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          <div className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1.5">
            <span className="text-[13px] font-pixel font-bold text-[var(--px-text-muted)] uppercase tracking-wider">
              {session.subject || (language === 'en' ? 'General Subject' : 'ไม่มีระบุวิชา')}
            </span>
            <h4 className="font-bold text-[var(--px-text)] font-pixel text-sm truncate">
              {session.title}
            </h4>
            <div className="text-xs text-[var(--px-text-muted)] flex items-center gap-2 pt-1 border-t border-dashed border-[var(--px-border)]/40">
              <span className="num">{session.teams.length} {t('teamsUnit')}</span>
              <span>•</span>
              <span className="num">{session.questions.length} {t('questionsUnit')}</span>
            </div>
          </div>

          {/* Warning notice */}
          <div className="p-3 bg-[var(--color-px-yellow)] text-[#2A2350] border-2 border-[var(--px-border)] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#2A2350] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#2A2350] leading-relaxed space-y-1">
              <p className="font-bold">
                {t('restartWarningTitle')}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-[#2A2350]">
                <li>{t('restartBullet1')}</li>
                <li>{t('restartBullet2')}</li>
                <li>{t('restartBullet3')}</li>
              </ul>
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
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmRestart(session);
              onClose();
            }}
            id="confirm-restart-session-btn"
            className="px-btn bg-[var(--color-px-yellow)] text-[#2A2350] text-xs py-2 px-4 flex items-center gap-1.5 font-pixel font-bold cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('confirmRestartBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};