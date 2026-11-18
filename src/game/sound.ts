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
