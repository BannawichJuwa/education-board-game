import React from 'react';
import { Session } from '../types';
import { RankedTeam, rankTeams } from '../utils/ranking';
import { formatScore } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

/**
 * Podium for places 1-3. Tied teams stand on podiums of the same height with the
 * same medal; a shared first place is labelled "1 (Tie)" (UI-14 co-champions).
 */
const STYLE: Record<number, { height: string; bg: string; medal: string }> = {
  1: { height: 'h-28 sm:h-32', bg: 'bg-[var(--px-yellow)] text-[var(--px-on-yellow)] border-3', medal: '🥇' },
  2: { height: 'h-20 sm:h-24', bg: 'bg-[var(--px-sky)] text-[var(--px-on-sky)] border-2', medal: '🥈' },
  3: { height: 'h-16 sm:h-20', bg: 'bg-[var(--px-pink)] text-[var(--px-on-pink)] border-2', medal: '🥉' },
};

export const Podium: React.FC<{ session: Session; standings?: RankedTeam[] }> = ({ session, standings }) => {
  const { t, language } = useLanguage();
  const entries = (standings || rankTeams(session)).filter((r) => r.rank <= 3).slice(0, 6);
  // First place in the middle, the next places alternate left and right
  const ordered: RankedTeam[] = [];
  entries.forEach((e, i) => (i % 2 === 1 ? ordered.unshift(e) : ordered.push(e)));

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-2xl mx-auto" data-testid="podium">
      {ordered.map(({ team, rank, isTied }) => {
        const st = STYLE[rank] || STYLE[3];
        const label = rank === 1 && isTied ? t('tieRankLabel') : `#${rank}${isTied ? ` (${t('tieLabel')})` : ''}`;
        return (
          <div key={team.id} className="flex-1 min-w-0 max-w-[160px] flex flex-col items-center" data-rank={rank}>
            <span
              className={`text-xs sm:text-sm font-bold truncate max-w-full mb-1 ${
                rank === 1 ? 'text-[var(--color-accent-strong)]' : ''
              }`}
            >
              {team.name}
            </span>
            <span className="text-[13px] font-bold num text-[var(--px-text-muted)] mb-1">
              {formatScore(team.score, language)}
            </span>
            {team.students && team.students.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 max-w-full mb-1">
                {team.students.slice(0, 3).map((name) => (
                  <span
                    key={name}
                    className={`text-[10px] font-bold px-1 border border-[var(--px-border)] truncate max-w-[80px] ${
                      rank === 1 ? 'bg-[var(--color-px-yellow)] text-[#2A2350]' : 'bg-[var(--px-surface-2)] text-[var(--px-text)]'
                    }`}
                  >
                    {name}
                  </span>
                ))}
                {team.students.length > 3 && (
                  <span className="text-[10px] font-bold text-[var(--px-text-muted)] num">+{team.students.length - 3}</span>
                )}
              </div>
            )}
            <div
              className={`podium-block w-full ${st.height} ${st.bg} border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex flex-col items-center justify-center font-pixel font-bold`}
            >
              <span className="text-2xl sm:text-3xl">{rank === 1 ? '🏆' : st.medal}</span>
              <span className="podium-label text-xs sm:text-sm">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
