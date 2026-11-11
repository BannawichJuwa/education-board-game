// 8-Bit Chiptune Web Audio Synthesizer for Classroom Games (Square + Triangle Oscillators)
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function play8BitTone(
  freq: number,
  startOffset: number,
  duration: number,
  type: 'square' | 'triangle' = 'square',
  volume = 0.06,
  freqEnd?: number
) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
  }

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

// Crisp UI button click
export function playClickSound() {
  play8BitTone(660, 0, 0.045, 'square', 0.04, 880);
}

// Play a bright 8-bit success chime (Correct Answer / Match Found)
export function playCorrectSound() {
  if (!soundEnabled) return;
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    play8BitTone(freq, idx * 0.065, 0.14, 'square', 0.055);
    play8BitTone(freq * 0.5, idx * 0.065, 0.14, 'triangle', 0.05);
  });
}

// Play 8-bit wrong buzz sound
export function playWrongSound() {
  if (!soundEnabled) return;
  play8BitTone(196, 0, 0.12, 'square', 0.06, 155);
  play8BitTone(146.83, 0.11, 0.2, 'square', 0.06, 110);
  play8BitTone(98, 0.11, 0.2, 'triangle', 0.06, 73.4);
}

// Play 8-bit card flip sound
export function playCardFlipSound() {
  if (!soundEnabled) return;
  play8BitTone(440, 0, 0.045, 'triangle', 0.055, 740);
  play8BitTone(740, 0.04, 0.045, 'square', 0.04, 987.77);
}

// Play 8-bit steal sparkle fanfare
export function playStealSound() {
  if (!soundEnabled) return;
  const notes = [587.33, 783.99, 987.77, 1174.66, 1567.98]; // D5, G5, B5, D6, G6
  notes.forEach((f, idx) => {
    play8BitTone(f, idx * 0.05, 0.11, 'square', 0.055);
    play8BitTone(f * 0.5, idx * 0.05, 0.11, 'triangle', 0.045);
  });
}

// Play rising-pitch hop sound per step (1..6)
export function playHopSound(step = 1) {
  if (!soundEnabled) return;
  const clampedStep = Math.max(1, Math.min(8, step));
  const baseFreq = 330 + (clampedStep - 1) * 65;
  play8BitTone(baseFreq, 0, 0.075, 'triangle', 0.065, baseFreq * 1.25);
  play8BitTone(baseFreq * 1.5, 0.02, 0.055, 'square', 0.035);
}

// Play happy ladder climb arpeggio
export function playLadderSound() {
  if (!soundEnabled) return;
  const climb = [392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 783.99];
  climb.forEach((freq, i) => {
    play8BitTone(freq, i * 0.065, 0.08, 'square', 0.045);
    play8BitTone(freq, i * 0.065, 0.08, 'triangle', 0.05);
  });
}

// Play sad sliding snake sound
export function playSnakeSound() {
  if (!soundEnabled) return;
  const slide = [587.33, 523.25, 466.16, 392.0, 329.63, 261.63, 196.0];
  slide.forEach((freq, i) => {
    play8BitTone(freq, i * 0.07, 0.09, 'triangle', 0.06, freq * 0.92);
    play8BitTone(freq * 0.5, i * 0.07, 0.09, 'square', 0.04);
  });
}

// Play territory mode alert sound
export function playTerritoryAlertSound() {
  if (!soundEnabled) return;
  const notes = [440, 554.37, 659.25, 554.37, 880];
  notes.forEach((f, i) => {
    play8BitTone(f, i * 0.08, 0.1, 'square', 0.05);
  });
}

// Play dice roll click sound
export function playDiceRollSound() {
  if (!soundEnabled) return;
  const freqs = [261.63, 392.0, 329.63, 523.25, 440.0, 659.25];
  freqs.forEach((freq, i) => {
    play8BitTone(freq, i * 0.055, 0.04, 'triangle', 0.05);
    play8BitTone(freq * 1.5, i * 0.055, 0.03, 'square', 0.03);
  });
}

// Play 8-bit victory fanfare sound
export function playVictorySound() {
  if (!soundEnabled) return;
  const notes = [
    { freq: 523.25, time: 0, dur: 0.11 },
    { freq: 523.25, time: 0.12, dur: 0.11 },
    { freq: 523.25, time: 0.24, dur: 0.11 },
    { freq: 659.25, time: 0.36, dur: 0.24 },
    { freq: 587.33, time: 0.62, dur: 0.12 },
    { freq: 659.25, time: 0.76, dur: 0.12 },
    { freq: 783.99, time: 0.9, dur: 0.45 },
  ];

  notes.forEach((n) => {
    play8BitTone(n.freq, n.time, n.dur, 'square', 0.055);
    play8BitTone(n.freq * 0.5, n.time, n.dur, 'triangle', 0.05);
  });
}

// Cheerful chiptune cat "mew" sound (short rising square-wave pitch glide, ~180ms)
export function playMewSound() {
  if (!soundEnabled) return;
  play8BitTone(587.33, 0, 0.18, 'square', 0.05, 987.77);
  play8BitTone(293.66, 0, 0.18, 'triangle', 0.04, 493.88);
}
