/**
 * WCAG 2.1 Contrast Checker script for Education Board Game theme tokens.
 * Run via `npm run check:contrast`.
 */

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 
    ? clean.split('').map(c => c + c).join('') 
    : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrast(fg, bg) {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEME_TOKENS = {
  day: {
    bg: '#EEE9FB',
    surface: '#F4F0FF',
    surface2: '#FBF9FF',
    text: '#4A3D8F',
    textMuted: '#5A4BA3',
    border: '#4A3D8F',
    accentStrong: '#D9578F',
    onPastel: '#2A2350',
    pink: '#F8C4DC',
    yellow: '#FFE36E',
    mint: '#A8E6CF',
    sky: '#A8D4F5',
    error: '#FF9AA2',
    teams: {
      red: '#FF8FA3',
      blue: '#7EC8F8',
      green: '#8CE9B8',
      orange: '#FFB870',
      purple: '#C49BFF',
      pink: '#FF9CE3'
    }
  },
  night: {
    bg: '#1F1B3A',
    surface: '#2C2750',
    surface2: '#373163',
    text: '#F3EFFF',
    textMuted: '#CFC7F0',
    border: '#B9A9F0',
    accentStrong: '#FF85BA',
    onPastel: '#2A2350',
    pink: '#E8B4CC',
    yellow: '#F0D565',
    mint: '#97D6BF',
    sky: '#95C4E5',
    error: '#F7A1A8',
    teams: {
      red: '#FF8FA3',
      blue: '#7EC8F8',
      green: '#8CE9B8',
      orange: '#FFB870',
      purple: '#C49BFF',
      pink: '#FF9CE3'
    }
  }
};

let failedCount = 0;

function check(name, fg, bg, threshold) {
  const ratio = getContrast(fg, bg);
  const passed = ratio >= threshold;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}: ${ratio.toFixed(2)}:1 (required >= ${threshold}:1) [fg: ${fg}, bg: ${bg}]`);
  if (!passed) {
    failedCount++;
  }
}

console.log('=== CHECKING DAY THEME CONTRAST ===');
const d = THEME_TOKENS.day;
check('Day Body text on surface', d.text, d.surface, 4.5);
check('Day Body text on surface2', d.text, d.surface2, 4.5);
check('Day Muted text on surface', d.textMuted, d.surface, 4.5);
check('Day Muted text on surface2', d.textMuted, d.surface2, 4.5);
check('Day Border on bg', d.border, d.bg, 3.0);
check('Day Accent strong (large headline) on bg', d.accentStrong, d.bg, 3.0);
check('Day On-pastel text on pink', d.onPastel, d.pink, 4.5);
check('Day On-pastel text on yellow', d.onPastel, d.yellow, 4.5);
check('Day On-pastel text on mint', d.onPastel, d.mint, 4.5);
check('Day On-pastel text on sky', d.onPastel, d.sky, 4.5);
check('Day On-pastel text on error', d.onPastel, d.error, 4.5);
for (const [teamName, color] of Object.entries(d.teams)) {
  check(`Day Team chip text on ${teamName}`, d.onPastel, color, 4.5);
}

console.log('\n=== CHECKING NIGHT THEME CONTRAST ===');
const n = THEME_TOKENS.night;
check('Night Body text on surface', n.text, n.surface, 4.5);
check('Night Body text on surface2', n.text, n.surface2, 4.5);
check('Night Muted text on surface', n.textMuted, n.surface, 4.5);
check('Night Muted text on surface2', n.textMuted, n.surface2, 4.5);
check('Night Border on bg', n.border, n.bg, 3.0);
check('Night Accent strong on bg', n.accentStrong, n.bg, 3.0);
check('Night On-pastel text on pink', n.onPastel, n.pink, 4.5);
check('Night On-pastel text on yellow', n.onPastel, n.yellow, 4.5);
check('Night On-pastel text on mint', n.onPastel, n.mint, 4.5);
check('Night On-pastel text on sky', n.onPastel, n.sky, 4.5);
check('Night On-pastel text on error', n.onPastel, n.error, 4.5);
for (const [teamName, color] of Object.entries(n.teams)) {
  check(`Night Team chip text on ${teamName}`, n.onPastel, color, 4.5);
}

if (failedCount > 0) {
  console.error(`\n❌ Contrast check failed with ${failedCount} violation(s)!`);
  process.exit(1);
} else {
  console.log('\n✅ All contrast checks passed successfully (WCAG AA compliant)!');
  process.exit(0);
}
