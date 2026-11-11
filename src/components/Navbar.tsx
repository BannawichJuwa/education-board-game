import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, FolderKanban, ArrowLeft, ChevronUp, ChevronDown,
  Volume2, VolumeX, Laptop, Sun, Moon
} from 'lucide-react';
import { Session } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PixelIcon } from './PixelIcon';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../utils/audio';
import { TypeSpecimenModal } from './TypeSpecimenModal.tsx';

interface NavbarProps {
  currentView: 'menu' | 'dashboard' | 'game' | 'sessions' | 'login';
  activeSession: Session | null;
  onOpenMenu: () => void;
  onOpenDashboard?: () => void;
  onOpenCreate: () => void;
  onOpenSessions: () => void;
  onOpenHowToPlay?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'day' | 'night';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeSession,
  onOpenMenu,
  onOpenDashboard,
  onOpenCreate,
  onOpenSessions,
  onOpenHowToPlay,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'day',
  onToggleTheme,
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [timeStr, setTimeStr] = useState('');
  const [isSpecimenOpen, setIsSpecimenOpen] = useState(false);

  // Live Taskbar Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Close Start menu on click outside
  useEffect(() => {
    if (!isStartOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#taskbar-start-container')) {
        setIsStartOpen(false);
      }
    };
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, [isStartOpen]);

