/**
 * Synthesizes realistic, silky coated-magazine paper sounds via Web Audio API:
 * - Soft pink + brown noise blend (eliminating harsh white-noise static)
 * - Bandpass BiquadFilterNode centered around 800Hz–1400Hz with low Q (0.7)
 * - Micro-variation (±10%) in filter frequency on every interaction
 * - Distinct organic envelopes for subtle initial corner touch vs. full page flip
 */
let sharedAudioCtx: AudioContext | null = null;

export type PaperSoundMode = 'touch' | 'flip';

export interface PaperSoundParams {
  mode: PaperSoundMode;
  filterType: 'bandpass';
  Q: number;
  baseFrequency: number;
  startFrequency: number;
  peakFrequency: number;
  endFrequency: number;
  maxGain: number;
  attackTime: number;
  decayTime: number;
  totalDuration: number;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Generates a smoothed pink + brown noise buffer with natural acoustic rolloff
 * (soft coated-paper texture without metallic high-frequency fizz).
 */
export function generateSoftPaperNoiseSamples(
  length: number,
  randomFn: () => number = Math.random
): Float32Array {
  const data = new Float32Array(Math.max(0, length));
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;

  for (let i = 0; i < data.length; i++) {
    const white = randomFn() * 2 - 1;
    // Paul Kellet refined pink noise approximation
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;

    // Gentle brown noise integration for warm paper fiber body
    brown = (brown + 0.035 * white) / 1.035;
    const sample = pink * 0.62 + brown * 1.45;
    data[i] = Math.max(-1, Math.min(1, sample));
  }

  return data;
}

/**
 * Computes organic filter & gain envelope parameters with ±10% filter micro-variation.
 */
export function computePaperSoundParams(
  mode: PaperSoundMode,
  randomFn: () => number = Math.random
): PaperSoundParams {
  // ±10% micro-variation factor in [0.90, 1.10]
  const freqVariation = 0.9 + randomFn() * 0.2;

  if (mode === 'touch') {
    const baseFrequency = Math.round(980 * freqVariation);
    const attackTime = 0.04;
    const decayTime = 0.15;
    return {
      mode,
      filterType: 'bandpass',
      Q: 0.7,
      baseFrequency,
      startFrequency: Math.round(baseFrequency * 0.92),
      peakFrequency: baseFrequency,
      endFrequency: Math.round(baseFrequency * 0.86),
      maxGain: 0.06,
      attackTime,
      decayTime,
      totalDuration: Number((attackTime + decayTime).toFixed(3)),
    };
  }

  const baseFrequency = Math.round(1120 * freqVariation);
  const maxGain = Number((0.08 + randomFn() * 0.04).toFixed(4));
  const attackTime = 0.12;
  const decayTime = Number((0.45 + randomFn() * 0.1).toFixed(4));

  return {
    mode,
    filterType: 'bandpass',
    Q: 0.7,
    baseFrequency,
    startFrequency: Math.round(baseFrequency * 0.86),
    peakFrequency: Math.round(baseFrequency * 1.12),
    endFrequency: Math.round(baseFrequency * 0.84),
    maxGain,
    attackTime,
    decayTime,
    totalDuration: Number((attackTime + decayTime).toFixed(4)),
  };
}

function playSynthesizedPaperSound(mode: PaperSoundMode): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const params = computePaperSoundParams(mode);
    const now = ctx.currentTime;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * params.totalDuration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    buffer.getChannelData(0).set(generateSoftPaperNoiseSamples(bufferSize));

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = params.filterType;
    filter.Q.setValueAtTime(params.Q, now);
    filter.frequency.setValueAtTime(params.startFrequency, now);
    filter.frequency.exponentialRampToValueAtTime(params.peakFrequency, now + params.attackTime);
    filter.frequency.exponentialRampToValueAtTime(params.endFrequency, now + params.totalDuration);

    const gain = ctx.createGain();
    const minGain = 0.0005;
    gain.gain.setValueAtTime(minGain, now);

