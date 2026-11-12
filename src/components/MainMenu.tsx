import React from 'react';
import { Session, GameType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PixelIcon } from './PixelIcon';
import { playClickSound } from '../utils/audio';
import { 
  ArrowDown, ChevronRight,
  Sparkles, Heart, Trophy, Dices, Grid3X3, Layers
} from 'lucide-react';
import heroCatRoomImg from '../assets/hero-cat-room.webp';
import { TopNavBar } from './TopNavBar';

export interface MainMenuProps {
  sessionsCount: number;
  activeSession?: Session | null;
  onOpenSessions: () => void;
  onOpenCreate: (initialGameType?: GameType) => void;
  onResumeGame?: () => void;
  onOpenLogin?: () => void;
  onOpenDashboard?: () => void;
  onOpenHowToPlay?: () => void;
  theme?: 'day' | 'night';
  onToggleTheme?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  sessionsCount,
  activeSession,
  onOpenSessions,
  onOpenCreate,
  onResumeGame,
  onOpenLogin,
  onOpenDashboard,
  onOpenHowToPlay,
  theme = 'day',
  onToggleTheme,
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();

  const handleAction = (cb: () => void) => {
    playClickSound();
    cb();
  };

  const scrollToGameModes = () => {
    playClickSound();
    const target = document.getElementById('choose-game-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* 1. TOP NAV BAR */}
      <TopNavBar
        currentView="menu"
        sessionsCount={sessionsCount}
        onOpenCreate={() => onOpenCreate()}
        onOpenSessions={onOpenSessions}
        onOpenDashboard={onOpenDashboard}
        onOpenMenu={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenHowToPlay={onOpenHowToPlay || scrollToGameModes}
        onOpenLogin={onOpenLogin || (() => {})}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />

      {/* ============================================================ */}
      {/* 2. HERO SECTION (2 Columns Desktop) */}
      {/* ============================================================ */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 sm:pb-24 flex-1">
        {/* Background Watermark Decorations (Top-right, ~8% opacity) */}
        <div 
          className="absolute top-4 right-6 pointer-events-none opacity-8 select-none overflow-hidden hidden md:block"
          aria-hidden="true"
        >
          <svg width="260" height="260" viewBox="0 0 200 200" fill="none" className="text-[var(--color-px-ink,#6B5BB5)]">
            {/* Pixel Stars */}
            <path fill="currentColor" d="M40 10h10v10H40zm-10 10h30v10H30zm-10 10h50v10H20zm10 10h30v10H30zm10 10h10v10H40z" />
            <path fill="currentColor" d="M150 40h8v8h-8zm-8 8h24v8h-24zm-8 8h40v8h-40zm8 8h24v8h-24zm8 8h8v8h-8z" />
            {/* Pixel Heart */}
            <path fill="currentColor" d="M120 120h10v10h-10zm20 0h10v10h-10zm-30 10h30v10h-30zm30 0h20v10h-20zm-20 10h50v10h-50zm10 10h30v10h-30zm10 10h10v10h-10z" />
          </svg>
        </div>

        {/* Active Session Quick Banner if any */}
        {activeSession && onResumeGame && (
          <div className="mb-8 p-3.5 bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[4px_4px_0_var(--color-px-ink,#6B5BB5)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 bg-[#FF9AA2] border border-[#2A2350] animate-pulse" />
              <span className="font-pixel font-bold text-xs sm:text-sm text-[#2A2350]">
                {t('menuActiveSessionPrompt')} <strong>{activeSession.title}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleAction(onResumeGame)}
              className="px-btn px-btn-ink text-xs sm:text-sm py-1.5 px-3.5 flex items-center gap-1.5"
            >
              <PixelIcon name="play" size={12} />
              <span>{t('menuResumeActiveBtn')}</span>
            </button>
          </div>
        )}

        {/* 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ========================================================== */}
          {/* LEFT COLUMN: Hero Headline & CTA Buttons */}
          {/* ========================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 text-left">
            {/* Giant 3-Line Headline */}
            <div className="space-y-1">
              <h1 className="font-display font-bold text-[clamp(2.8rem,8.5vw,7.2rem)] leading-[0.95] sm:leading-[0.92] text-[var(--color-px-ink-dark,#3B3270)] uppercase tracking-tight flex flex-col">
                <span className="block pt-1">{t('heroHeadlineLine1')}</span>
                <span className="block pt-1">{t('heroHeadlineLine2')}</span>
                <span className="block pt-1 text-[var(--color-accent-strong,#D9578F)]">
                  {t('heroHeadlineLine3')}
                </span>
              </h1>
            </div>

            {/* Subtitle (16-18px) */}
            <p className="text-base sm:text-lg text-[var(--color-px-ink,#3B3270)] font-medium max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Mobile Hero Image: Positioned above action buttons */}
            <div className="block lg:hidden my-2">
              <div className="relative w-full max-w-[420px] mx-auto pt-4">
                {/* Round Pink STICKER BADGE */}
                <div 
                  className="absolute top-0 -left-2 z-20 w-22 h-22 rounded-full bg-[var(--color-px-pink,#F8C4DC)] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[3px_3px_0_var(--color-px-ink,#6B5BB5)] -rotate-8 flex flex-col items-center justify-center p-2 text-center animate-px-wiggle select-none"
                  title={t('heroBadgeText')}
                >
                  <span className="font-bold text-xs text-[#2A2350] leading-tight uppercase">
                    {language === 'en' ? (
                      <>PLAY.<br />LEARN.<br /><span className="text-[#8A1C4E]">GROW!</span></>
                    ) : (
                      <>เล่นสนุก.<br />ได้ความรู้.<br /><span className="text-[#8A1C4E]">เติบโต!</span></>
                    )}
                  </span>
                  <Sparkles className="w-3 h-3 text-[#8A1C4E] mt-0.5" />
                </div>

                {/* Pixel Window with Cat Room image */}
                <div className="px-window w-full shadow-[6px_6px_0_var(--px-hard-shadow,#4A3D8F)] overflow-hidden">
                  <div className="px-titlebar justify-end min-h-[26px] py-1.5">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-2.5 h-2.5 bg-white border border-[var(--px-border,#4A3D8F)]" />
                      <span className="w-2.5 h-2.5 bg-white border border-[var(--px-border,#4A3D8F)]" />
                      <span className="w-2.5 h-2.5 bg-[var(--px-error,#FF9AA2)] border border-[var(--px-border,#4A3D8F)]" />
                    </div>
                  </div>
                  <div className="relative overflow-hidden bg-[var(--px-surface-sunken)]">
                    <picture>
                      <source srcSet={heroCatRoomImg} type="image/webp" />
                      <img 
                        src={heroCatRoomImg} 
                        alt="Cozy room with pixel cats playing board games"
                        width="2000"
                        height="1493"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="hero-photo w-full h-auto object-cover max-h-[55vh]"
                      />
                    </picture>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              {/* Primary CTA: Create Game */}
              <button
                id="menu-create-session-button"
                type="button"
                onClick={() => handleAction(() => onOpenCreate())}
                className="px-btn bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] text-base sm:text-lg py-3.5 px-7 font-bold font-pixel shadow-[5px_5px_0_var(--color-px-ink,#6B5BB5)] min-h-[48px] flex items-center justify-center gap-2.5 transition-transform hover:-translate-y-1"
              >
                <PixelIcon name="plus" size={20} />
                <span>{t('menuCreateBtn')}</span>
              </button>

              {/* Secondary CTA: Saved Sessions */}
              <button
                id="menu-view-sessions-button"
                type="button"
                onClick={() => handleAction(onOpenSessions)}
                className="px-btn-secondary px-btn text-[#2A2350] text-base sm:text-lg py-3.5 px-6 font-bold font-pixel shadow-[5px_5px_0_var(--color-px-ink,#6B5BB5)] min-h-[48px] flex items-center justify-center gap-2.5 transition-transform hover:-translate-y-1"
              >
                <PixelIcon name="folder" size={20} />
                <span>{t('menuViewSessionsBtn')}</span>
                <span className="ml-1 text-xs px-1.5 py-0.5 bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--color-px-ink,#6B5BB5)]">
                  {sessionsCount}
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: Desktop Framed Hero Window (cat-room.png) */}
          {/* ========================================================== */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
            <div className="relative w-full max-w-[440px] xl:max-w-[480px]">
              {/* Round Pink STICKER BADGE (Overlapping top-left of window, rotated -8 deg) */}
              <div 
                className="absolute -top-5 -left-5 z-20 w-26 h-26 rounded-full bg-[var(--color-px-pink,#F8C4DC)] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[4px_4px_0_var(--color-px-ink,#6B5BB5)] -rotate-8 flex flex-col items-center justify-center p-2 text-center animate-px-wiggle select-none cursor-default"
                title={t('heroBadgeText')}
              >
                <span className="font-bold text-xs sm:text-sm text-[#2A2350] leading-tight uppercase">
                  {language === 'en' ? (
                    <>
                      PLAY.<br />LEARN.<br /><span className="text-[#8A1C4E]">GROW!</span>
                    </>
                  ) : (
                    <>
                      เล่นสนุก.<br />ได้ความรู้.<br /><span className="text-[#8A1C4E]">เติบโต!</span>
                    </>
                  )}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#8A1C4E] mt-0.5" />
              </div>

              {/* Twinkling Pixel Sparkles around Window */}
              <div className="absolute -top-4 right-6 z-10 animate-px-sparkle pointer-events-none">
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="text-[var(--color-px-yellow,#FFE36E)]">
                  <path d="M7 1h2v5h5v2h-5v7H7V8H2V6h5V1z" fill="currentColor" stroke="var(--color-px-ink,#6B5BB5)" strokeWidth="1" />
                </svg>
              </div>
              <div className="absolute -bottom-4 -left-3 z-10 animate-px-sparkle pointer-events-none" style={{ animationDelay: '0.7s' }}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="text-[var(--color-px-sky,#A8D4F5)]">
                  <path d="M7 1h2v5h5v2h-5v7H7V8H2V6h5V1z" fill="currentColor" stroke="var(--color-px-ink,#6B5BB5)" strokeWidth="1" />
                </svg>
              </div>
              <div className="absolute top-24 -right-3 z-10 animate-px-bob pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-[#FF8FA3]">
                  <path d="M4 2h3v2H4zm5 0h3v2H9zm-6 2h10v4H3zm2 4h6v2H5zm2 2h2v2H7z" fill="currentColor" stroke="var(--color-px-ink,#6B5BB5)" strokeWidth="1" />
                </svg>
              </div>

              {/* Pixel Window with Cat Room image */}
              <div className="px-window w-full shadow-[6px_6px_0_var(--px-hard-shadow,#4A3D8F)] overflow-hidden">
                <div className="px-titlebar justify-end min-h-[26px] py-1.5">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-2.5 h-2.5 bg-white border border-[var(--px-border,#4A3D8F)]" />
                    <span className="w-2.5 h-2.5 bg-white border border-[var(--px-border,#4A3D8F)]" />
                    <span className="w-2.5 h-2.5 bg-[var(--px-error,#FF9AA2)] border border-[var(--px-border,#4A3D8F)]" />
                  </div>
                </div>
                <div className="relative overflow-hidden bg-[var(--px-surface-sunken)]">
                  <picture>
                    <source srcSet={heroCatRoomImg} type="image/webp" />
                    <img 
                      src={heroCatRoomImg} 
                      alt="Cozy room with pixel cats playing board games"
                      width="2000"
                      height="1493"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="hero-photo w-full h-auto object-cover max-h-[60vh]"
                    />
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Button: Round Pink Button with Down Arrow */}
        <div className="flex justify-center pt-8 sm:pt-12">
          <button
            id="hero-scroll-down-button"
            type="button"
            onClick={scrollToGameModes}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[var(--color-px-pink,#F8C4DC)] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[3px_3px_0_var(--color-px-ink,#6B5BB5)] text-[#2A2350] flex items-center justify-center hover:bg-[var(--color-px-yellow,#FFE36E)] active:translate-y-1 transition-all cursor-pointer animate-bounce"
            title={t('heroScrollDownAria')}
            aria-label={t('heroScrollDownAria')}
          >
            <ArrowDown className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECOND SECTION: Choose Your Game (3 Cards) + 3-Step Strip */}
      {/* ============================================================ */}
      <section 
        id="choose-game-section" 
        className="w-full bg-[var(--color-px-window,#FBF9FF)]/80 border-t-3 border-[var(--color-px-ink,#6B5BB5)] py-14 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-badge bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] text-xs font-bold font-pixel">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-strong,#D9578F)]" />
              <span>{language === 'en' ? '3 GAME FORMATS' : '3 โหมดการเล่น'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-pixel text-[var(--color-px-ink-dark,#3B3270)] tracking-tight">
              {t('chooseGameHeading')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-px-ink,#6A6296)] max-w-2xl mx-auto">
              {t('menuModesSubtitle')}
            </p>
          </div>

          {/* 3 Game Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* CARD 1: Bingo */}
            <div className="px-window p-0 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="px-titlebar bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]">
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={16} />
                    <span className="font-bold">{t('bingoTitle')}</span>
                  </div>
                  <span className="text-[13px] px-1.5 py-0.5 bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--px-border)] font-bold">
                    4x4 / 5x5
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="w-12 h-12 bg-[var(--color-px-yellow,#FFE36E)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] flex items-center justify-center">
                    <Grid3X3 className="w-6 h-6 text-[#2A2350]" />
                  </div>
                  <h3 className="text-lg font-bold font-pixel text-[var(--color-px-ink-dark,#3B3270)]">
                    {t('bingoTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-px-ink,#3B3270)] leading-relaxed">
                    {t('bingoDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <button
                  id="btn-play-bingo"
                  type="button"
                  onClick={() => handleAction(() => onOpenCreate('bingo'))}
                  className="px-btn w-full bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] py-2.5 text-xs sm:text-sm font-bold font-pixel flex items-center justify-center gap-1.5"
                >
                  <PixelIcon name="play" size={14} />
                  <span>{t('playBingoBtn')}</span>
                </button>
              </div>
            </div>

            {/* CARD 2: Snakes & Ladders */}
            <div className="px-window p-0 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="px-titlebar bg-[var(--color-px-mint,#A8E6CF)] text-[#2A2350]">
                  <div className="flex items-center gap-2">
                    <PixelIcon name="dice" size={16} />
                    <span className="font-bold">{t('snakesTitle')}</span>
                  </div>
                  <span className="text-[13px] px-1.5 py-0.5 bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--px-border)] font-bold">
                    30 / 36
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="w-12 h-12 bg-[var(--color-px-mint,#A8E6CF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] flex items-center justify-center">
                    <Dices className="w-6 h-6 text-[#2A2350]" />
                  </div>
                  <h3 className="text-lg font-bold font-pixel text-[var(--color-px-ink-dark,#3B3270)]">
                    {t('snakesTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-px-ink,#3B3270)] leading-relaxed">
                    {t('snakesDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <button
                  id="btn-play-snakes"
                  type="button"
                  onClick={() => handleAction(() => onOpenCreate('snakes_ladders'))}
                  className="px-btn w-full bg-[var(--color-px-mint,#A8E6CF)] text-[#2A2350] py-2.5 text-xs sm:text-sm font-bold font-pixel flex items-center justify-center gap-1.5"
                >
                  <PixelIcon name="play" size={14} />
                  <span>{t('playSnakesBtn')}</span>
                </button>
              </div>
            </div>

            {/* CARD 3: Card Matching */}
            <div className="px-window p-0 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="px-titlebar bg-[var(--color-px-pink,#F8C4DC)] text-[#2A2350]">
                  <div className="flex items-center gap-2">
                    <PixelIcon name="heart" size={16} />
                    <span className="font-bold">{t('cardMatchingTitle')}</span>
                  </div>
                  <span className="text-[13px] px-1.5 py-0.5 bg-[var(--px-surface-2)] text-[var(--px-text)] border border-[var(--px-border)] font-bold">
                    4x5 / 5x6
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="w-12 h-12 bg-[var(--color-px-pink,#F8C4DC)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] flex items-center justify-center">
                    <Layers className="w-6 h-6 text-[#2A2350]" />
                  </div>
                  <h3 className="text-lg font-bold font-pixel text-[var(--color-px-ink-dark,#3B3270)]">
                    {t('cardMatchingTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-px-ink,#3B3270)] leading-relaxed">
                    {t('cardMatchingDesc')}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <button
                  id="btn-play-cards"
                  type="button"
                  onClick={() => handleAction(() => onOpenCreate('card_matching'))}
                  className="px-btn w-full bg-[var(--color-px-pink,#F8C4DC)] text-[#2A2350] py-2.5 text-xs sm:text-sm font-bold font-pixel flex items-center justify-center gap-1.5"
                >
                  <PixelIcon name="play" size={14} />
                  <span>{t('playCardsBtn')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Step Strip: "1 Create a session -> 2 Ask a question, teams raise hands -> 3 Play on the board" */}
          <div className="p-5 sm:p-6 bg-[var(--color-px-surface,#FFFFFF)] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[4px_4px_0_var(--color-px-ink,#6B5BB5)]">
            <div className="text-center pb-4">
              <span className="text-xs font-bold font-pixel text-[var(--color-px-ink,#6A6296)] uppercase tracking-wider">
                {t('stepStripTitle')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Step 1 */}
              <div className="flex items-center gap-3 p-3 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)]">
                <div className="w-8 h-8 bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] border border-[var(--color-px-ink-dark,#3B3270)] font-bold font-pixel flex items-center justify-center text-sm flex-shrink-0">
                  1
                </div>
                <span className="text-xs sm:text-sm font-bold text-[var(--color-px-ink-dark,#3B3270)]">
                  {t('stepStrip1')}
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-3 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)]">
                <div className="w-8 h-8 bg-[var(--color-px-sky,#A8D4F5)] text-[#2A2350] border border-[var(--color-px-ink-dark,#3B3270)] font-bold font-pixel flex items-center justify-center text-sm flex-shrink-0">
                  2
                </div>
                <span className="text-xs sm:text-sm font-bold text-[var(--color-px-ink-dark,#3B3270)]">
                  {t('stepStrip2')}
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 p-3 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)]">
                <div className="w-8 h-8 bg-[var(--color-px-mint,#A8E6CF)] text-[#2A2350] border border-[var(--color-px-ink-dark,#3B3270)] font-bold font-pixel flex items-center justify-center text-sm flex-shrink-0">
                  3
                </div>
                <span className="text-xs sm:text-sm font-bold text-[var(--color-px-ink-dark,#3B3270)]">
                  {t('stepStrip3')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[var(--color-px-window,#FBF9FF)] border-t-2 border-[var(--color-px-ink,#6B5BB5)] py-4 text-center text-xs font-pixel text-[var(--color-px-ink,#6A6296)]">
        EDUCATIONAL BOARD GAMES OS • 100% TEACHER-CONTROLLED Y2K RETRO PIXEL KAWAII
      </footer>
    </div>
  );
};