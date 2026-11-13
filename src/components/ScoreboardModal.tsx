import React, { useMemo, useState } from 'react';
import { Session, Team, GameEventLog } from '../types';
import {
  getTeamPalette,
  getTerritoryStats,
  exportSessionToCSV,
} from '../utils/storage';
import { rankTeams, joinTeamNames } from '../utils/ranking';
import { Podium } from './Podium';
import { formatScore, formatDurationSeconds, formatDateTime, formatTime } from '../utils/formatters';
import { DeleteSessionModal } from './DeleteSessionModal';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { playClickSound } from '../utils/audio';

interface ScoreboardModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onReopenGame?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  isPostGameCompleted?: boolean;
  onGoToMenu?: () => void;
  onGoToSessions?: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  session,
  isOpen,
  onClose,
  onDeleteSession,
  isPostGameCompleted = false,
  onGoToMenu,
  onGoToSessions,
}) => {
  const { t, language } = useLanguage();
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Compute territory stats if Bingo
  const territoryStats = useMemo(() => {
    return session.gameType === 'bingo' && session.bingoState
      ? getTerritoryStats(session.bingoState, session.teams)
      : null;
  }, [session]);

  // Rank teams (standard competition ranking: ties share a rank, next rank is skipped)
  const standings = useMemo(() => rankTeams(session), [session]);
  const champions: Team[] = useMemo(() => standings.filter((r) => r.rank === 1).map((r) => r.team), [standings]);
  const isTie = champions.length > 1;
  const winner: Team | undefined = champions[0];

  // Overview stats
  const overview = useMemo(() => {
    const initialSecs = (session.timeLimitMinutes || 10) * 60;
    const durationSecs = Math.max(0, initialSecs - (session.timeRemainingSeconds ?? 0));
    const totalCorrect = session.teams.reduce((acc, tm) => acc + (tm.correctAnswersCount || 0), 0);
    const totalWrong = session.teams.reduce((acc, tm) => acc + (tm.wrongAnswersCount || 0), 0);
    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;
    const totalPointsAwarded = session.teams.reduce((acc, tm) => acc + (tm.score || 0), 0);

    return {
      durationSecs,
      limitSecs: initialSecs,
      totalCorrect,
      totalWrong,
      totalAnswered,
      accuracy,
      totalPointsAwarded,
    };
  }, [session]);

  // Cumulative score progression data for Section 4 (Chart)
  const chartData = useMemo(() => {
    const sortedLogs = [...session.eventLogs].sort((a, b) => a.timestamp - b.timestamp);
    const teamRunningScores: Record<string, number> = {};
    session.teams.forEach((tm) => {
      teamRunningScores[tm.id] = 0;
    });

    const pointsHistory: { step: number; scores: Record<string, number>; label: string }[] = [];
    pointsHistory.push({
      step: 0,
      scores: { ...teamRunningScores },
      label: 'Start',
    });

    let currentStep = 1;
    sortedLogs.forEach((log) => {
      if (log.teamId && log.pointsChange) {
        if (teamRunningScores[log.teamId] !== undefined) {
          teamRunningScores[log.teamId] += log.pointsChange;
        }
        pointsHistory.push({
          step: currentStep++,
          scores: { ...teamRunningScores },
          label: log.action,
        });
      }
    });

    // If no score points, add final point
    if (pointsHistory.length === 1) {
      session.teams.forEach((tm) => {
        teamRunningScores[tm.id] = tm.score;
      });
      pointsHistory.push({
        step: 1,
        scores: { ...teamRunningScores },
        label: 'End',
      });
    }

    let maxScore = 30;
    pointsHistory.forEach((pt) => {
      Object.values(pt.scores).forEach((sc) => {
        if (sc > maxScore) maxScore = sc;
      });
    });

    return { pointsHistory, maxScore };
  }, [session]);

  // Filtered timeline logs
  const filteredLogs = useMemo(() => {
    return session.eventLogs.filter((log) => {
      if (selectedTeamFilter === 'all') return true;
      return log.teamId === selectedTeamFilter;
    });
  }, [session.eventLogs, selectedTeamFilter]);

  if (!isOpen) return null;

  const handleCloseAction = () => {
    if (isPostGameCompleted && onGoToSessions) {
      onGoToSessions();
    } else if (isPostGameCompleted && onGoToMenu) {
      onGoToMenu();
    } else {
      onClose();
    }
  };

  const getEndReasonLabel = () => {
    const r = session.endReason;
    if (r === 'bingo_line' || r === 'snakes_finish' || r === 'cards_all_matched' || r === 'bingo_territory') {
      return t('endReasonWinCondition');
    }
    if (r === 'time_up') {
      return t('endReasonTimeLimit');
    }
    if (r === 'teacher_finish') {
      return t('endReasonTeacherFinish');
    }
    return t('endReasonHighestScore');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 px-modal-overlay overflow-y-auto"
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1.2cm; }
          body { background: #ffffff !important; color: #1f1b3a !important; }
          .px-modal-overlay { position: static !important; background: transparent !important; padding: 0 !important; }
          .px-window { border: 1px solid #4a3d8f !important; box-shadow: none !important; max-width: 100% !important; max-height: none !important; overflow: visible !important; }
          .no-print, button, select, .px-titlebar-btn, .px-titlebar-controls { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="px-window w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden shadow-[8px_8px_0_var(--px-hard-shadow)]">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="flex items-center gap-2 truncate">
            <PixelIcon name="trophy" size={18} />
            <span id="report-modal-title" className="truncate font-pixel text-sm">
              report.exe — {t('gameReportTitle')}
            </span>
            <span className="px-badge bg-[var(--px-mint)] text-[13px] hidden sm:inline-flex text-[var(--px-on-mint)]">
              {t('savedInSessionTag')}
            </span>
          </div>
          <div className="px-titlebar-controls">
            <button
              type="button"
              onClick={handleCloseAction}
              className="px-titlebar-btn px-titlebar-btn-close"
              aria-label={t('close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-[var(--px-surface)] text-[var(--px-text)] text-sm">
          {/* ============================================================ */}
          {/* SECTION 1: HEADER & METADATA */}
          {/* ============================================================ */}
          <div className="p-4 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[var(--px-border)] pb-2.5">
              <div>
                <span className="px-badge bg-[var(--px-yellow)] text-xs font-bold text-[var(--px-on-yellow)] mr-2">
                  {session.gameType === 'bingo' ? 'BINGO' : session.gameType === 'snakes_ladders' ? 'SNAKES & LADDERS' : 'CARD MATCHING'}
                </span>
                <span className="px-badge bg-[var(--px-sky)] text-xs font-bold text-[var(--px-on-sky)]">
                  {session.durationPreset === 'quick' ? (language === 'en' ? 'QUICK BOARD' : 'กระดานแบบเร็ว') : (language === 'en' ? 'STANDARD BOARD' : 'กระดานมาตรฐาน')}
                </span>
                <h2 className="text-xl sm:text-2xl font-pixel font-bold mt-1 text-[var(--px-text)]">
                  {session.title}
                </h2>
                <p className="text-xs text-[var(--px-text-muted)] font-medium">
                  {session.subject || (language === 'en' ? 'General Subject' : 'รายวิชาทั่วไป')}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="px-badge bg-[var(--px-pink)] text-xs font-bold text-[var(--px-on-pink)] block sm:inline-block">
                  {getEndReasonLabel()}
                </span>
                {session.status === 'completed' && (
                  <span id="scoreboard-outcome" className="px-badge bg-[var(--color-px-yellow)] text-xs font-bold text-[#2A2350] block sm:inline-block sm:ml-1">
                    {isTie
                      ? `${t('drawBadge')} ${t('coChampionsTitle')}: ${joinTeamNames(champions)}`
                      : `${language === 'en' ? 'Winner' : 'ผู้ชนะ'}: ${winner?.name ?? '-'}`}
                  </span>
                )}
                <div className="text-xs text-[var(--px-text-muted)] num">
                  <span>{formatDateTime(session.createdAt, language)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--px-text-muted)] font-bold">
              <span>
                {language === 'en' ? 'Teams' : 'จำนวนทีม'}: <strong className="num text-[var(--px-text)]">{session.teams.length}</strong>
              </span>
              <span>•</span>
              <span>
                {language === 'en' ? 'Duration Played' : 'เวลาที่ใช้แข่งขัน'}:{' '}
                <strong className="num text-[var(--px-text)]">{formatDurationSeconds(overview.durationSecs, language)}</strong>
              </span>
              <span>•</span>
              <span>
                {language === 'en' ? 'Status' : 'สถานะ'}:{' '}
                <strong className="text-[var(--px-text)]">
                  {session.status === 'completed' ? t('statusCompleted') : t('statusInProgress')}
                </strong>
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 2: OVERVIEW CARDS (4 CARDS) */}
          {/* ============================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Winning Team */}
            <div className="p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1">
              <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase block">
                {isTie
                  ? (language === 'en' ? 'Co-Champions (Tie)' : 'ทีมชนะเลิศร่วม (เสมอ)')
                  : (language === 'en' ? 'Top Team' : 'ทีมชนะเลิศ')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span id="scoreboard-top-team" className="font-pixel font-bold text-sm truncate text-[var(--px-text)]" title={joinTeamNames(champions)}>
                  {joinTeamNames(champions)}
                </span>
              </div>
              <span className="text-xs font-bold num block text-[var(--color-accent-strong)]">
                {winner ? formatScore(winner.score, language) : '-'}
                {isTie && (language === 'en' ? ' each' : ' (ต่อทีม)')}
              </span>
              {champions.some((c) => c.students && c.students.length > 0) && (
                <div className="text-[11px] text-[var(--px-text)] truncate font-bold pt-1 border-t border-[var(--px-border)]/20">
                  👥 {champions.flatMap((c) => c.students || []).join(', ')}
                </div>
              )}
            </div>

            {/* Card 2: Questions & Accuracy */}
            <div className="p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1">
              <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase block">
                {language === 'en' ? 'Class Accuracy' : 'ความถูกต้องชั้นเรียน'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="text-lg font-bold num text-[var(--px-text)]">
                  {overview.accuracy}%
                </span>
              </div>
              <span className="text-[13px] text-[var(--px-text-muted)] num block font-bold">
                {overview.totalCorrect} / {overview.totalAnswered} {language === 'en' ? 'correct' : 'ข้อถูก'}
              </span>
            </div>

            {/* Card 3: Total Points Awarded */}
            <div className="p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1">
              <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase block">
                {language === 'en' ? 'Total Points Awarded' : 'คะแนนสะสมรวมทั้งห้อง'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span className="text-lg font-bold num text-[var(--px-text)]">
                  {formatScore(overview.totalPointsAwarded, language)}
                </span>
              </div>
              <span className="text-[13px] text-[var(--px-text-muted)] block font-bold">
                {language === 'en' ? 'Across all teams' : 'รวมทุกทีมที่ร่วมเล่น'}
              </span>
            </div>

            {/* Card 4: Match Duration vs Limit */}
            <div className="p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-1">
              <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase block">
                {language === 'en' ? 'Time Duration' : 'ระยะเวลาแข่งขัน'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <span className="text-lg font-bold num text-[var(--px-text)]">
                  {formatDurationSeconds(overview.durationSecs, language)}
                </span>
              </div>
              <span className="text-[13px] text-[var(--px-text-muted)] num block font-bold">
                {language === 'en' ? 'Limit:' : 'เวลาที่ตั้ง:'} {session.timeLimitMinutes || 10} {t('minutesUnit')}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 3: FINAL RANKING TABLE & PODIUM */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-pixel text-base font-bold text-[var(--px-text)] flex items-center gap-2">
                <PixelIcon name="trophy" size={16} />
                <span>{language === 'en' ? 'Final Standings & Performance' : 'ตารางสรุปผลคะแนนและอันดับการแข่งขัน'}</span>
              </h3>
            </div>

            {session.teams.length > 0 && (
              <div className="py-2">
                <Podium session={session} standings={standings} />
              </div>
            )}

            <div className="overflow-x-auto border-2 border-[var(--px-border)] bg-[var(--px-surface-2)]">
              <table className="w-full text-left text-xs text-[var(--px-text)] border-collapse">
                <thead className="bg-[var(--px-sky)] text-[var(--px-on-sky)] font-pixel text-xs uppercase border-b-2 border-[var(--px-border)]">
                  <tr>
                    <th className="py-2 px-3">{t('rankColumn')}</th>
                    <th className="py-2 px-3">{t('teamNameColumn')}</th>
                    <th className="py-2 px-3">{t('membersColumn')}</th>
                    <th className="py-2 px-3 text-center">{t('correctColumn')}</th>
                    <th className="py-2 px-3 text-center">{t('wrongColumn')}</th>
                    {session.gameType === 'snakes_ladders' && (
                      <th className="py-2 px-3 text-center">{language === 'en' ? 'Tile Reached' : 'ช่องที่เดินถึง'}</th>
                    )}
                    {session.gameType === 'card_matching' && (
                      <>
                        <th className="py-2 px-3 text-center">{t('matchesColumn')}</th>
                        <th className="py-2 px-3 text-center">{t('stealsColumn')}</th>
                      </>
                    )}
                    {session.gameType === 'bingo' && (
                      <>
                        <th className="py-2 px-3 text-center">{t('tilesHeldColumn')}</th>
                        <th className="py-2 px-3 text-center">{t('largestRegionColumn')}</th>
                      </>
                    )}
                    <th className="py-2 px-3 text-right">{t('scoreColumn')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--px-border-muted)]">
                  {standings.map(({ team, rank, isTied }, idx) => {
                    const origIdx = session.teams.findIndex((tm) => tm.id === team.id);
                    const pal = getTeamPalette(team, origIdx >= 0 ? origIdx : idx);
                    const tStat = territoryStats?.[team.id];

                    return (
                      <tr key={team.id} className="hover:bg-[var(--px-surface-sunken)] transition" data-rank={rank}>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`min-w-6 h-6 px-1 inline-flex items-center justify-center font-pixel font-bold text-xs border border-[var(--px-border)] ${
                              rank === 1
                                ? 'bg-[var(--px-yellow)] text-[var(--px-on-yellow)]'
                                : rank === 2
                                ? 'bg-[var(--px-sky)] text-[var(--px-on-sky)]'
                                : rank === 3
                                ? 'bg-[var(--px-pink)] text-[var(--px-on-pink)]'
                                : 'bg-[var(--px-surface)]'
                            }`}
                          >
                            #{rank}
                          </span>
                          {isTied && (
                            <span className="tie-tag ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[var(--color-px-yellow)] text-[#2A2350] border border-[var(--px-border)] align-middle">
                              {t('tieLabel')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 border flex-shrink-0"
                              style={{ backgroundColor: pal.hex, borderColor: pal.outlineHex }}
                            />
                            <span className="font-bold">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1 max-w-sm">
                            {team.students && team.students.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {team.students.map((st) => (
                                  <span
                                    key={st}
                                    className="text-xs px-2 py-0.5 bg-[var(--px-surface)] text-[var(--px-text)] border border-[var(--px-border)] shadow-[1px_1px_0_var(--px-hard-shadow)] font-bold flex items-center gap-1"
                                  >
                                    <span className="text-[10px]">🐱</span>
                                    <span>{st}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[var(--px-text-muted)] italic text-xs">
                                {t('noStudentsYet')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold num text-[var(--px-success-text)]">
                          {team.correctAnswersCount || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold num text-[var(--px-danger-text)]">
                          {team.wrongAnswersCount || 0}
                        </td>
                        {session.gameType === 'snakes_ladders' && (
                          <td className="py-2.5 px-3 text-center font-bold num">
                            {team.pawnPosition || 1}
                          </td>
                        )}
                        {session.gameType === 'card_matching' && (
                          <>
                            <td className="py-2.5 px-3 text-center font-bold num">
                              {team.matchesFound || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold num text-[var(--color-accent-strong)]">
                              {team.stealsCount || 0}
                            </td>
                          </>
                        )}
                        {session.gameType === 'bingo' && (
                          <>
                            <td className="py-2.5 px-3 text-center font-bold num">
                              {tStat?.tilesHeld ?? 0}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold num">
                              {tStat?.largestConnectedRegion ?? 0}
                            </td>
                          </>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold num text-sm text-[var(--px-text)]">
                          {formatScore(team.score, language)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 4: CUMULATIVE SCORE CHART (INLINE SVG) */}
          {/* ============================================================ */}
          <div className="space-y-3 print-break">
            <h3 className="font-pixel text-base font-bold text-[var(--px-text)] flex items-center gap-2">
              <PixelIcon name="star" size={16} />
              <span>{t('cumulativeScoreChartTitle')}</span>
            </h3>

            <div className="p-4 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] space-y-3">
              {/* Inline SVG Line Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 640 220"
                  className="w-full h-auto min-w-[500px]"
                  style={{ maxHeight: '240px' }}
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = 190 - pct * 160;
                    const val = Math.round(pct * chartData.maxScore);
                    return (
                      <g key={i}>
                        <line
                          x1="45"
                          y1={y}
                          x2="620"
                          y2={y}
                          stroke="var(--px-border)"
                          strokeWidth="1"
                          strokeDasharray={pct === 0 ? 'none' : '3,3'}
                          opacity={pct === 0 ? 0.7 : 0.25}
                        />
                        <text
                          x="38"
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="var(--px-text-muted)"
                          fontFamily="Digits, JetBrains Mono, monospace"
                          fontWeight="bold"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Team Polylines & Markers */}
                  {session.teams.map((team, tIdx) => {
                    const pal = getTeamPalette(team, tIdx);
                    const totalSteps = Math.max(1, chartData.pointsHistory.length - 1);
                    const stepWidth = 575 / totalSteps;

                    const pointsStr = chartData.pointsHistory
                      .map((pt, sIdx) => {
                        const x = 45 + sIdx * stepWidth;
                        const score = pt.scores[team.id] || 0;
                        const y = 190 - (score / chartData.maxScore) * 160;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <g key={team.id}>
                        <polyline
                          points={pointsStr}
                          fill="none"
                          stroke={pal.hex}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {chartData.pointsHistory.map((pt, sIdx) => {
                          const x = 45 + sIdx * stepWidth;
                          const score = pt.scores[team.id] || 0;
                          const y = 190 - (score / chartData.maxScore) * 160;
                          return (
                            <circle
                              key={sIdx}
                              cx={x}
                              cy={y}
                              r="3.5"
                              fill={pal.hex}
                              stroke="var(--px-border)"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 border-t border-[var(--px-border-muted)] text-xs font-bold">
                {session.teams.map((team, idx) => {
                  const pal = getTeamPalette(team, idx);
                  return (
                    <div key={team.id} className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 border inline-block"
                        style={{ backgroundColor: pal.hex, borderColor: pal.outlineHex }}
                      />
                      <span>{team.name}</span>
                      <span className="num opacity-80 font-mono">({formatScore(team.score, language)})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 5: QUESTION REVIEW TABLE */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <h3 className="font-pixel text-base font-bold text-[var(--px-text)] flex items-center gap-2">
              <PixelIcon name="computer" size={16} />
              <span>{t('questionReviewTitle')}</span>
            </h3>

            <div className="overflow-x-auto border-2 border-[var(--px-border)] bg-[var(--px-surface-2)]">
              <table className="w-full text-left text-xs text-[var(--px-text)] border-collapse">
                <thead className="bg-[var(--px-yellow)] text-[var(--px-on-yellow)] font-pixel text-xs uppercase border-b-2 border-[var(--px-border)]">
                  <tr>
                    <th className="py-2 px-3 w-12">#</th>
                    <th className="py-2 px-3">{language === 'en' ? 'Question' : 'คำถาม'}</th>
                    <th className="py-2 px-3">{language === 'en' ? 'Model Answer' : 'คำเฉลย'}</th>
                    <th className="py-2 px-3">{language === 'en' ? 'Attempted By' : 'ทีมที่ตอบ'}</th>
                    <th className="py-2 px-3 text-center">{language === 'en' ? 'Outcome' : 'ผลลัพธ์'}</th>
                    <th className="py-2 px-3 text-right">{language === 'en' ? 'Points' : 'คะแนน'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--px-border-muted)]">
                  {session.questions.map((q, idx) => {
                    const qLogs = session.eventLogs.filter(
                      (l) => l.questionId === q.id || (l.details && l.details.includes(q.text.slice(0, 15)))
                    );
                    const isAwarded = (session.awardedQuestionIds || []).includes(q.id) || qLogs.some((l) => l.type === 'correct');
                    const hasWrong = qLogs.some((l) => l.type === 'wrong');
                    const attemptingTeams = Array.from(new Set(qLogs.map((l) => l.teamName).filter(Boolean)));

                    return (
                      <tr key={q.id} className="hover:bg-[var(--px-surface-sunken)] transition">
                        <td className="py-2.5 px-3 font-bold num text-[var(--px-text-muted)]">
                          Q{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold max-w-sm">
                          {q.text}
                          {q.category && (
                            <span className="block text-[13px] text-[var(--px-text-muted)] font-normal mt-0.5">
                              [{q.category}]
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[var(--px-text-muted)]">
                          {q.answer || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-xs">
                          {attemptingTeams.length > 0 ? attemptingTeams.join(', ') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAwarded ? (
                            <span className="px-badge bg-[var(--px-mint)] text-[var(--px-on-mint)] text-xs font-bold">
                              {t('questionStatusCorrect')}
                            </span>
                          ) : hasWrong ? (
                            <span className="px-badge bg-[var(--px-error)] text-[var(--px-text)] text-xs font-bold">
                              {t('questionStatusWrong')}
                            </span>
                          ) : (
                            <span className="px-badge bg-[var(--px-surface-sunken)] text-[var(--px-text-muted)] text-xs">
                              {t('questionStatusUnused')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold num text-[var(--px-text)]">
                          {isAwarded ? `+${q.points}` : '0'} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 6: EVENT TIMELINE */}
          {/* ============================================================ */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-pixel text-base font-bold text-[var(--px-text)] flex items-center gap-2">
                <PixelIcon name="clock" size={16} />
                <span>{t('detailedTimelineTitle')}</span>
              </h3>

              <div className="no-print flex items-center gap-2">
                <select
                  value={selectedTeamFilter}
                  onChange={(e) => setSelectedTeamFilter(e.target.value)}
                  className="px-input py-1 px-2.5 text-xs font-bold bg-[var(--px-surface)]"
                >
                  <option value="all">
                    {t('filterAllLogs', { count: session.eventLogs.length })}
                  </option>
                  {session.teams.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {t('filterOnlyTeam', { name: tItem.name })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-panel-inset p-3 max-h-64 overflow-y-auto space-y-2 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--px-text-muted)] italic">
                  {t('noLogsYet')}
                </div>
              ) : (
                filteredLogs.map((log: GameEventLog) => {
                  const logTeam = log.teamId ? session.teams.find((tItem) => tItem.id === log.teamId) : null;
                  const logTeamIdx = log.teamId ? session.teams.findIndex((tItem) => tItem.id === log.teamId) : -1;
                  const pal = logTeam ? getTeamPalette(logTeam, logTeamIdx >= 0 ? logTeamIdx : 0) : null;

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[var(--px-surface)] border border-[var(--px-border)] shadow-[1px_1px_0_var(--px-hard-shadow)] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 flex items-center justify-center border border-[var(--px-border)] mt-0.5 flex-shrink-0 bg-[var(--px-surface-sunken)]">
                          {log.type === 'correct' ? (
                            <PixelIcon name="star" size={12} />
                          ) : log.type === 'wrong' ? (
                            <PixelIcon name="close" size={12} />
                          ) : log.type === 'game_move' ? (
                            <PixelIcon name="dice" size={12} />
                          ) : (
                            <PixelIcon name="check" size={12} />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            {pal && logTeam && (
                              <span
                                className="px-badge py-0 text-[13px] font-bold"
                                style={{ backgroundColor: pal.hex, borderColor: pal.outlineHex, color: pal.textHex }}
                              >
                                {logTeam.name}
                              </span>
                            )}
                            <span className="font-bold text-[var(--px-text)]">{log.action}</span>
                          </div>
                          <p className="text-[13px] text-[var(--px-text-muted)] font-medium mt-0.5">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {log.pointsChange !== undefined && log.pointsChange > 0 && (
                          <span className="px-badge bg-[var(--px-mint)] text-[var(--px-on-mint)] text-xs font-bold num block">
                            +{log.pointsChange} {t('pointsUnit')}
                          </span>
                        )}
                        <span className="block text-[13px] num text-[var(--px-text-muted)] mt-0.5 font-bold">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 7: ACTIONS BAR */}
          {/* ============================================================ */}
          <div className="no-print pt-3 border-t-2 border-[var(--px-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-report-print"
                onClick={() => {
                  playClickSound();
                  window.print();
                }}
                className="px-btn px-btn-mint px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <PixelIcon name="computer" size={14} />
                <span>{t('printReportBtn')}</span>
              </button>

              <button
                type="button"
                id="btn-report-export-csv"
                onClick={() => {
                  playClickSound();
                  exportSessionToCSV(session);
                }}
                className="px-btn px-btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <PixelIcon name="folder" size={14} />
                <span>{t('exportCSVBtn')}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onDeleteSession && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-btn px-btn-danger px-3 py-2 text-xs font-bold"
                >
                  <PixelIcon name="trash" size={14} />
                  <span>{t('delete')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseAction}
                className="px-btn px-btn-primary px-5 py-2 text-xs font-bold"
              >
                <span>{t('close')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {onDeleteSession && (
        <DeleteSessionModal
          session={session}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirmDelete={(id) => {
            onDeleteSession(id);
            setIsDeleteModalOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
