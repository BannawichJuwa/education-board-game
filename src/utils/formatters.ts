/**
 * Shared date, time, and number formatters.
 * Guarantees CE (Gregorian) calendar and Latin digits (0-9) in both English and Thai.
 */

export function formatDate(
  dateInput?: number | string | Date,
  lang: 'en' | 'th' = 'en',
  includeTime: boolean = false
): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const locale = lang === 'th' ? 'th-TH-u-ca-gregory-nu-latn' : 'en-US';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };

  const formatted = d.toLocaleDateString(locale, options);
  if (lang === 'th' && includeTime) {
    return `${formatted} น.`;
  }
  return formatted;
}

export function formatDateTime(
  timestamp?: number | string | Date,
  lang: 'en' | 'th' = 'en'
): string {
  return formatDate(timestamp, lang, true);
}

export function formatThaiDateTime(timestamp?: number): string {
  return formatDateTime(timestamp, 'th');
}

export function formatTime(
  timestamp?: number | string | Date,
  _lang: 'en' | 'th' = 'en'
): string {
  if (!timestamp) return '-';
  const d = typeof timestamp === 'object' && timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatNumber(n: number, _lang: 'en' | 'th' = 'en'): string {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Ensures scores are always displayed with an explicit unit label
 */
export function formatScore(score: number, lang: 'en' | 'th' = 'en'): string {
  const unit = lang === 'th' ? 'คะแนน' : 'pts';
  return `${formatNumber(score, lang)} ${unit}`;
}

/**
 * Ensures duration in seconds is formatted with units (e.g. "05:00 min")
 */
export function formatDurationSeconds(seconds: number, lang: 'en' | 'th' = 'en'): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const unit = lang === 'th' ? 'นาที' : 'min';
  return `${timeStr} ${unit}`;
}
