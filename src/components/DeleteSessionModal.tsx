import React from 'react';
import { Trash2, AlertTriangle, Users, HelpCircle } from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';

interface DeleteSessionModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (sessionId: string) => void;
}

export const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen || !session) return null;

  const getGameLabel = (type: Session['gameType']) => {
    switch (type) {
      case 'bingo':
        return { name: t('bingoTitle'), icon: 'star' as const, bg: 'bg-[#FFE36E]' };
      case 'snakes_ladders':
        return { name: t('snakesTitle'), icon: 'dice' as const, bg: 'bg-[#A8E6CF]' };
      case 'card_matching':
        return { name: t('cardMatchingTitle'), icon: 'heart' as const, bg: 'bg-[#A8D4F5]' };
    }
  };

  const gameInfo = getGameLabel(session.gameType);

  const handleDelete = () => {
    onConfirmDelete(session.id);
    onClose();
  };

  return (
    <div className="px-modal-overlay">
      <div 
        className="px-window w-full max-w-md bg-[var(--px-surface)] text-[var(--px-text)] p-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Titlebar */}
        <div className="px-titlebar bg-[var(--px-error)] text-[#7A1D28]">
          <div className="flex items-center gap-2 text-[#7A1D28]">
            <PixelIcon name="trash" size={16} />
            <span className="font-bold tracking-wider">DELETE_CONFIRM.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="px-btn px-1 py-0.5 text-xs font-mono font-bold leading-none bg-white text-[#7A1D28] cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Header summary */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--px-error)] border-2 border-[var(--px-border)] text-[#7A1D28] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_var(--px-hard-shadow)]">
            <Trash2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-base font-bold font-pixel text-[var(--px-text)]">
              {t('deleteModalTitle')}
            </h3>
            <p className="text-xs text-[var(--px-text-muted)]">
              {t('deleteModalSubtitle')}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          {/* Target Session Card */}
          <div className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border border-[var(--px-border)] text-[13px] font-pixel font-bold ${gameInfo.bg} text-[#2A2350]`}>
                <PixelIcon name={gameInfo.icon} size={12} />
                <span>{gameInfo.name}</span>
              </span>
              <span className="text-[13px] font-pixel text-[var(--px-text-muted)]">
                {session.status === 'completed' ? t('statusCompleted') : t('statusInProgress')}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-[var(--px-text)] font-pixel text-sm truncate">
                {session.title}
              </h4>
              <p className="text-xs text-[var(--px-text-muted)] mt-0.5">
                {session.subject || (language === 'en' ? 'General Subject' : 'ไม่มีระบุวิชา')}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-1.5 border-t border-dashed border-[var(--px-border)]/40 text-xs text-[var(--px-text-muted)]">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="num">{session.teams.length} {t('teamsUnit')}</span>
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="num">{session.questions.length} {t('questionsUnit')}</span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-[var(--px-error)] border-2 border-[#7A1D28] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#7A1D28] flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-[#7A1D28] leading-relaxed">
              {t('deleteWarningText')}
            </p>
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
            onClick={handleDelete}
            id="confirm-delete-session-btn"
            className="px-btn-danger text-xs py-2 px-4 flex items-center gap-1.5 font-pixel font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('confirmDeleteBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};