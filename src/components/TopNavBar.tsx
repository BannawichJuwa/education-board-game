import React, { useState } from 'react';
import { Sun, Moon, Menu, X, LogOut, User } from 'lucide-react';
import { PixelIcon } from './PixelIcon';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/audio';

interface TopNavBarProps {
  currentView: 'menu' | 'dashboard' | 'sessions' | 'game' | 'login';
  sessionsCount: number;
  onOpenCreate: () => void;
  onOpenSessions: () => void;
  onOpenDashboard?: () => void;
  onOpenMenu?: () => void;
  onOpenHowToPlay: () => void;
  onOpenLogin: () => void;
  onToggleTheme?: () => void;
  theme?: 'day' | 'night';
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  sessionsCount,
  onOpenCreate,
  onOpenSessions,
  onOpenDashboard,
  onOpenMenu,
  onOpenHowToPlay,
  onOpenLogin,
  onToggleTheme,
  theme = 'day',
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleAction = (cb: () => void) => {
    playClickSound();
    cb();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--color-px-window,#FBF9FF)]/95 border-b-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[0_3px_0_rgba(107,91,181,0.2)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Pixel Mascot Logo + App Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => {
            if (currentUser && onOpenDashboard) {
              handleAction(onOpenDashboard);
            } else if (onOpenMenu) {
              handleAction(onOpenMenu);
            }
          }}
          title={currentUser ? t('dashboard') : t('navHome')}
        >
          <div className="w-10 h-10 bg-[var(--color-px-yellow,#FFE36E)] border-3 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] flex items-center justify-center flex-shrink-0 animate-px-bob">
            <PixelIcon name="smiley" size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-pixel font-bold text-xs sm:text-base tracking-wide text-[var(--color-px-ink-dark,#3B3270)] leading-tight uppercase">
              Educational Board Games OS
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[var(--color-px-ink,#6A6296)] tracking-wide">
              100% TEACHER-CONTROLLED
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav Links with Pixel Underline */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 font-pixel text-sm font-bold text-[var(--color-px-ink-dark,#3B3270)]">
          {/* Guest only: Home link (CUT OUT completely when logged in) */}
          {!currentUser && onOpenMenu && (
            <button
              id="nav-link-home"
              type="button"
              onClick={() => handleAction(onOpenMenu)}
              className={`py-1 border-b-3 cursor-pointer transition-colors ${
                currentView === 'menu'
                  ? 'border-[var(--color-px-ink-dark,#3B3270)] text-[var(--color-px-ink-dark,#3B3270)]'
                  : 'border-transparent hover:border-[var(--color-px-ink,#6B5BB5)] hover:text-[var(--color-px-ink,#6B5BB5)]'
              }`}
            >
              {t('navHome')}
            </button>
          )}

          {/* Logged in teachers: Dashboard is the primary home */}
          {currentUser && onOpenDashboard && (
            <button
              id="nav-link-dashboard"
              type="button"
              onClick={() => handleAction(onOpenDashboard)}
              className={`py-1 border-b-3 cursor-pointer transition-colors ${
                currentView === 'dashboard'
                  ? 'border-[var(--color-px-ink-dark,#3B3270)] text-[var(--color-px-ink-dark,#3B3270)]'
                  : 'border-transparent hover:border-[var(--color-px-ink,#6B5BB5)] hover:text-[var(--color-px-ink,#6B5BB5)]'
              }`}
            >
              {t('dashboard')}
            </button>
          )}

          <button
            id="nav-link-create"
            type="button"
            onClick={() => handleAction(onOpenCreate)}
            className="py-1 border-b-3 border-transparent hover:border-[var(--color-px-ink,#6B5BB5)] hover:text-[var(--color-px-ink,#6B5BB5)] transition-colors cursor-pointer"
          >
            {t('navCreateGame')}
          </button>

          <button
            id="nav-link-sessions"
            type="button"
            onClick={() => handleAction(onOpenSessions)}
            className={`py-1 border-b-3 cursor-pointer transition-colors flex items-center gap-1.5 ${
              currentView === 'sessions'
                ? 'border-[var(--color-px-ink-dark,#3B3270)] text-[var(--color-px-ink-dark,#3B3270)]'
                : 'border-transparent hover:border-[var(--color-px-ink,#6B5BB5)] hover:text-[var(--color-px-ink,#6B5BB5)]'
            }`}
          >
            <span>{t('navSavedSessions')}</span>
            {sessionsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] border border-[var(--color-px-ink,#6B5BB5)] text-[13px] font-bold leading-none">
                {sessionsCount}
              </span>
            )}
          </button>

          {/* How to Play link - Opens HowToPlayModal Popup */}
          <button
            id="nav-link-how-to-play"
            type="button"
            onClick={() => handleAction(onOpenHowToPlay)}
            className="py-1 border-b-3 border-transparent hover:border-[var(--color-px-ink,#6B5BB5)] hover:text-[var(--color-px-ink,#6B5BB5)] transition-colors cursor-pointer"
          >
            {t('navHowToPlay')}
          </button>
        </nav>

        {/* Right: Controls & CTA Button */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Theme Toggle (Sun / Moon) */}
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={() => handleAction(onToggleTheme)}
              className="w-9 h-9 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] flex items-center justify-center text-[var(--color-px-ink-dark,#3B3270)] hover:bg-[var(--color-px-yellow,#FFE36E)] hover:text-[#2A2350] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer"
              title={theme === 'day' ? t('themeNight') : t('themeDay')}
              aria-label={theme === 'day' ? t('themeNight') : t('themeDay')}
            >
              {theme === 'day' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}

          {/* Language Toggle (EN / TH) */}
          <div className="flex bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] p-0.5 text-xs font-pixel font-bold">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setLanguage('th');
              }}
              className={`px-2 py-0.5 transition-colors ${
                language === 'th'
                  ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]'
                  : 'text-[var(--color-px-ink,#6A6296)] hover:text-[var(--color-px-ink-dark,#3B3270)]'
              }`}
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setLanguage('en');
              }}
              className={`px-2 py-0.5 transition-colors ${
                language === 'en'
                  ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]'
                  : 'text-[var(--color-px-ink,#6A6296)] hover:text-[var(--color-px-ink-dark,#3B3270)]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Login / Account Dropdown */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  id="top-nav-account-button"
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  className="px-2.5 py-1 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] text-xs font-pixel font-bold text-[var(--color-px-ink-dark,#3B3270)] hover:bg-[var(--color-px-sky,#A8D4F5)] hover:text-[#2A2350] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  title={currentUser.name}
                >
                  <PixelIcon name="user" size={14} />
                  <span className="max-w-[110px] truncate">{currentUser.name}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 px-window shadow-[4px_4px_0_var(--px-hard-shadow)] bg-[var(--px-surface)] p-2 space-y-1.5 z-50">
                    <div className="px-2 py-1 text-xs text-[var(--px-text-muted)] font-bold border-b border-[var(--px-border-muted)] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[var(--px-success-text)]" />
                      <span className="truncate">{currentUser.name}</span>
                    </div>
                    {onOpenDashboard && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleAction(onOpenDashboard);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-bold text-[var(--px-text)] hover:bg-[var(--px-surface-2)] flex items-center gap-1.5"
                      >
                        <PixelIcon name="computer" size={14} />
                        <span>{t('dashboard')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        playClickSound();
                        logout();
                        if (onOpenMenu) {
                          onOpenMenu();
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-bold text-[var(--px-danger-text)] hover:bg-[#FF8DA1]/20 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Log Out' : 'ออกจากระบบ'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="top-nav-account-button"
                type="button"
                onClick={() => handleAction(onOpenLogin)}
                className="px-2.5 py-1 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] text-xs font-pixel font-bold text-[var(--color-px-ink-dark,#3B3270)] hover:bg-[var(--color-px-sky,#A8D4F5)] hover:text-[#2A2350] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                title={t('login')}
              >
                <PixelIcon name="user" size={14} />
                <span>{t('login')}</span>
              </button>
            )}
          </div>

          {/* Primary CTA: Create Game */}
          <button
            id="top-nav-create-button"
            type="button"
            onClick={() => handleAction(onOpenCreate)}
            className="px-btn bg-[var(--color-px-pink,#F8C4DC)] text-[#2A2350] py-1.5 px-3.5 text-xs sm:text-sm font-bold font-pixel shadow-[3px_3px_0_var(--color-px-ink,#6B5BB5)] flex items-center gap-1.5 cursor-pointer"
          >
            <PixelIcon name="dice" size={16} />
            <span>{t('navCreateGame')}</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] shadow-[2px_2px_0_var(--color-px-ink,#6B5BB5)] text-[var(--color-px-ink-dark,#3B3270)]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t-2 border-[var(--color-px-ink,#6B5BB5)] bg-[var(--color-px-window,#FBF9FF)] p-4 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2 font-pixel text-sm font-bold text-[var(--color-px-ink-dark,#3B3270)]">
            {/* Guest only: Home link (CUT OUT when logged in) */}
            {!currentUser && onOpenMenu && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAction(onOpenMenu);
                }}
                className={`text-left py-2 px-3 border border-[var(--color-px-ink,#6B5BB5)] ${
                  currentView === 'menu'
                    ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]'
                    : 'hover:bg-[var(--color-px-surface,#FBF9FF)]'
                }`}
              >
                {t('navHome')}
              </button>
            )}

            {/* Logged in teachers: Dashboard link */}
            {currentUser && onOpenDashboard && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAction(onOpenDashboard);
                }}
                className={`text-left py-2 px-3 border border-[var(--color-px-ink,#6B5BB5)] ${
                  currentView === 'dashboard'
                    ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]'
                    : 'hover:bg-[var(--color-px-surface,#FBF9FF)]'
                }`}
              >
                {t('dashboard')}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAction(onOpenCreate);
              }}
              className="text-left py-2 px-3 hover:bg-[var(--color-px-pink,#F8C4DC)] hover:text-[#2A2350] border border-[var(--color-px-ink,#6B5BB5)]"
            >
              {t('navCreateGame')}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAction(onOpenSessions);
              }}
              className={`text-left py-2 px-3 border border-[var(--color-px-ink,#6B5BB5)] flex items-center justify-between ${
                currentView === 'sessions'
                  ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]'
                  : 'hover:bg-[var(--color-px-sky,#A8D4F5)] hover:text-[#2A2350]'
              }`}
            >
              <span>{t('navSavedSessions')}</span>
              <span className="px-1.5 py-0.5 bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350] border border-[var(--color-px-ink,#6B5BB5)] text-xs">
                {sessionsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAction(onOpenHowToPlay);
              }}
              className="text-left py-2 px-3 hover:bg-[var(--color-px-mint,#A8E6CF)] hover:text-[#2A2350] border border-[var(--color-px-ink,#6B5BB5)]"
            >
              {t('navHowToPlay')}
            </button>
          </nav>

          <div className="flex items-center justify-between pt-2 border-t border-dashed border-[var(--color-px-ink,#6B5BB5)]/30">
            {/* Language Switch */}
            <div className="flex bg-[var(--color-px-window,#FBF9FF)] border-2 border-[var(--color-px-ink,#6B5BB5)] p-0.5 text-xs font-pixel font-bold">
              <button
                type="button"
                onClick={() => setLanguage('th')}
                className={`px-3 py-1 ${language === 'th' ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]' : 'text-[var(--color-px-ink,#6A6296)]'}`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 ${language === 'en' ? 'bg-[var(--color-px-yellow,#FFE36E)] text-[#2A2350]' : 'text-[var(--color-px-ink,#6A6296)]'}`}
              >
                EN
              </button>
            </div>

            {/* Account / Logout */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  playClickSound();
                  logout();
                  if (onOpenMenu) {
                    onOpenMenu();
                  }
                }}
                className="px-3 py-1 bg-[#FF6B7A] text-[#2A050B] text-xs font-bold border-2 border-[var(--color-px-ink,#6B5BB5)] flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Log Out' : 'ออกจากระบบ'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAction(onOpenLogin);
                }}
                className="px-3 py-1 bg-[var(--color-px-window,#FBF9FF)] text-[var(--color-px-ink-dark,#3B3270)] text-xs font-bold border-2 border-[var(--color-px-ink,#6B5BB5)]"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