    if (mode === 'touch') {
      // Subtle initial finger touch/friction on coated paper
      gain.gain.exponentialRampToValueAtTime(params.maxGain, now + params.attackTime);
      gain.gain.exponentialRampToValueAtTime(minGain, now + params.totalDuration);
    } else {
      // Smooth wave-shaped page-curl sweep: gradual swell + long soft air fade
      gain.gain.exponentialRampToValueAtTime(params.maxGain * 0.55, now + params.attackTime * 0.55);
      gain.gain.exponentialRampToValueAtTime(params.maxGain, now + params.attackTime);
      gain.gain.exponentialRampToValueAtTime(
        params.maxGain * 0.34,
        now + params.attackTime + params.decayTime * 0.45
      );
      gain.gain.exponentialRampToValueAtTime(minGain, now + params.totalDuration);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + params.totalDuration);
  } catch {
    // Ignore audio context errors when autoplay restricted
  }
}

export function playPageTouchSound(): void {
  playSynthesizedPaperSound('touch');
}

export function playPageTurnSound(customSoundUrl?: string | null): void {
  if (customSoundUrl) {
    const audio = new Audio(customSoundUrl);
    audio.volume = 0.5;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }

  playSynthesizedPaperSound('flip');
}

export type CdCaseSoundAction = 'open' | 'close';

export interface CdAcrylicPulseParams {
  delay: number;
  filterType: 'bandpass';
  frequency: number;
  Q: number;
  gain: number;
  decay: number;
}

/**
 * Computes sample-accurate Web Audio parameters for acrylic CD jewel-case snaps:
 * - 'open': crisp double-click (latch release 0.04s + hinge turn 0.08s, 2200–3200Hz bandpass, gain <= 0.12)
 * - 'close': soft dry latch snap (~1800Hz bandpass, 0.05s decay, gain 0.14)
 */
export function computeCdAcrylicSoundParams(
  action: CdCaseSoundAction,
  randomFn: () => number = Math.random
): CdAcrylicPulseParams[] {
  const jitter = (center: number, spread: number) =>
    Math.round(center + (randomFn() - 0.5) * spread);

  if (action === 'open') {
    return [
      {
        delay: 0,
        filterType: 'bandpass',
        frequency: Math.min(3200, Math.max(2200, jitter(2900, 320))),
        Q: 3.1,
        gain: 0.12,
        decay: 0.04,
      },
      {
        delay: 0.065,
        filterType: 'bandpass',
        frequency: Math.min(3200, Math.max(2200, jitter(2420, 280))),
        Q: 2.2,
        gain: 0.095,
        decay: 0.08,
      },
    ];
  }

  return [
    {
      delay: 0,
      filterType: 'bandpass',
      frequency: jitter(1800, 140),
      Q: 3.2,
      gain: 0.14,
      decay: 0.05,
    },
  ];
}

export function playCdCaseSound(action: CdCaseSoundAction): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const pulses = computeCdAcrylicSoundParams(action);
    const now = ctx.currentTime;

    for (const pulse of pulses) {
      const startTime = now + pulse.delay;
      const totalDur = pulse.decay + 0.015;
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * totalDur));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Sharp initial transient + damped plastic resonance noise
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.exp((-i / bufferSize) * 4.2);
        data[i] = (Math.random() * 2 - 1) * (0.45 + 0.55 * env);
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = pulse.filterType;
      filter.frequency.setValueAtTime(pulse.frequency, startTime);
      filter.Q.setValueAtTime(pulse.Q, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(pulse.gain, startTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0005, startTime + pulse.decay);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      src.start(startTime);
      src.stop(startTime + totalDur);
    }
  } catch {
    // Ignore audio context errors when autoplay restricted
  }
}

export function createAudioAnalyser(audioElement: HTMLAudioElement): {
  ctx: AudioContext;
  analyser: AnalyserNode;
} | null {
  const ctx = getAudioContext();
  if (!ctx) return null;

  try {
    const source = ctx.createMediaElementSource(audioElement);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    return { ctx, analyser };
  } catch {
    return null;
  }
}
