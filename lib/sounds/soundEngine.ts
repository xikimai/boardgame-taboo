/**
 * Web Audio API Sound Synthesizer for Taboo Game
 *
 * Generates all game sounds programmatically - no external audio files needed.
 * Each sound is designed to provide clear, immediate feedback for game actions.
 */

let audioContext: AudioContext | null = null;

/**
 * Gets or creates the AudioContext. Must be called after user interaction
 * due to browser autoplay policies.
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }

  // Resume if suspended (iOS Safari requirement)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

/**
 * Unlocks audio on iOS Safari by playing a silent buffer.
 * Call this on the first user interaction.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

/**
 * Creates a gain envelope for attack/decay shaping
 */
function createEnvelope(
  ctx: AudioContext,
  attack: number,
  decay: number,
  volume: number = 1
): GainNode {
  const gainNode = ctx.createGain();
  const now = ctx.currentTime;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + attack);
  gainNode.gain.linearRampToValueAtTime(0, now + attack + decay);

  return gainNode;
}

/**
 * Creates white noise buffer for harsh sounds
 */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/**
 * BUZZ - Loud, harsh buzzer sound
 * 150Hz square wave + white noise, 300ms
 */
export function playBuzz(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.3;

  // Square wave oscillator for the main tone
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, now);

  // Gain envelope for the oscillator
  const oscGain = createEnvelope(ctx, 0.01, duration - 0.01, 0.3);

  // White noise for harshness
  const noiseBuffer = createNoiseBuffer(ctx, duration);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Bandpass filter to shape the noise
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, now);
  filter.Q.setValueAtTime(1, now);

  // Noise gain
  const noiseGain = createEnvelope(ctx, 0.01, duration - 0.01, 0.2);

  // Connect oscillator chain
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  // Connect noise chain
  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // Play
  osc.start(now);
  osc.stop(now + duration);
  noiseSource.start(now);
  noiseSource.stop(now + duration);
}

/**
 * CORRECT - Positive chime/ding sound
 * 880Hz → 1320Hz sine sweep, 200ms
 */
export function playCorrect(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.2;

  // Two-tone chord for richness
  const frequencies = [880, 1100];

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, now + duration);

    const gain = createEnvelope(ctx, 0.01, duration - 0.01, 0.15 - i * 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  });
}

/**
 * SKIP - Neutral blip sound
 * 440Hz sine, 100ms
 */
export function playSkip(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.1;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.linearRampToValueAtTime(330, now + duration);

  const gain = createEnvelope(ctx, 0.01, duration - 0.02, 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * TICK - Sharp ticking clock sound
 * 1000Hz sine, 50ms
 */
export function playTick(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.05;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, now);

  const gain = createEnvelope(ctx, 0.005, duration - 0.005, 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * CLICK - Very subtle click for button interactions
 * 2000Hz sine, 20ms
 */
export function playClick(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.02;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, now);

  const gain = createEnvelope(ctx, 0.002, duration - 0.002, 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * GAME OVER - Fanfare/resolution sound
 * Descending chord progression, 500ms
 */
export function playGameOver(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Three-note fanfare
  const notes = [
    { freq: 523.25, start: 0, duration: 0.15 },      // C5
    { freq: 659.25, start: 0.15, duration: 0.15 },   // E5
    { freq: 783.99, start: 0.3, duration: 0.3 },     // G5 (longer)
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now + start);
    gainNode.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + start + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration);
  });
}

/**
 * JOIN - Soft pop sound when player joins
 * Quick ascending tone, 80ms
 */
export function playJoin(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.08;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + duration);

  const gain = createEnvelope(ctx, 0.01, duration - 0.01, 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * START - Energetic swoosh sound for turn/game start
 * Rising frequency sweep with harmonics, 150ms
 */
export function playStart(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.15;

  // Main swoosh
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + duration);

  // Low-pass filter for smoothness
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.frequency.linearRampToValueAtTime(3000, now + duration);

  const gain = createEnvelope(ctx, 0.02, duration - 0.02, 0.12);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}
