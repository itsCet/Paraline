/**
 * Épreuve « ne bouge plus » (override `stillness`).
 * Le joueur ne doit rien toucher pendant N secondes. Toucher l'écran (ou une touche) déclenche
 * le sursaut : visage plein écran, cri, flash et vibration, puis « Recommence. » et le compte repart.
 * Quitter l'application pendant l'épreuve met fin à l'épreuve (résultat `left`).
 * « Réduire les effets brusques » : pas de flash ni de vibration, apparition en fondu, cri moins fort.
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';

type Phase = 'intro' | 'count' | 'scare' | 'retry';
const GRACE_MS = 2600; // le temps de lever le doigt
const SCARE_MS = 1500;
const RETRY_MS = 1700;

export function Stillness() {
  const { state, dispatch, cases } = useGame();
  const cid = state.overrides.stillness?.caseId;
  const cfg = cid ? cases.byId.get(cid)?.stillness : undefined;
  if (!cid || !cfg) return null;
  return <StillnessRun key={cid} cfg={cfg} sound={state.settings.sound} volume={state.settings.volume} calm={state.settings.reduceFlashes} onResult={(result) => dispatch({ type: 'stillness/result', result })} />;
}

function StillnessRun({
  cfg,
  sound,
  volume,
  calm,
  onResult,
}: {
  cfg: NonNullable<import('../game/types').CaseDefinition['stillness']>;
  sound: boolean;
  volume: number;
  calm: boolean;
  onResult: (r: 'held' | 'left' | 'touched') => void;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [elapsed, setElapsed] = useState(0);
  const phaseRef = useRef<Phase>('intro');
  const startRef = useRef(0);
  const audio = useRef<Record<string, HTMLAudioElement>>({});
  const stepsPlayed = useRef(false);
  const done = useRef(false);
  const vol = Math.max(0, Math.min(1, (volume ?? 80) / 100));

  const play = (key: string, src: string | undefined, opts: { loop?: boolean; v?: number } = {}) => {
    if (!sound || !src) return;
    const a = audio.current[key] ?? new Audio(src);
    audio.current[key] = a;
    a.loop = !!opts.loop;
    a.volume = Math.min(1, vol * (opts.v ?? 1));
    a.currentTime = 0;
    a.play().catch(() => {});
  };
  const stop = (key: string) => audio.current[key]?.pause();

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Préchargement : le visage doit apparaître sans délai.
  useEffect(() => {
    const img = new Image();
    img.src = cfg.scareImage;
  }, [cfg.scareImage]);

  // Enchaînement des phases.
  useEffect(() => {
    let t: number | undefined;
    if (phase === 'intro') {
      play('whisper', cfg.whisper, { v: 1 });
      t = window.setTimeout(() => {
        startRef.current = performance.now();
        stepsPlayed.current = false;
        setElapsed(0);
        play('ambience', cfg.ambience, { loop: true, v: 0.8 });
        go('count');
      }, GRACE_MS);
    } else if (phase === 'scare') {
      stop('ambience');
      stop('steps');
      play('scare', cfg.scareSound, { v: calm ? 0.45 : 1 });
      if (!calm) navigator.vibrate?.([250, 60, 400]);
      t = window.setTimeout(() => go('retry'), SCARE_MS);
    } else if (phase === 'retry') {
      t = window.setTimeout(() => go('intro'), RETRY_MS);
    }
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Le compte : rien ne doit bouger.
  useEffect(() => {
    if (phase !== 'count') return;
    const id = window.setInterval(() => {
      const s = (performance.now() - startRef.current) / 1000;
      setElapsed(s);
      if (!stepsPlayed.current && s >= cfg.seconds - 22) {
        stepsPlayed.current = true;
        play('steps', cfg.steps, { v: 0.9 });
      }
      if (s >= cfg.seconds && !done.current) {
        done.current = true;
        stop('ambience');
        stop('steps');
        onResult('held');
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Le moindre geste pendant le compte déclenche le sursaut ; quitter l'application termine l'épreuve.
  useEffect(() => {
    const touched = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (phaseRef.current !== 'count' || done.current) return;
      onResult('touched');
      go('scare');
    };
    const vis = () => {
      if (document.visibilityState === 'hidden' && !done.current && (phaseRef.current === 'count' || phaseRef.current === 'intro')) {
        done.current = true;
        Object.values(audio.current).forEach((a) => a.pause());
        onResult('left');
      }
    };
    const opts = { capture: true, passive: false } as AddEventListenerOptions;
    for (const ev of ['pointerdown', 'touchstart', 'keydown', 'wheel']) window.addEventListener(ev, touched, opts);
    document.addEventListener('visibilitychange', vis);
    return () => {
      for (const ev of ['pointerdown', 'touchstart', 'keydown', 'wheel']) window.removeEventListener(ev, touched, opts);
      document.removeEventListener('visibilitychange', vis);
      Object.values(audio.current).forEach((a) => a.pause());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const k = Math.min(1, elapsed / cfg.seconds);
  return (
    <div className={`stillness phase-${phase}${calm ? ' calm' : ''}`} role="dialog" aria-modal="true" aria-label={cfg.text} style={{ ['--dark' as string]: String(0.88 + 0.11 * k) }}>
      {(phase === 'intro' || phase === 'count') && (
        <>
          <p className="stillness-text">{cfg.text}</p>
          <div className="stillness-bar" aria-hidden="true">
            <i style={{ transform: `scaleX(${k})` }} />
          </div>
        </>
      )}
      {phase === 'scare' && (
        <div className="stillness-scare" aria-hidden="true">
          <img src={cfg.scareImage} alt="" />
          {!calm && <div className="stillness-flash" />}
        </div>
      )}
      {phase === 'retry' && <p className="stillness-text retry">Recommence.</p>}
    </div>
  );
}
