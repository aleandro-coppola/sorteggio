// Motore audio fatto in casa con la Web Audio API: niente file esterni,
// tutto sintetizzato al volo. Funziona offline e non serve alcun asset.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let mutedCache: boolean | null = null;
const STORAGE = "assenzio-muto";
const VOL = 0.32;

function readMuted(): boolean {
  if (mutedCache !== null) return mutedCache;
  try {
    mutedCache = localStorage.getItem(STORAGE) === "1";
  } catch {
    mutedCache = false;
  }
  return mutedCache;
}

export function isMuted(): boolean {
  return readMuted();
}

export function setMuted(v: boolean): void {
  mutedCache = v;
  try {
    localStorage.setItem(STORAGE, v ? "1" : "0");
  } catch {
    /* pazienza */
  }
  if (master && ctx) {
    master.gain.setTargetAtTime(v ? 0 : VOL, ctx.currentTime, 0.02);
  }
}

export function toggleMuted(): boolean {
  const v = !readMuted();
  setMuted(v);
  return v;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = readMuted() ? 0 : VOL;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ── Mattoni sonori ──
function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  glideTo?: number,
): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(master);
  o.start(at);
  o.stop(at + dur + 0.03);
}

function noise(
  at: number,
  dur: number,
  vol = 0.3,
  type: BiquadFilterType = "lowpass",
  f0 = 1000,
  f1?: number,
): void {
  if (!ctx || !master) return;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(f0, at);
  if (f1) filter.frequency.exponentialRampToValueAtTime(f1, at + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(at);
  src.stop(at + dur + 0.02);
}

// ── Suoni di gioco ──

// Ticchettio della ruota che rallenta seguendo la decelerazione (ease-out cubico).
export function playSpin(durationMs = 4400): void {
  if (isMuted() || !ac() || !ctx) return;
  const D = durationMs / 1000;
  const now = ctx.currentTime;
  noise(now, 0.25, 0.12, "highpass", 400, 1800);
  const N = 30;
  for (let k = 1; k <= N; k++) {
    const t = D * (1 - Math.pow(1 - k / N, 1 / 3));
    tone(1500, now + t, 0.03, "square", 0.06);
  }
}

export function playWin(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // Do-Mi-Sol-Do
  notes.forEach((f, i) => tone(f, now + i * 0.1, 0.5, "triangle", 0.28));
  tone(1568, now + 0.4, 0.6, "sine", 0.14); // brillio finale
}

export function playPop(): void {
  if (isMuted() || !ac() || !ctx) return;
  tone(620, ctx.currentTime, 0.12, "sine", 0.3, 880);
}

export function playBomb(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  noise(now, 0.6, 0.5, "lowpass", 2200, 120);
  tone(140, now, 0.5, "sine", 0.4, 42); // botto grave
  tone(90, now + 0.02, 0.6, "sawtooth", 0.2, 35);
}

export function playJolly(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  [659.25, 880, 1174.66].forEach((f, i) =>
    tone(f, now + i * 0.08, 0.28, "triangle", 0.24),
  );
  tone(1760, now + 0.24, 0.4, "sine", 0.12);
}

export function playMalus(): void {
  if (isMuted() || !ac() || !ctx) return;
  tone(320, ctx.currentTime, 0.3, "sawtooth", 0.22, 150);
}

export function playBonus(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  [392, 523.25, 659.25].forEach((f, i) =>
    tone(f, now + i * 0.09, 0.3, "triangle", 0.22),
  );
}

export function playInvert(): void {
  if (isMuted() || !ac() || !ctx) return;
  noise(ctx.currentTime, 0.4, 0.22, "bandpass", 400, 2600);
}

// Trombetta triste per chi paga / chi perde.
export function playFail(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  [311.13, 293.66, 233.08].forEach((f, i) =>
    tone(f, now + i * 0.18, 0.3, "sawtooth", 0.2),
  );
}

// Tonfo di eliminazione.
export function playOut(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  tone(200, now, 0.35, "sine", 0.3, 60);
  noise(now, 0.2, 0.15, "lowpass", 800, 200);
}

// Gorgoglìo per riempire il contenitore / mescolare.
export function playPour(): void {
  if (isMuted() || !ac() || !ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 9; i++) {
    const t = now + i * 0.05 + Math.random() * 0.02;
    tone(180 + Math.random() * 220, t, 0.09, "sine", 0.12);
  }
}

// Bip singolo con frequenza data (per il conteggio a salire).
export function playBlip(freq: number): void {
  if (isMuted() || !ac() || !ctx) return;
  tone(freq, ctx.currentTime, 0.06, "square", 0.14);
}
