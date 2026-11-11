import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RotateCcw,
  Search, AlertTriangle
} from 'lucide-react';
import { Session } from '../types';
import { DeleteSessionModal } from './DeleteSessionModal';
import { ConfirmRestartModal } from './ConfirmRestartModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PixelIcon } from './PixelIcon';
import { 
  migrateSessionsList,
  isGuestSession,
  getGuestSessionRemainingMs,
  formatGuestRemainingTime
} from '../utils/storage';
import { playClickSound } from '../utils/audio';
import { searchServerSessionIds } from '../api/serverSync';
import { formatDurationSeconds } from '../utils/formatters';

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession?: (session: Session) => void;
  onRestartSession: (session: Session) => void;
  onViewScoreboard: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenCreateModal: () => void;
  onImportSessions?: (imported: Session[]) => void;
  onBackToMenu?: () => void;
  recentlySavedSessionId?: string | null;
  initialNotificationMessage?: string | null;
  onClearNotification?: () => void;
  onOpenLogin?: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onRestartSession,
  onViewScoreboard,
  onDeleteSession,
  onOpenCreateModal,
  onImportSessions,
  onBackToMenu,
  recentlySavedSessionId,
  initialNotificationMessage,
  onClearNotification,
  onOpenLogin,
}) => {
  const { t, language, formatDate } = useLanguage();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  // Searching (logged in): the database finds matching sessions via GET /api/sessions?q=...&status=...
  const [serverMatches, setServerMatches] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!currentUser) {
      setServerMatches(null);
      return;
    }
    const timer = window.setTimeout(() => {
      searchServerSessionIds(search, filter)
        .then(setServerMatches)
        .catch(() => setServerMatches(null));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, filter, currentUser, sessions.length]);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToRestart, setSessionToRestart] = useState<Session | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(initialNotificationMessage || null);

  useEffect(() => {
    if (initialNotificationMessage) {
      setNotificationMessage(initialNotificationMessage);
      const timer = window.setTimeout(() => {
        setNotificationMessage(null);
        if (onClearNotification) onClearNotification();
      }, 5000);
      return () => window.clearTimeout(timer);
    }
  }, [initialNotificationMessage, onClearNotification]);

  const handleConfirmDelete = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    onDeleteSession(sessionId);
    setNotificationMessage(
      language === 'en'
        ? `Session "${target?.title || ''}" has been removed.`
        : `ลบ Session "${target?.title || ''}" เรียบร้อยแล้ว`
    );
    window.setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const filteredSessions = sessions.filter((s) => {
    if (serverMatches && !isGuestSession(s)) return serverMatches.has(s.id);
    if (filter === 'in_progress' && s.status !== 'in_progress') return false;
    if (filter === 'completed' && s.status !== 'completed') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        (s.subject && s.subject.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getGameIconName = (type: Session['gameType']) => {
    switch (type) {
      case 'bingo':
        return 'grid' as const;
      case 'snakes_ladders':
        return 'dice' as const;
      case 'card_matching':
        return 'cards' as const;
      default:
        return 'folder' as const;
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

  const handleExportJSON = () => {
    playClickSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `education-board-game-sessions-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && onImportSessions) {
            // NFR-03 / NFR-06 migration round-trip: ensure every imported session fills defaults
            const migrated = migrateSessionsList(parsed);
            onImportSessions(migrated);
            setNotificationMessage(
              language === 'en'
                ? `Imported and migrated ${migrated.length} sessions successfully.`
                : `นำเข้าและแปลงโครงสร้างข้อมูลสำเร็จ ${migrated.length} sessions`
            );
            window.setTimeout(() => setNotificationMessage(null), 4000);
          }
        } catch {
          setNotificationMessage(
            language === 'en'
              ? 'Error: Invalid JSON file format.'
              : 'เกิดข้อผิดพลาด: รูปแบบไฟล์ JSON ไม่ถูกต้อง'
          );
          window.setTimeout(() => setNotificationMessage(null), 4000);
        }
      };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="p-3 bg-[var(--color-px-mint)] border-3 border-[var(--px-border)] text-[#2A2350] flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-[4px_4px_0_var(--px-hard-shadow)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <PixelIcon name="check" size={16} />
            <span>{notificationMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="text-xs px-2 py-0.5 underline font-bold cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      )}

      {/* Main File Explorer Window (explorer.exe) */}
      <div className="px-window">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="px-titlebar-title">
            <PixelIcon name="folder" size={16} />
            <span>explorer.exe — {t('sessionListTitle')}</span>
          </div>
          <div className="px-titlebar-controls">
            {onBackToMenu && (
              <button
                id="session-list-back-button"
                type="button"
                onClick={() => {
                  playClickSound();
                  onBackToMenu();
                }}
                className="px-btn px-btn-secondary px-2 py-0 text-xs font-bold"
                title={t('backToMenu')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('backToMenu')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Win98 Explorer Address & Toolbar Strip */}
        <div className="p-3 border-b-3 border-[var(--px-border)] bg-[var(--px-surface-sunken)] space-y-3">
          {/* Address Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--px-text)] flex-shrink-0">
              Address:
            </span>
            <div className="px-panel-inset px-2.5 py-1 flex-1 text-xs font-bold text-[var(--px-text)] truncate select-all">
              {t('explorerAddress')}
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-btn px-btn-secondary px-3 py-1 text-xs flex items-center gap-1.5 flex-shrink-0"
              title="Download JSON Backup"
            >
              <PixelIcon name="folder" size={14} />
              <span>{t('exportBackup')}</span>
            </button>

            <label className="px-btn px-btn-secondary px-3 py-1 text-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
              <PixelIcon name="computer" size={14} />
              <span>{t('importBackup')}</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenCreateModal();
              }}
              className="px-btn px-btn-pink px-3.5 py-1 text-xs flex items-center gap-1.5 flex-shrink-0"
            >
              <PixelIcon name="plus" size={14} />
              <span>+ {t('navNewSession')}</span>
            </button>
          </div>

          {/* Guest Mode Warning Banner (Auto-purges after 24h) */}
          {!currentUser && (
            <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/40 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs sm:text-sm shadow-sm">
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-bold text-amber-600 dark:text-amber-400">
                    {t('guestBannerTitle')}
                  </h4>
                  <p className="text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-relaxed text-xs">
                    {t('guestBannerDescSessionList')}
                  </p>
                </div>
              </div>
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow transition"
                >
                  <span>➔</span>
                  <span>{t('loginToSavePermanently')}</span>
                </button>
              )}
            </div>
          )}

          {/* Filter & Search Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--px-border)]/40">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-bold border-2 transition cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                    : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                }`}
              >
                {t('filterAll', { count: sessions.length })}
              </button>
              <button
                type="button"
                onClick={() => setFilter('in_progress')}
                className={`px-3 py-1 text-xs font-bold border-2 transition cursor-pointer ${
                  filter === 'in_progress'
                    ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                    : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                }`}
              >
                {t('filterInProgress', { count: sessions.filter((s) => s.status === 'in_progress').length })}
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 text-xs font-bold border-2 transition cursor-pointer ${
                  filter === 'completed'
                    ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                    : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                }`}
              >
                {t('filterCompleted', { count: sessions.filter((s) => s.status === 'completed').length })}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="px-input pl-8 pr-3 py-1 text-xs w-full sm:w-64"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--px-text-muted)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* File Explorer Content Area */}
        <div className="p-4 sm:p-6 bg-[var(--px-surface)] text-[var(--px-text)] min-h-[360px]">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center space-y-4 border-3 border-dashed border-[var(--px-border)]">
              <div className="w-16 h-16 bg-[#FFE36E] border-3 border-[var(--px-border)] flex items-center justify-center mx-auto shadow-[3px_3px_0_var(--px-hard-shadow)] text-[#2A2350]">
                <PixelIcon name="folder" size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--px-text)]">{t('emptySessionsTitle')}</h3>
                <p className="text-xs text-[var(--px-text-muted)] font-bold">
                  {t('emptySessionsSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="px-btn px-btn-pink px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <PixelIcon name="plus" size={14} />
                <span>{t('createFirstSessionBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => {
                const isPlayingThis = activeSessionId === session.id;
                const isRecentlySaved = recentlySavedSessionId === session.id;
                const topTeam = [...session.teams].sort((a, b) => b.score - a.score)[0];
                const gameIcon = getGameIconName(session.gameType);
                const badgeColor = getGameBadgeColor(session.gameType);

                return (
                  <div
                    key={session.id}
                    className={`border-3 p-4 flex flex-col justify-between space-y-3 transition-transform ${
                      isRecentlySaved
                        ? 'border-[#157F4B] shadow-[5px_5px_0_#157F4B] bg-[var(--px-surface-2)]'
                        : isPlayingThis
                        ? 'border-[var(--px-border)] shadow-[5px_5px_0_var(--px-yellow)] bg-[var(--px-surface-2)]'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)] hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Header: Game Icon, Mode, and Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-8 h-8 ${badgeColor} border-2 border-[var(--px-border)] flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_var(--px-hard-shadow)]`}>
                          <PixelIcon name={gameIcon} size={16} />
                        </div>
                        <span className={`px-badge ${badgeColor} text-[13px]`}>
                          {session.gameType === 'bingo'
                            ? t('bingoTitle')
                            : session.gameType === 'snakes_ladders'
                            ? t('snakesTitle')
                            : t('cardMatchingTitle')}
                        </span>
                      </div>

                      <span
                        className={`px-badge text-[13px] ${
                          session.status === 'completed'
                            ? 'bg-[var(--color-px-mint)] text-[#2A2350]'
                            : 'bg-[var(--color-px-yellow)] text-[#2A2350]'
                        }`}
                      >
                        {session.status === 'completed' ? t('statusCompleted') : t('statusInProgress')}
                      </span>
                    </div>

                    {/* Title and Subject */}
                    <div>
                      <h3 className="font-bold text-[var(--px-text)] text-sm sm:text-base line-clamp-1">
                        {session.title}
                      </h3>
                      <p className="text-xs text-[var(--px-text-muted)] font-bold mt-0.5 truncate">
                        {session.subject || (language === 'en' ? 'General Subject' : 'ไม่มีระบุวิชา')}
                      </p>
                    </div>

                    {/* Guest 24h Expiration Notice */}
                    {isGuestSession(session) && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                        <span>{t('guestAutoDeleteBadge', { time: formatGuestRemainingTime(getGuestSessionRemainingMs(session), language) })}</span>
                      </div>
                    )}

                    {/* Teams and Top Score */}
                    {(() => {
                      const usedCount = session.awardedQuestionIds ? session.awardedQuestionIds.length : (session.usedQuestionIds ? session.usedQuestionIds.length : 0);
                      const playedSecs = Math.max(0, (session.timeLimitMinutes || 10) * 60 - (session.timeRemainingSeconds ?? 0));

                      return (
                        <>
                          <div className="px-panel-inset p-2.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span>{session.teams.length} {t('teamsUnit')}</span>
                              {topTeam && (
                                <span className="text-[var(--px-text)] font-bold num">
                                  {session.status === 'completed'
                                    ? (language === 'en' ? '🏆 Winner' : '🏆 ชนะเลิศ')
                                    : (language === 'en' ? 'Leader' : 'ผู้นำ')}: {topTeam.name} ({topTeam.score} {t('pointsUnit')})
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {session.teams.map((tItem) => (
                                <span
                                  key={tItem.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 border border-[var(--px-border)] text-[13px] font-bold bg-[var(--px-surface)] text-[var(--px-text)]"
                                >
                                  <span className={`w-2 h-2 border border-black ${tItem.color}`} />
                                  <span className="truncate max-w-[70px]">{tItem.name}</span>
                                  <span className="opacity-80 font-mono num">({tItem.score} pts)</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Metadata: Questions Used/Total, Time Played vs Limit, Date */}
                          <div className="space-y-1 text-[13px] text-[var(--px-text-muted)] font-bold border-t border-[var(--px-border)]/40 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="num">
                                {language === 'en' ? 'Questions' : 'คำถาม'}: {usedCount} / {session.questions.length} Qs
                              </span>
                              <span className="num">
                                {language === 'en' ? 'Time' : 'เวลาที่ใช้'}: {formatDurationSeconds(playedSecs, language)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[13px]">
                              <span>{t('createdAtLabel')}: {formatDate(session.createdAt)}</span>
                              <span className="num opacity-80">Limit: {session.timeLimitMinutes || (session.durationPreset === 'quick' ? 5 : 10)} min</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Action Toolbar */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t-2 border-[var(--px-border)]/40">
                      <div className="flex items-center gap-1.5">
                        {/* Play / Open Button if in progress */}
                        {session.status !== 'completed' && onSelectSession && (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              onSelectSession(session);
                            }}
                            className="px-btn px-btn-mint px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer"
                            title="Play"
                          >
                            <PixelIcon name="play" size={12} />
                            <span>{language === 'en' ? 'Play' : 'เล่น'}</span>
                          </button>
                        )}

                        <button
                          id={`restart-session-btn-${session.id}`}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setSessionToRestart(session);
                          }}
                          className="px-btn px-btn-secondary px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
                          title={t('restartSessionBtn')}
                        >
                          <RotateCcw className="w-3 3" />
                          <span>{t('restartSessionBtn')}</span>
                        </button>

                        <button
                          id={`view-scoreboard-btn-${session.id}`}
                          type="button"
                          onClick={() => {
                            playClickSound();
                            onViewScoreboard(session);
                          }}
                          className="px-btn px-2.5 py-1 text-xs flex items-center gap-1 cursor-pointer"
                          title={t('viewScoreboardBtn')}
                        >
                          <PixelIcon name="trophy" size={12} />
                          <span>{t('viewScoreboardBtn')}</span>
                        </button>
                      </div>

                      <button
                        id={`delete-session-btn-${session.id}`}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setSessionToDelete(session);
                        }}
                        className="px-btn px-btn-danger px-2 py-1 text-xs flex items-center gap-1 cursor-pointer"
                        title={t('delete')}
                      >
                        <PixelIcon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Explorer Bottom Status Strip */}
        <div className="px-4 py-1.5 border-t-2 border-[var(--px-border)] bg-[var(--px-surface-sunken)] flex items-center justify-between text-xs font-bold text-[var(--px-text)]">
          <span>{t('explorerItems', { count: filteredSessions.length })}</span>
          <span>Education Board Game File System v2.0</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteSessionModal
        session={sessionToDelete}
        isOpen={sessionToDelete !== null}
        onClose={() => setSessionToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Restart Game Confirmation Modal */}
      <ConfirmRestartModal
        session={sessionToRestart}
        isOpen={sessionToRestart !== null}
        onClose={() => setSessionToRestart(null)}
        onConfirmRestart={(sess) => {
          onRestartSession(sess);
          setSessionToRestart(null);
        }}
      />
    </div>
  );
};
