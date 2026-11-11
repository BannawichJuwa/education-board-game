import React from 'react';
import { PixelIcon } from './PixelIcon.tsx';

interface TypeSpecimenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypeSpecimenModal: React.FC<TypeSpecimenModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="specimen-title"
      className="fixed inset-0 z-50 bg-[#2A2350]/70 flex items-center justify-center p-4"
    >
      <div className="px-window w-full max-w-xl max-h-[90vh] flex flex-col shadow-[8px_8px_0_var(--px-hard-shadow)]">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="flex items-center gap-2">
            <PixelIcon name="star" size={16} />
            <span id="specimen-title" className="font-pixel text-sm">
              Type Specimen & Font Harmony Inspector (DEV ONLY)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-titlebar-btn px-titlebar-btn-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 bg-[var(--px-surface)] text-[var(--px-text)] text-sm">
          {/* Section 1: Thai + EN Mixed Sentence */}
          <div className="p-3 border-2 border-[var(--px-border)] bg-[var(--px-surface-2)] space-y-1">
            <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase tracking-wider block">
              1. Thai + EN Mixed Baseline & Alignment
            </span>
            <p className="text-base sm:text-lg font-bold leading-normal">
              ทีม 1 ตอบถูก! +10 pts (Team 1 answered correctly!)
            </p>
            <p className="text-xs text-[var(--px-text-muted)]">
              Verifies no baseline shift, clipping of upper Thai tone marks (่ ้ ๊ ๋) or lower vowels (ุ ู).
            </p>
          </div>

          {/* Section 2: Digits 0-9 & Tabular Alignment */}
          <div className="p-3 border-2 border-[var(--px-border)] bg-[var(--px-surface-2)] space-y-1">
            <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase tracking-wider block">
              2. Digits 0-9 Monospaced Font (JetBrains Mono via 'Digits')
            </span>
            <div className="text-xl font-bold num tracking-normal space-x-2">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold num pt-2">
              <div className="p-1 border border-[var(--px-border)] text-center">111,111</div>
              <div className="p-1 border border-[var(--px-border)] text-center">888,888</div>
            </div>
          </div>

          {/* Section 3: Score Displays with Mandatory Units */}
          <div className="p-3 border-2 border-[var(--px-border)] bg-[var(--px-surface-2)] space-y-2">
            <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase tracking-wider block">
              3. Score Displays (EN / TH with Units)
            </span>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-badge bg-[var(--px-yellow)] text-sm font-bold num">
                300 pts
              </span>
              <span className="px-badge bg-[var(--px-pink)] text-sm font-bold num">
                300 คะแนน
              </span>
              <span className="px-badge bg-[var(--px-mint)] text-sm font-bold num">
                +15 pts
              </span>
            </div>
          </div>

          {/* Section 4: Timer */}
          <div className="p-3 border-2 border-[var(--px-border)] bg-[var(--px-surface-2)] space-y-1">
            <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase tracking-wider block">
              4. Timer & Progress Display
            </span>
            <div className="flex items-center gap-3">
              <span className="px-panel-inset px-3 py-1 text-lg font-bold num bg-[var(--px-surface-sunken)]">
                04:59 min
              </span>
              <span className="px-badge bg-[var(--px-sky)] font-bold num">
                Q1 / 16 (18%)
              </span>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-btn px-btn-primary px-4 py-1.5 text-xs font-bold"
            >
              Close Specimen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
