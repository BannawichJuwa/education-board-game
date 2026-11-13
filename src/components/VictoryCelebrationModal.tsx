import React, { useEffect, useState, useMemo } from 'react';
import { FireworksCanvas } from './FireworksCanvas';
import { Session, Team } from '../types';
import { playVictorySound, playClickSound } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import { getTeamPalette, getTerritoryStats } from '../utils/storage';
import { rankTeams, joinTeamNames } from '../utils/ranking';
import { Podium } from './Podium';
import { formatScore, formatDurationSeconds } from '../utils/formatters';
import { PixelIcon } from './PixelIcon';

export type WinReason =
  | 'bingo_line'
  | 'bingo_territory'
  | 'bingo_score'
  | 'snakes_finish'
  | 'snakes_score'
  | 'cards_all_matched'
  | 'cards_score'
  | 'highest_score';

interface VictoryCelebrationModalProps {
  isOpen: boolean;
  session: Session | null;
  winReason?: WinReason;
  onGoToScoreboard: () => void;
  onGoToSessions: () => void;
  onGoToMenu: () => void;
  onRestart?: () => void;
}

export const VictoryCelebrationModal: React.FC<VictoryCelebrationModalProps> = ({
  isOpen,
  session,
  winReason,
  onGoToScoreboard,
  onGoToSessions,
  onGoToMenu,
}) => {
  const { t, language } = useLanguage();
  const [isSettled, setIsSettled] = useState(false);

  // Sound effects and settle animation timer on open
  useEffect(() => {
    if (isOpen) {
      setIsSettled(false);
      playVictorySound();

      // Settle animations into calm idle state after 4 seconds
      const settleTimer = setTimeout(() => {
        setIsSettled(true);
      }, 4000);

      return () => {
        clearTimeout(settleTimer);
      };
    }
  }, [isOpen]);

  // Rankings with ties (1, 1, 3). Every team in first place is a champion.
  const standings = useMemo(() => (session ? rankTeams(session) : []), [session]);
  const champions: Team[] = useMemo(() => standings.filter((r) => r.rank === 1).map((r) => r.team), [standings]);
  const isTie = champions.length > 1;
  const winner: Team | undefined = champions[0];

  // Key stats calculations
  const stats = useMemo(() => {
    if (!session) {
      return { durationSecs: 0, totalAnswered: 0, accuracy: 100, leadChanges: 0 };
    }
    const initialSecs = (session.timeLimitMinutes || 10) * 60;
    const durationSecs = Math.max(0, initialSecs - (session.timeRemainingSeconds ?? 0));
    const totalCorrect = session.teams.reduce((acc, tItem) => acc + (tItem.correctAnswersCount || 0), 0);
    const totalWrong = session.teams.reduce((acc, tItem) => acc + (tItem.wrongAnswersCount || 0), 0);
    const totalAnswered = totalCorrect + totalWrong;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;

    // Calculate lead changes from eventLogs
    let leadChanges = 0;
    let currentLeaderId: string | null = null;
    const runningScores: Record<string, number> = {};
    session.teams.forEach((tItem) => {
      runningScores[tItem.id] = 0;
    });

    (session.eventLogs || []).forEach((log) => {
      if (log.teamId && log.pointsChange && runningScores[log.teamId] !== undefined) {
        runningScores[log.teamId] += log.pointsChange;
        let highest = -1;
        let newLeader: string | null = null;
        Object.entries(runningScores).forEach(([tid, sc]) => {
          if (sc > highest) {
            highest = sc;
            newLeader = tid;
          }
        });
        if (newLeader && currentLeaderId && newLeader !== currentLeaderId) {
          leadChanges++;
        }
        if (newLeader) {
          currentLeaderId = newLeader;
        }
      }
    });

    return { durationSecs, totalAnswered, accuracy, leadChanges };
  }, [session]);

  // Highlights calculation (Longest streak, lucky roller / master matcher)
  const highlights = useMemo(() => {
    if (!session) return [];
    const list: { label: string; text: string; icon: string }[] = [];

    // 1. Longest answer streak
    let bestStreakTeam: Team = session.teams[0];
    let maxCorrect = -1;
    session.teams.forEach((tm) => {
      if ((tm.correctAnswersCount || 0) > maxCorrect) {
        maxCorrect = tm.correctAnswersCount || 0;
        bestStreakTeam = tm;
      }
    });
    if (maxCorrect > 0) {
      list.push({
        label: language === 'en' ? 'Top Answerer' : 'ตอบถูกสูงสุด',
        text: `${bestStreakTeam.name} (${maxCorrect} ${language === 'en' ? 'correct' : 'ข้อ'})`,
        icon: 'star',
      });
    }

    // 2. Game specific highlight
    if (session.gameType === 'snakes_ladders') {
      const topClimber = [...session.teams].sort(
        (a, b) => (b.pawnPosition || 1) - (a.pawnPosition || 1)
      )[0];
      list.push({
        label: language === 'en' ? 'Furthest Explorer' : 'เดินทางไกลสุด',
        text: `${topClimber.name} (${language === 'en' ? 'Tile' : 'ช่องที่'} ${topClimber.pawnPosition || 1})`,
        icon: 'dice',
      });
    } else if (session.gameType === 'card_matching') {
      const topMatches = [...session.teams].sort((a, b) => (b.matchesFound || 0) - (a.matchesFound || 0))[0];
      list.push({
        label: language === 'en' ? 'Master Matcher' : 'ยอดนักจำคู่การ์ด',
        text: `${topMatches.name} (${topMatches.matchesFound || 0} ${language === 'en' ? 'pairs' : 'คู่'})`,
        icon: 'sparkle',
      });
    } else if (session.gameType === 'bingo') {
      const territoryStats = session.bingoState ? getTerritoryStats(session.bingoState, session.teams) : null;
      let maxTiles = 0;
      let topTerritoryTeam = session.teams[0];
      session.teams.forEach((tm) => {
        const held = territoryStats?.[tm.id]?.tilesHeld || 0;
        if (held > maxTiles) {
          maxTiles = held;
          topTerritoryTeam = tm;
        }
      });
      list.push({
        label: language === 'en' ? 'Territory Master' : 'เจ้าแห่งดินแดน',
        text: `${topTerritoryTeam.name} (${maxTiles} ${language === 'en' ? 'tiles' : 'ช่อง'})`,
        icon: 'trophy',
      });
    }

    return list;
  }, [session, language]);

  if (!isOpen || !session || !winner) return null;

  const territoryStats =
    session.gameType === 'bingo' && session.bingoState
      ? getTerritoryStats(session.bingoState, session.teams)
      : null;

  // Plain language win reason sentence
  const getPlainWinReason = () => {
    const ptsStr = formatScore(winner.score, language);
    if (isTie) {
      const names = joinTeamNames(champions);
      if (session.gameType === 'bingo' && !session.bingoState?.winnerTeamId) {
        const held = territoryStats?.[winner.id]?.tilesHeld || 0;
        return language === 'en'
          ? `It's a draw! ${names} share first place with ${held} ${held === 1 ? 'tile' : 'tiles'} and ${ptsStr} each. They are co-champions.`
          : `ผลการแข่งขันเสมอกัน! ${names} ได้อันดับ 1 ร่วมกัน (ยึดได้ทีมละ ${held} ช่อง และ ${ptsStr}) เป็นแชมป์ร่วม`;
      }
      return language === 'en'
        ? `It's a draw! ${names} share first place with ${ptsStr} each. They are co-champions.`
        : `ผลการแข่งขันเสมอกัน! ${names} ได้อันดับ 1 ร่วมกันด้วยคะแนนทีมละ ${ptsStr} เป็นแชมป์ร่วม`;
    }
    if (session.gameType === 'bingo') {
      if (winReason === 'bingo_line' || (session.bingoState?.winnerTeamId && session.bingoState.winnerTeamId === winner.id)) {
        return language === 'en'
          ? `${winner.name} won by completing a BINGO line with ${ptsStr}!`
          : `${winner.name} ชนะการแข่งขันโดยพิชิตเส้นบิงโกได้สำเร็จ ด้วยคะแนน ${ptsStr}!`;
      }
      const wStat = territoryStats?.[winner.id];
      return language === 'en'
        ? `${winner.name} won by holding ${wStat?.tilesHeld || 0} territory ${(wStat?.tilesHeld || 0) === 1 ? 'tile' : 'tiles'} with ${ptsStr}!`
        : `${winner.name} ชนะด้วยการยึดพื้นที่ ${wStat?.tilesHeld || 0} ช่อง ด้วยคะแนนรวม ${ptsStr}!`;
    }

    if (session.gameType === 'snakes_ladders') {
      const targetTile = session.snakesLaddersState?.boardSize || 30;
      if (winReason === 'snakes_finish' || (winner.pawnPosition && winner.pawnPosition >= targetTile)) {
        return language === 'en'
          ? `${winner.name} won by reaching tile ${targetTile} with ${ptsStr}!`
          : `${winner.name} ชนะการแข่งขันโดยเดินถึงช่อง ${targetTile} ด้วยคะแนน ${ptsStr}!`;
      }
      return language === 'en'
        ? `${winner.name} won with the highest score of ${ptsStr}!`
        : `${winner.name} ชนะด้วยคะแนนสะสมสูงสุด ${ptsStr}!`;
    }

    if (session.gameType === 'card_matching') {
      return language === 'en'
        ? `${winner.name} won by scoring ${ptsStr} with ${winner.matchesFound || 0} pairs matched!`
        : `${winner.name} ชนะการแข่งขันด้วยคะแนน ${ptsStr} (จับคู่ได้ ${winner.matchesFound || 0} คู่)!`;
    }

    return language === 'en'
      ? `${winner.name} won with a top score of ${ptsStr}!`
      : `${winner.name} ชนะการแข่งขันด้วยคะแนนสูงสุด ${ptsStr}!`;
  };

  return (
    <>
      {/* Background continuous ambient fireworks (behind modal window, 100% clear & silent) */}
      <FireworksCanvas active={isOpen} mode="background" zIndex={51} />

      {/* Foreground celebratory fireworks (in front of modal window for brief celebration intro, silent) */}
      <FireworksCanvas active={isOpen} mode="foreground" spawnDuration={4000} zIndex={60} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="victory-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 px-modal-overlay overflow-y-auto"
      >
        <div className="px-window w-full max-w-3xl my-auto overflow-hidden relative z-[55] shadow-[8px_8px_0_var(--px-hard-shadow)]">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="flex items-center gap-2 truncate">
            <PixelIcon name="trophy" size={18} />
            <span id="victory-modal-title" className="truncate font-pixel text-sm">
              victory.exe — {isTie ? (language === 'en' ? 'LEVEL CLEAR & DRAW!' : 'ผลเสมอและบทสรุปการแข่งขัน!') : language === 'en' ? 'LEVEL CLEAR & VICTORY!' : 'ชัยชนะและบทสรุปการแข่งขัน!'}
            </span>
          </div>
          <div className="px-titlebar-controls">
            <button
              type="button"
              onClick={onGoToScoreboard}
              className="px-titlebar-btn px-titlebar-btn-close"
              aria-label={t('close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 text-center space-y-5 bg-[var(--px-surface)] text-[var(--px-text)] overflow-y-auto max-h-[85vh] relative">
          {/* Edge-peeking pixel cats along the edges (Motion Layer) */}
          <div
            className={`absolute -top-1 left-6 z-10 pointer-events-none transition-transform duration-700 ${
              isSettled ? 'translate-y-2' : '-translate-y-1 animate-px-wiggle'
            }`}
            aria-hidden="true"
          >
            <span className="text-xl">🐱🐾</span>
          </div>
          <div
            className={`absolute -top-1 right-8 z-10 pointer-events-none transition-transform duration-700 ${
              isSettled ? 'translate-y-2' : '-translate-y-1 animate-px-bob'
            }`}
            aria-hidden="true"
          >
            <span className="text-xl">🐾🐱</span>
          </div>

          {/* 1. Winner Banner & Jumping Mascot */}
          <div className="relative py-2">
            {/* Twinkling Stars around Winner Banner */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {[15, 30, 48, 65, 80, 22, 38, 58, 72, 88].map((pos, idx) => (
                <span
                  key={idx}
                  className={`absolute text-xs ${
                    isSettled ? 'opacity-30' : 'animate-px-sparkle'
                  }`}
                  style={{
                    left: `${pos}%`,
                    top: `${(idx % 3) * 35}%`,
                    animationDelay: `${idx * 0.15}s`,
                    color: idx % 2 === 0 ? 'var(--px-yellow)' : 'var(--color-accent-strong)',
                  }}
                >
                  ✦
                </span>
              ))}
            </div>

            {/* Jumping Pixel Mascot */}
            <div className="flex justify-center mb-2">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--px-yellow)] border-3 border-[var(--px-border)] shadow-[4px_4px_0_var(--px-hard-shadow)] flex items-center justify-center transition-transform ${
                  isSettled ? 'scale-100' : 'animate-bounce'
                }`}
              >
                <span className="text-3xl sm:text-4xl select-none">🏆</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[var(--px-yellow)] border-2 border-[var(--px-border)] font-pixel font-bold text-sm sm:text-base text-[var(--px-on-yellow)] shadow-[3px_3px_0_var(--px-hard-shadow)]">
              <span>★</span>
              <span id="victory-badge">{isTie ? t('drawBadge') : language === 'en' ? 'VICTORY!' : 'ชัยชนะ!'}</span>
              <span>★</span>
            </div>

            {isTie && (
              <div className="mt-2 text-xs font-bold font-pixel text-[var(--color-accent-strong)] uppercase tracking-wider">
                {t('coChampionsTitle')}
              </div>
            )}
            <h2 id="victory-winner-name" className="text-2xl sm:text-3xl font-pixel font-bold mt-1 text-[var(--px-text)]">
              {joinTeamNames(champions)}
            </h2>

            {/* Plain-Language Win Reason Sentence */}
            <p className="text-xs sm:text-sm font-bold text-[var(--px-text)] mt-1.5 max-w-xl mx-auto px-2 leading-relaxed">
              {getPlainWinReason()}
            </p>

            {/* Champion Team Members (every tied team is listed) */}
            {champions.some((c) => c.students && c.students.length > 0) && (
              <div className="mt-3 max-w-xl mx-auto p-2.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--color-accent-strong)]">
                  <PixelIcon name="star" size={14} />
                  <span>{isTie ? t('coChampionMembersTitle') : t('championMembersTitle')}</span>
                </div>
                {champions.map((champ) => (
                  <div key={champ.id} className="space-y-1">
                    {isTie && (
                      <div className="text-[11px] font-bold text-[var(--px-text)]">
                        {champ.name}{' '}
                        <span className="px-1.5 bg-[var(--px-surface)] border border-[var(--px-border)] num">
                          {t('memberCountBadge', { count: champ.students.length })}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {champ.students.map((st) => (
                        <span
                          key={st}
                          className="px-2.5 py-1 bg-[var(--color-px-yellow)] text-[#2A2350] border-2 border-[var(--px-border)] text-xs font-bold shadow-[2px_2px_0_var(--px-hard-shadow)] flex items-center gap-1.5"
                        >
                          <span className="text-xs">🐱</span>
                          <span>{st}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Key Stats Strip (Duration, Questions, Accuracy, Lead Changes) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] text-center">
            <div className="p-1.5 bg-[var(--px-surface)] border border-[var(--px-border-muted)]">
              <span className="text-[13px] block text-[var(--px-text-muted)] font-bold">
                {language === 'en' ? 'Duration' : 'เวลาที่ใช้'}
              </span>
              <span className="text-sm font-bold num text-[var(--px-text)]">
                {formatDurationSeconds(stats.durationSecs, language)}
              </span>
            </div>
            <div className="p-1.5 bg-[var(--px-surface)] border border-[var(--px-border-muted)]">
              <span className="text-[13px] block text-[var(--px-text-muted)] font-bold">
                {language === 'en' ? 'Questions' : 'คำถามทั้งหมด'}
              </span>
              <span className="text-sm font-bold num text-[var(--px-text)]">
                {stats.totalAnswered} {language === 'en' ? 'Qs' : 'ข้อ'}
              </span>
            </div>
            <div className="p-1.5 bg-[var(--px-surface)] border border-[var(--px-border-muted)]">
              <span className="text-[13px] block text-[var(--px-text-muted)] font-bold">
                {language === 'en' ? 'Accuracy' : 'ความแม่นยำ'}
              </span>
              <span className="text-sm font-bold num text-[var(--px-text)]">
                {stats.accuracy}%
              </span>
            </div>
            <div className="p-1.5 bg-[var(--px-surface)] border border-[var(--px-border-muted)]">
              <span className="text-[13px] block text-[var(--px-text-muted)] font-bold">
                {language === 'en' ? 'Lead Changes' : 'เปลี่ยนผู้นำ'}
              </span>
              <span className="text-sm font-bold num text-[var(--px-text)]">
                {stats.leadChanges} {language === 'en' ? 'times' : 'ครั้ง'}
              </span>
            </div>
          </div>

          {/* 3. Podium (tied teams stand at the same height) */}
          <div className="pt-2">
            <Podium session={session} standings={standings} />
          </div>

          {/* 4. Team Result Cards & Game-Specific Stats with Prominent Members */}
          <div className="space-y-2 text-left pt-1">
            <span className="text-[13px] font-bold text-[var(--px-text-muted)] uppercase tracking-wider block">
              {language === 'en' ? 'Final Standings & Team Members' : 'อันดับและสมาชิกแต่ละทีม'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {standings.map(({ team, rank, isTied }, idx) => {
                const tIdx = session.teams.findIndex((tm) => tm.id === team.id);
                const pal = getTeamPalette(team, tIdx >= 0 ? tIdx : idx);
                const tStat = territoryStats?.[team.id];

                return (
                  <div
                    key={team.id}
                    className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 bg-[var(--px-surface-sunken)] border border-[var(--px-border)] font-pixel font-bold flex items-center justify-center flex-shrink-0">
                          #{rank}
                        </span>
                        {isTied && (
                          <span className="tie-tag px-1 text-[10px] font-bold bg-[var(--color-px-yellow)] text-[#2A2350] border border-[var(--px-border)] flex-shrink-0">
                            {t('tieLabel')}
                          </span>
                        )}
                        <span
                          className="w-3.5 h-3.5 border flex-shrink-0"
                          style={{ backgroundColor: pal.hex, borderColor: pal.outlineHex }}
                        />
                        <span className="font-bold truncate text-sm">{team.name}</span>
                      </div>
                      <span className="font-bold num text-sm ml-2 flex-shrink-0 text-[var(--px-text)]">
                        {formatScore(team.score, language)}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="text-[13px] text-[var(--px-text-muted)] flex items-center gap-2 num">
                      <span>
                        {language === 'en' ? 'Correct' : 'ตอบถูก'}: <strong className="text-[var(--px-text)]">{team.correctAnswersCount || 0}</strong>
                      </span>
                      {session.gameType === 'snakes_ladders' && (
                        <span>• {language === 'en' ? 'Tile' : 'ช่อง'} <strong className="text-[var(--px-text)]">{team.pawnPosition || 1}</strong></span>
                      )}
                      {session.gameType === 'card_matching' && (
                        <span>• {language === 'en' ? 'Pairs' : 'คู่'} <strong className="text-[var(--px-text)]">{team.matchesFound || 0}</strong></span>
                      )}
                      {session.gameType === 'bingo' && tStat && (
                        <span>• {language === 'en' ? 'Tiles' : 'ช่อง'} <strong className="text-[var(--px-text)]">{tStat.tilesHeld}</strong></span>
                      )}
                    </div>

                    {/* Members list */}
                    <div className="pt-1.5 border-t border-[var(--px-border)]/20 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[var(--px-text-muted)] flex items-center gap-1">
                        <PixelIcon name="smiley" size={12} />
                        <span>{t('membersColumn')}:</span>
                      </span>
                      {team.students && team.students.length > 0 ? (
                        team.students.map((st) => (
                          <span
                            key={st}
                            className="px-2 py-0.5 bg-[var(--px-surface)] text-[var(--px-text)] border border-[var(--px-border)] text-[11px] font-bold shadow-[1px_1px_0_var(--px-hard-shadow)]"
                          >
                            {st}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[var(--px-text-muted)] italic">
                          {t('noMembersAssigned')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Highlights Section */}
          {highlights.length > 0 && (
            <div className="p-2.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] flex flex-wrap items-center justify-around gap-2 text-xs">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-sm">✨</span>
                  <span className="text-[var(--px-text-muted)] font-bold">{h.label}:</span>
                  <span className="font-bold text-[var(--px-text)]">{h.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 6. Guest 24-hour warning */}
          {session.isGuest && (
            <div
              id="victory-guest-warning"
              className="p-3 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] text-[#2A2350] text-left text-xs leading-relaxed"
            >
              <strong className="block font-pixel">{t('guestBannerTitle')}</strong>
              <span>{t('guestSaveWarning')}</span>
            </div>
          )}

          {/* 7. Action Bar: View Scoreboard / Return to Menu */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-bold">
            <button
              type="button"
              id="btn-celebration-to-scoreboard"
              onClick={() => {
                playClickSound();
                onGoToScoreboard();
              }}
              className="px-btn px-btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              <PixelIcon name="trophy" size={16} />
              <span>{t('viewScoreboardBtn')}</span>
            </button>
            <button
              type="button"
              id="btn-celebration-to-menu"
              onClick={() => {
                playClickSound();
                onGoToMenu();
              }}
              className="px-btn px-btn-pink py-2.5 flex items-center justify-center gap-2"
            >
              <PixelIcon name="computer" size={14} />
              <span>{t('returnToMenuBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);
};
