/**
 * Sons d'interface synthétisés (aucun fichier). Le contexte audio n'est créé
 * qu'après une interaction de l'utilisateur, conformément aux navigateurs.
 */
import type { Settings } from './types';

let ctx: AudioContext | null = null;
let unlocked = false;

export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function audioUnlocked() {
  return unlocked && ctx !== null;
}

type Cue = 'notify' | 'tap' | 'found';

export function playCue(cue: Cue, s: Pick<Settings, 'sound' | 'volume'>) {
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

/** Sonnerie d'appel synthétisée (deux tons, 2 s sur 4). Retourne de quoi l'arrêter. */
export function startRing(s: Pick<Settings, 'sound' | 'volume'>): () => void {
  if (!s.sound || s.volume <= 0 || !ctx) return () => {};
  let stopped = false;
  const ring = () => {
    if (stopped || !ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
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
  const id = window.setInterval(ring, 3000);
  return () => {
    stopped = true;
    window.clearInterval(id);
  };
}
