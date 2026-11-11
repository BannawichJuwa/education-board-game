import React from 'react';
import { 
  Play, Plus, FolderKanban, CheckCircle2, Clock, 
  User, Award, LogOut, ArrowRight, Sparkles, HelpCircle 
} from 'lucide-react';
import { Session } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { playClickSound } from '../utils/audio';

interface DashboardProps {
  sessions: Session[];
  onOpenCreate: () => void;
  onOpenSessions: () => void;
  onSelectSession: (session: Session) => void;
  onViewScoreboard: (session: Session) => void;
  onOpenLogin: () => void;
  onOpenHowToPlay?: () => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  onOpenCreate,
  onOpenSessions,
  onSelectSession,
  onViewScoreboard,
  onOpenLogin,
  onOpenHowToPlay,
  onLogout,
}) => {
  const { currentUser, logout } = useAuth();
  const { t, language, formatDate } = useLanguage();

  if (!currentUser) {
    return null;
  }

  // Filter sessions belonging to this teacher (or all saved if imported)
  const teacherSessions = sessions.filter(
    (s) => !s.userId || s.userId === currentUser.id
  );

  const inProgressSessions = teacherSessions.filter((s) => s.status === 'in_progress');
  const completedSessions = teacherSessions.filter((s) => s.status === 'completed');
  const latestInProgress = inProgressSessions[0] || null;
  const recentSessions = [...teacherSessions].slice(0, 4);

  const getGameLabel = (type: Session['gameType']) => {
    switch (type) {
      case 'bingo':
        return t('bingoTitle');
      case 'snakes_ladders':
        return t('snakesTitle');
      case 'card_matching':
        return t('cardMatchingTitle');
      default:
        return 'Game';
    }
  };

  const getGameBadgeColor = (type: Session['gameType']) => {
    switch (type) {
      case 'bingo':
        return 'bg-[var(--color-px-sky)] text-[#2A2350]';
      case 'snakes_ladders':
        return 'bg-[var(--color-px-yellow)] text-[#2A2350]';
      case 'card_matching':
        return 'bg-[var(--color-px-pink)] text-[#2A2350]';
      default:
        return 'bg-[var(--px-surface-2)] text-[var(--px-text)]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Main Window */}
      <div className="px-window">
        {/* Titlebar */}
        <div className="px-titlebar px-titlebar-mint">
          <div className="px-titlebar-title">
            <PixelIcon name="computer" size={16} />
            <span>dashboard.exe — {t('teacherDashboardTitle')}</span>
          </div>
          <div className="px-titlebar-controls">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-btn px-btn-secondary px-2 py-0 text-xs font-bold"
              title={t('accountInfo')}
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentUser.name}</span>
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="p-4 sm:p-6 space-y-6 bg-[var(--px-surface)] text-[var(--px-text)]">
          {/* Welcome Teacher Banner */}
          <div className="p-4 sm:p-5 bg-[var(--px-surface-2)] border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 bg-[var(--color-px-yellow)] border-3 border-[var(--px-border)] text-[#2A2350] font-bold text-2xl flex items-center justify-center shadow-[2px_2px_0_var(--px-hard-shadow)] flex-shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--px-text)] truncate">
                    {language === 'en' ? `Welcome, Teacher ${currentUser.name}` : `ยินดีต้อนรับ คุณครู${currentUser.name}`}
                  </h2>
                  <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-xs font-bold">
                    ✓ {language === 'en' ? 'Permanent Account' : 'บันทึกถาวร'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--px-text-muted)] mt-0.5">
                  @{currentUser.username} • {t('teacherDashboardSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  logout();
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="px-btn px-btn-danger px-3 py-1.5 text-xs flex items-center gap-1.5"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Log Out' : 'ออกจากระบบ'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Sessions */}
            <div className="p-4 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--px-text-muted)] uppercase tracking-wide">
                  {t('dashboardTotalSessions')}
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold num text-[var(--px-text)] mt-1">
                  {teacherSessions.length}
                </h3>
              </div>
              <div className="w-10 h-10 bg-[var(--color-px-sky)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-center justify-center shadow-[1px_1px_0_var(--px-hard-shadow)]">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>

            {/* In Progress */}
            <div className="p-4 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--px-text-muted)] uppercase tracking-wide">
                  {t('dashboardInProgressSessions')}
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold num text-amber-500 mt-1">
                  {inProgressSessions.length}
                </h3>
              </div>
              <div className="w-10 h-10 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-center justify-center shadow-[1px_1px_0_var(--px-hard-shadow)]">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Completed */}
            <div className="p-4 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[var(--px-text-muted)] uppercase tracking-wide">
                  {t('dashboardCompletedSessions')}
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold num text-emerald-500 mt-1">
                  {completedSessions.length}
                </h3>
              </div>
              <div className="w-10 h-10 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] flex items-center justify-center shadow-[1px_1px_0_var(--px-hard-shadow)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-4 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--px-text)] flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('dashboardQuickActions')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Action 1: Create New Game */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenCreate();
                }}
                className="px-btn px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-[3px_3px_0_var(--px-hard-shadow)]"
              >
                <Plus className="w-4 h-4" />
                <span>+ {t('dashboardCreateGame')}</span>
              </button>

              {/* Action 2: Session Library */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenSessions();
                }}
                className="px-btn px-btn-secondary px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-[3px_3px_0_var(--px-hard-shadow)]"
              >
                <FolderKanban className="w-4 h-4" />
                <span>{t('dashboardSavedSessions')}</span>
              </button>

              {/* Action 3: Resume Latest Game */}
              {latestInProgress ? (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onSelectSession(latestInProgress);
                  }}
                  className="px-btn px-btn-pink px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-[3px_3px_0_var(--px-hard-shadow)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span className="truncate">{t('dashboardResumeLatest')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-btn px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold opacity-50 cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span>{t('dashboardResumeLatest')}</span>
                </button>
              )}

              {/* Action 4: How to Play Popup */}
              {onOpenHowToPlay && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenHowToPlay();
                  }}
                  className="px-btn px-btn-mint px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-[3px_3px_0_var(--px-hard-shadow)]"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('navHowToPlay')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Sessions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-[var(--px-text)] flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                <span>{t('dashboardRecentSessions')}</span>
              </h3>
              {teacherSessions.length > 4 && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenSessions();
                  }}
                  className="text-xs font-bold text-[var(--color-accent-strong)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'en' ? 'View all' : 'ดูทั้งหมด'} ({teacherSessions.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <div className="p-8 text-center bg-[var(--px-surface-sunken)] border-2 border-dashed border-[var(--px-border)] space-y-3">
                <div className="w-12 h-12 mx-auto bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] flex items-center justify-center text-[var(--px-text-muted)]">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--px-text-muted)] font-bold">
                  {t('dashboardNoSessions')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onOpenCreate();
                  }}
                  className="px-btn px-4 py-2 text-xs font-bold"
                >
                  + {t('dashboardCreateGame')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentSessions.map((session) => {
                  const badgeColor = getGameBadgeColor(session.gameType);
                  return (
                    <div
                      key={session.id}
                      className="p-3.5 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-badge ${badgeColor} text-[11px] font-bold`}>
                              {getGameLabel(session.gameType)}
                            </span>
                            <span className="text-[11px] text-[var(--px-text-muted)] font-mono">
                              {formatDate(session.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[var(--px-text)] truncate mt-1">
                            {session.title}
                          </h4>
                          <p className="text-xs text-[var(--px-text-muted)] truncate">
                            {session.subject} • {session.teams.length} {t('teamsUnit')}
                          </p>
                        </div>

                        <span
                          className={`px-badge text-[11px] font-bold flex-shrink-0 ${
                            session.status === 'completed'
                              ? 'bg-[var(--color-px-mint)] text-[#2A2350]'
                              : 'bg-[var(--color-px-yellow)] text-[#2A2350]'
                          }`}
                        >
                          {session.status === 'completed' ? t('statusCompleted') : t('statusInProgress')}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--px-border)]/30">
                        {session.status === 'completed' ? (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              onViewScoreboard(session);
                            }}
                            className="px-btn px-btn-secondary px-3 py-1 text-xs font-bold flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{t('viewScoreboardBtn')}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              onSelectSession(session);
                            }}
                            className="px-btn px-3 py-1 text-xs font-bold flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{language === 'en' ? 'Continue' : 'เล่นต่อ'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