  const toggleSound = () => {
    playClickSound();
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  // When collapsed: Only show the "Show Bar" tab button at the bottom
  if (isCollapsed) {
    return (
      <aside aria-label="Show Taskbar" className="fixed bottom-0 right-4 z-40">
        {onToggleCollapse && (
          <button
            id="toggle-expand-navbar-btn"
            type="button"
            onClick={onToggleCollapse}
            className="px-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-[3px_3px_0_#4A3D8F]"
            title={t('navShowBar')}
          >
            <ChevronUp className="w-4 h-4" />
            <span>{t('navShowBar')}</span>
          </button>
        )}
      </aside>
    );
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--px-surface-sunken)] border-t-3 border-[var(--px-border)] shadow-[0_-3px_0_var(--px-hard-shadow)] select-none text-[var(--px-text)]">
      <div className="max-w-[1720px] mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2">
        {/* Left Side: Start Button & Open Windows */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {/* Win98-style Start Menu Button */}
          <div id="taskbar-start-container" className="relative flex-shrink-0">
            <button
              id="taskbar-start-button"
              type="button"
              onClick={() => {
                playClickSound();
                setIsStartOpen(!isStartOpen);
              }}
              className={`px-3 py-1 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-3 transition ${
                isStartOpen
                  ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-[var(--color-px-sky)] text-[#2A2350] border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] hover:brightness-105'
              }`}
            >
              <div className="w-4 h-4 bg-[var(--color-px-pink)] border border-[var(--px-border)] flex items-center justify-center text-[#2A2350]">
                <PixelIcon name="star" size={10} />
              </div>
              <span className="font-pixel text-[#2A2350]">{t('taskbarStart')}</span>
            </button>

            {/* Start Menu Popup */}
            {isStartOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 px-window shadow-[6px_6px_0_var(--px-hard-shadow)] animate-in fade-in slide-in-from-bottom-2">
                <div className="px-titlebar px-titlebar-yellow py-1">
                  <div className="px-titlebar-title">
                    <PixelIcon name="computer" size={14} />
                    <span>Educational Board Games OS</span>
                  </div>
                </div>
                <div className="p-2 space-y-1 bg-[var(--px-surface)] text-xs font-bold text-[var(--px-text)]">
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsStartOpen(false);
                        onOpenMenu();
                      }}
                      className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center gap-2 text-left"
                    >
                      <PixelIcon name="computer" size={16} />
                      <span>{t('taskbarMenu')} (Desktop)</span>
                    </button>
                  ) : onOpenDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsStartOpen(false);
                        onOpenDashboard();
                      }}
                      className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center gap-2 text-left"
                    >
                      <PixelIcon name="computer" size={16} />
                      <span>{t('dashboard')} (Teacher Workspace)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsStartOpen(false);
                      onOpenSessions();
                    }}
                    className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center gap-2 text-left"
                  >
                    <PixelIcon name="folder" size={16} />
                    <span>{t('taskbarSessions')} (Explorer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsStartOpen(false);
                      onOpenCreate();
                    }}
                    className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center gap-2 text-left"
                  >
                    <PixelIcon name="plus" size={16} />
                    <span>+ {t('navNewSession')}</span>
                  </button>

                  {onOpenHowToPlay && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsStartOpen(false);
                        onOpenHowToPlay();
                      }}
                      className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center gap-2 text-left"
                    >
                      <PixelIcon name="smiley" size={16} />
                      <span>{t('navHowToPlay')} (How to Play)</span>
                    </button>
                  )}

                  <div className="border-t-2 border-[var(--px-border-muted)] my-1 pt-1" />

                  <button
                    type="button"
                    onClick={() => {
                      toggleSound();
                      setIsStartOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 hover:bg-[var(--px-surface-2)] flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-2">
                      {soundOn ? <Volume2 className="w-4 h-4 text-[var(--px-success-text)]" /> : <VolumeX className="w-4 h-4 text-[var(--px-danger-text)]" />}
                      <span>{soundOn ? t('taskbarSoundOn') : t('taskbarSoundOff')}</span>
                    </span>
                    <span className="px-badge bg-[var(--px-surface-2)] text-[var(--px-text)] text-[13px] py-0">{soundOn ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Back button if not in primary view */}
          {((!currentUser && currentView !== 'menu') || (currentUser && currentView !== 'dashboard')) && (
            <button
              id="nav-back-button"
              type="button"
              onClick={() => {
                playClickSound();
                if (currentUser && onOpenDashboard) {
                  onOpenDashboard();
                } else {
                  onOpenMenu();
                }
              }}
              className="px-btn px-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 flex-shrink-0"
              title={currentUser ? t('dashboard') : t('backToMenu')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('back')}</span>
            </button>
          )}

          {/* Open Task Window Pill: Desktop (guest only - CUT OUT when logged in) */}
          {!currentUser && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenMenu();
              }}
              className={`px-2.5 py-1 text-xs font-bold border-2 flex items-center gap-1.5 truncate transition ${
                currentView === 'menu'
                  ? 'bg-[var(--px-surface)] border-[var(--px-border)] text-[var(--px-text)] shadow-[inset_2px_2px_0_var(--px-border-muted)]'
                  : 'bg-[var(--px-surface-2)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] hover:bg-[var(--px-surface)] hover:text-[var(--px-text)]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate hidden sm:inline">{t('taskbarMenu')}</span>
            </button>
          )}

          {/* Open Task Window Pill: Dashboard for logged in teachers */}
          {currentUser && onOpenDashboard && (
            <button
              id="nav-view-dashboard-button"
              type="button"
              onClick={() => {
                playClickSound();
                onOpenDashboard();
              }}
              className={`px-2.5 py-1 text-xs font-bold border-2 flex items-center gap-1.5 truncate transition ${
                currentView === 'dashboard'
                  ? 'bg-[var(--px-surface)] border-[var(--px-border)] text-[var(--px-text)] shadow-[inset_2px_2px_0_var(--px-border-muted)]'
                  : 'bg-[var(--px-surface-2)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] hover:bg-[var(--px-surface)] hover:text-[var(--px-text)]'
              }`}
            >
              <PixelIcon name="computer" size={14} />
              <span className="truncate hidden sm:inline">{t('dashboard')}</span>
            </button>
          )}

          {/* Open Task Window Pill: Explorer / Sessions */}
          <button
            id="nav-view-sessions-button"
            type="button"
            onClick={() => {
              playClickSound();
              onOpenSessions();
            }}
            className={`px-2.5 py-1 text-xs font-bold border-2 flex items-center gap-1.5 truncate transition ${
              currentView === 'sessions'
                ? 'bg-[var(--px-surface)] border-[var(--px-border)] text-[var(--px-text)] shadow-[inset_2px_2px_0_var(--px-border-muted)]'
                : 'bg-[var(--px-surface-2)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] hover:bg-[var(--px-surface)] hover:text-[var(--px-text)]'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate hidden sm:inline">{t('taskbarSessions')}</span>
          </button>

          {/* Open Task Window Pill: Active Game */}
          {activeSession && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
              }}
              className={`px-2.5 py-1 text-xs font-bold border-2 flex items-center gap-1.5 truncate transition ${
                currentView === 'game'
                  ? 'bg-[var(--px-surface)] border-[var(--px-border)] text-[var(--px-text)] shadow-[inset_2px_2px_0_var(--px-border-muted)]'
                  : 'bg-[var(--px-surface-2)] border-[var(--px-border-muted)] text-[var(--px-text-muted)] hover:bg-[var(--px-surface)] hover:text-[var(--px-text)]'
              }`}
            >
              <PixelIcon
                name={
                  activeSession.gameType === 'bingo'
                    ? 'grid'
                    : activeSession.gameType === 'snakes_ladders'
                    ? 'dice'
                    : 'cards'
                }
                size={14}
              />
              <span className="truncate max-w-[120px]">{activeSession.title}</span>
            </button>
          )}

          {/* Quick New Session Button */}
          <button
            id="nav-create-session-button"
            type="button"
            onClick={() => {
              playClickSound();
              onOpenCreate();
            }}
            className="px-btn px-btn-pink px-2.5 py-1 text-xs flex items-center gap-1 flex-shrink-0"
            title={t('navNewSession')}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('navNewSession')}</span>
          </button>
        </div>

        {/* Right Side: Sound Toggle, Language, Clock, and Collapse */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dev-only Type Specimen button */}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => setIsSpecimenOpen(true)}
              className="p-1.5 bg-[var(--px-yellow,#FFE36E)] hover:brightness-105 border-2 border-[var(--px-border,#4A3D8F)] text-[var(--px-on-yellow,#2A2350)] font-pixel text-xs font-bold"
              title="Open Type Specimen Inspector (DEV)"
            >
              Aa
            </button>
          )}

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 bg-[var(--px-surface-2)] hover:bg-[var(--px-surface)] border-2 border-[var(--px-border)] text-[var(--px-text)]"
            title={soundOn ? t('taskbarSoundOn') : t('taskbarSoundOff')}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[var(--px-danger-text)]" />}
          </button>

          {/* Theme Toggle Button (Day / Night) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 bg-[var(--px-surface-2)] hover:bg-[var(--px-surface)] border-2 border-[var(--px-border)] text-[var(--px-text)]"
              title={theme === 'day' ? t('themeNight') : t('themeDay')}
              aria-label={theme === 'day' ? t('themeNight') : t('themeDay')}
            >
              {theme === 'day' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Language Switcher Pill */}
          <LanguageSwitcher variant="compact" />

          {/* Live System Clock Tray */}
          <div className="px-panel-inset px-2.5 py-1 font-pixel text-xs font-bold text-[var(--px-text)] bg-[var(--px-surface-sunken)] border border-[var(--px-border)] flex items-center gap-1.5 num">
            <PixelIcon name="clock" size={13} />
            <span>{timeStr || '12:00'}</span>
          </div>

          {/* Toggle Hide Taskbar */}
          {onToggleCollapse && (
            <button
              id="toggle-collapse-navbar-btn"
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 bg-[var(--px-surface-2)] hover:bg-[var(--px-surface)] border-2 border-[var(--px-border)] text-[var(--px-text)]"
              title={t('navHideBar')}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {import.meta.env.DEV && (
        <TypeSpecimenModal
          isOpen={isSpecimenOpen}
          onClose={() => setIsSpecimenOpen(false)}
        />
      )}
    </footer>
  );
};
