import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { playClickSound } from '../utils/audio';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  const handleSelect = (lang: 'en' | 'th') => {
    playClickSound();
    setLanguage(lang);
  };

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-[var(--px-surface-sunken)] p-1 border-3 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] ${className}`}>
        <div className="px-1.5 flex items-center text-[var(--px-text)]">
          <PixelIcon name="globe" size={16} />
        </div>
        <button
          type="button"
          onClick={() => handleSelect('en')}
          className={`px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 border-2 cursor-pointer ${
            language === 'en'
              ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350] shadow-[2px_2px_0_var(--px-hard-shadow)]'
              : 'bg-[var(--px-surface)] border-transparent text-[var(--px-text)] hover:border-[var(--px-border)]'
          }`}
          title="Switch to English (Default)"
        >
          <span>🇺🇸</span>
          <span>English</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelect('th')}
          className={`px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 border-2 cursor-pointer ${
            language === 'th'
              ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350] shadow-[2px_2px_0_var(--px-hard-shadow)]'
              : 'bg-[var(--px-surface)] border-transparent text-[var(--px-text)] hover:border-[var(--px-border)]'
          }`}
          title="เปลี่ยนเป็นภาษาไทย (Switch to Thai)"
        >
          <span>🇹🇭</span>
          <span>ไทย</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-[var(--px-surface-sunken)] p-0.5 border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => handleSelect('en')}
        className={`px-2 py-0.5 text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
          language === 'en'
            ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350]'
            : 'bg-transparent border-transparent text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
        }`}
        title="English (Default)"
      >
        <span className="text-[13px]">🇺🇸</span>
        <span className="text-[13px] uppercase">EN</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('th')}
        className={`px-2 py-0.5 text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
          language === 'th'
            ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350]'
            : 'bg-transparent border-transparent text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
        }`}
        title="ภาษาไทย (Thai)"
      >
        <span className="text-[13px]">🇹🇭</span>
        <span className="text-[13px] uppercase">TH</span>
      </button>
    </div>
  );
};
