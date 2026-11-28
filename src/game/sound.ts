/**
 * Sound design : sons du téléphone et sons hantés (fichiers dans /media/sfx), vibrations.
 * Le contexte audio n'est créé qu'après une interaction de l'utilisateur (règle des navigateurs) ;
 * les sons sont alors chargés une fois. Tant qu'un son n'est pas prêt, un son synthétisé le remplace.
 */
import type { Settings } from './types';

type S = Pick<Settings, 'sound' | 'volume'>;

const SFX = {
  signature: 'signature.mp3',
  notif: 'notif.mp3',
  envoi: 'envoi.mp3',
  deverrouillage: 'deverrouillage.mp3',
  verrou: 'verrou.mp3',
  obturateur: 'obturateur.mp3',
  trouve: 'trouve.mp3',
  sonnerie: 'sonnerie.mp3',
  glitch: 'glitch.mp3',
  souffle: 'souffle.mp3',
  'murmure-la': 'murmure-la.mp3',
  'murmure-pres': 'murmure-pres.mp3',
  'murmure-froid': 'murmure-froid.mp3',
} as const;
export type Sfx = keyof typeof SFX;

/** Volume propre à chaque son (les sons d'interface restent discrets). */
const LEVEL: Partial<Record<Sfx, number>> = { notif: 0.7, envoi: 0.5, deverrouillage: 0.6, verrou: 0.6, obturateur: 0.8, trouve: 0.7, souffle: 1, glitch: 0.6 };

let ctx: AudioContext | null = null;
let unlocked = false;
const buffers = new Map<Sfx, AudioBuffer>();
const loading = new Map<Sfx, Promise<unknown>>();

function load() {
  if (!ctx) return;
  const base = `${import.meta.env.BASE_URL ?? '/'}media/sfx/`;
  for (const [name, file] of Object.entries(SFX) as [Sfx, string][]) {
    const p = fetch(base + file)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then(
        (data) =>
          new Promise<AudioBuffer>((ok, ko) => {
            // Safari ancien : decodeAudioData à rappels seulement.
            const p = ctx!.decodeAudioData(data, ok, ko);
            if (p && typeof p.then === 'function') p.then(ok, ko);
          }),
      )
      .then((b) => buffers.set(name, b))
      .catch(() => {
        /* le son reste facultatif */
      });
    loading.set(name, p);
  }
}

export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
    load();
  } catch {
    ctx = null;
  }
}

export function audioUnlocked() {
  return unlocked && ctx !== null;
}

/** Joue un son. Retourne false s'il n'a pas pu être joué (son coupé, pas encore chargé…). */
export function playSfx(name: Sfx, s: S, gain = 1): boolean {
  if (!s.sound || s.volume <= 0 || !ctx) return false;
  const b = buffers.get(name);
  if (!b) return false;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = b;
    g.gain.value = s.volume * (LEVEL[name] ?? 1) * gain;
    src.connect(g).connect(ctx.destination);
    src.start();
    return true;
  } catch {
    return false;
  }
}

/** Joue un son dès qu'il est chargé (s'il arrive avant `maxDelayMs`, sinon il est abandonné). */
export function playSfxSoon(name: Sfx, s: S, maxDelayMs = 1500) {
  if (playSfx(name, s)) return;
  const t = Date.now();
  void loading.get(name)?.then(() => {
    if (Date.now() - t <= maxDelayMs) playSfx(name, s);
  });
}

/** Vibration (sans effet là où le navigateur ne la permet pas, comme sur iPhone). */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* sans vibreur */
  }
}

type Cue = 'notify' | 'tap' | 'found';

export function playCue(cue: Cue, s: S) {
  if (cue === 'notify') buzz(25);
  if (cue === 'found') buzz([15, 50, 25]);
  if (cue === 'notify' && playSfx('notif', s)) return;
  if (cue === 'found' && playSfx('trouve', s)) return;
  synth(cue, s);
}

function synth(cue: Cue, s: S) {
  if (!s.sound || s.volume <= 0 || !ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const notes = cue === 'notify' ? [880, 1320] : cue === 'found' ? [660, 990] : [1200];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const start = t + i * 0.09;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.12 * s.volume, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + (cue === 'tap' ? 0.06 : 0.35));
      o.connect(g).connect(ctx!.destination);
      o.start(start);
      o.stop(start + 0.4);
    });
  } catch {
    /* le son reste facultatif */
  }
}

/** Réglages courants et enquête hantée en cours, tenus à jour par le téléphone. */
let ambient: { s: S; haunted: boolean } = { s: { sound: false, volume: 0 }, haunted: false };
export function setSoundContext(s: S, haunted: boolean) {
  ambient = { s, haunted };
}

/** Murmure du chaud-froid (enquêtes hantées seulement) : pas à chaque toucher, et jamais coup sur coup. */
let lastWhisper = 0;
export function whisperHeat(heat: 'chaud' | 'tiede' | 'froid') {
  const { s, haunted } = ambient;
  if (!haunted) return;
  const now = Date.now();
  if (now - lastWhisper < 3500) return;
  const chance = heat === 'chaud' ? 0.8 : heat === 'tiede' ? 0.45 : 0.15;
  if (Math.random() > chance) return;
  const name: Sfx = heat === 'chaud' ? 'murmure-la' : heat === 'tiede' ? 'murmure-pres' : 'murmure-froid';
  if (playSfx(name, s, 0.9)) lastWhisper = now;
}

/** Sonnerie d'appel (fichier, sinon deux tons synthétisés), en boucle. Retourne de quoi l'arrêter. */
export function startRing(s: S): () => void {
  if (!s.sound || s.volume <= 0 || !ctx) return () => {};
  let stopped = false;
  let current: AudioBufferSourceNode | null = null;
  const ring = () => {
    if (stopped || !ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const b = buffers.get('sonnerie');
      if (b) {
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = b;
        g.gain.value = 0.8 * s.volume;
        src.connect(g).connect(ctx.destination);
        src.start();
        current = src;
        return;
      }
      const t = ctx.currentTime;
      for (let k = 0; k < 2; k++) {
        const start = t + k * 0.5;
        [440, 480].forEach((f) => {
          const o = ctx!.createOscillator();
          const g = ctx!.createGain();
          o.frequency.value = f;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.06 * s.volume, start + 0.02);
          g.gain.setValueAtTime(0.06 * s.volume, start + 0.4);
          g.gain.linearRampToValueAtTime(0, start + 0.45);
          o.connect(g).connect(ctx!.destination);
          o.start(start);
          o.stop(start + 0.5);
        });
      }
    } catch {
      /* le son reste facultatif */
    }
  };
  ring();
  const id = window.setInterval(ring, 3500);
  return () => {
    stopped = true;
    window.clearInterval(id);
    try {
      current?.stop();
    } catch {
      /* déjà arrêté */
    }
  };
}
