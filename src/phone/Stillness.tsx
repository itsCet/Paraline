/**
 * Épreuve « ne bouge plus » (override `stillness`).
 * Un écran explique d'abord pourquoi (`ready`) ; son bouton demande l'accès au mouvement sur iPhone.
 * Le joueur ne doit rien toucher ni bouger pendant N secondes. Toucher l'écran (ou une touche), ou bouger
 * le téléphone (gyroscope, accéléromètre), déclenche le sursaut : visage plein écran, cri, flash et vibration,
 * puis « Recommence. » et le compte repart. Sans capteur ou sans permission, seul le toucher compte.
 * Quitter l'application pendant l'épreuve met fin à l'épreuve (résultat `left`).
 * « Réduire les effets brusques » : pas de flash ni de vibration, apparition en fondu, cri moins fort.
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';

type Phase = 'ready' | 'intro' | 'count' | 'scare' | 'retry';
const GRACE_MS = 2600; // le temps de lever le doigt
const SCARE_MS = 1500;
const RETRY_MS = 1700;
/** Seuils de mouvement : rotation (°/s), accélération hors gravité (m/s²), écart de gravité (m/s²) si l'accélération seule manque. */
const MOTION_ROT = 22;
const MOTION_ACC = 0.8;
const MOTION_TILT = 1.4;
const MOTION_SETTLE_MS = 900;

/** Demande l'accès au mouvement (iPhone : doit être appelé pendant le geste du joueur). */
function askMotion(): Promise<boolean> {
  const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  if (!DM) return Promise.resolve(false);
  if (typeof DM.requestPermission !== 'function') return Promise.resolve(true);
  return DM.requestPermission().then((r) => r === 'granted').catch(() => false);
}

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
  const [phase, setPhase] = useState<Phase>(cfg.ready ? 'ready' : 'intro');
  const [elapsed, setElapsed] = useState(0);
  const phaseRef = useRef<Phase>(cfg.ready ? 'ready' : 'intro');
  const startRef = useRef(0);
  const audio = useRef<Record<string, HTMLAudioElement>>({});
  const stepsPlayed = useRef(false);
  const done = useRef(false);
  // Le réglage de volume va de 0 à 1.
  const vol = Math.max(0, Math.min(1, volume ?? 0.6));

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
  /** iPhone : un son ne peut partir sans geste que s'il a déjà été lancé pendant un geste.
   *  On « amorce » donc chaque son, en silence, au moment où le joueur pose le téléphone :
   *  le cri pourra ensuite partir même si c'est un mouvement qui le déclenche. */
  const prime = (key: string, src: string | undefined) => {
    if (!sound || !src || audio.current[key]) return;
    const a = new Audio(src);
    audio.current[key] = a;
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => {})
      .finally(() => {
        a.muted = false;
      });
  };

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

  const sursaut = () => {
    if (phaseRef.current !== 'count' || done.current) return;
    onResult('touched');
    go('scare');
  };

  // Bouger le téléphone pendant le compte : même effet que toucher l'écran.
  useEffect(() => {
    if (phase !== 'count') return;
    const since = performance.now();
    let base: { x: number; y: number; z: number } | null = null;
    const onMotion = (e: DeviceMotionEvent) => {
      if (performance.now() - since < MOTION_SETTLE_MS) return;
      const r = e.rotationRate;
      const rot = r ? Math.hypot(r.alpha ?? 0, r.beta ?? 0, r.gamma ?? 0) : 0;
      const a = e.acceleration;
      let moved = rot > MOTION_ROT;
      if (a && a.x != null) moved ||= Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) > MOTION_ACC;
      else if (e.accelerationIncludingGravity?.x != null) {
        const g = e.accelerationIncludingGravity;
        const v = { x: g.x ?? 0, y: g.y ?? 0, z: g.z ?? 0 };
        if (!base) base = v;
        moved ||= Math.hypot(v.x - base.x, v.y - base.y, v.z - base.z) > MOTION_TILT;
      }
      if (moved) sursaut();
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Le moindre geste pendant le compte déclenche le sursaut ; quitter l'application termine l'épreuve.
  useEffect(() => {
    const touched = (e: Event) => {
      if (phaseRef.current === 'ready') return; // l'écran d'explication reste utilisable
      e.preventDefault();
      e.stopPropagation();
      sursaut();
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
    <div className={`stillness phase-${phase}${calm ? ' calm' : ''}`} role="dialog" aria-modal="true" aria-label={cfg.text} style={{ ['--dark' as string]: String(phase === 'ready' ? 0.96 : 0.93 + 0.06 * k) }}>
      {phase === 'ready' && cfg.ready && (
        <div className="stillness-ready">
          <h2>{cfg.ready.title}</h2>
          {cfg.ready.text.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              // Appels immédiats dans le geste : conditions imposées par iOS (capteurs et sons).
              void askMotion();
              prime('scare', cfg.scareSound);
              prime('ambience', cfg.ambience);
              prime('steps', cfg.steps);
              play('whisper', cfg.whisper, { v: 1 });
              go('intro');
            }}
          >
            {cfg.ready.button}
          </button>
        </div>
      )}
      {(phase === 'intro' || phase === 'count') && (
        <>
          <div className="stillness-center">
            <p className="stillness-text">{cfg.text}</p>
            {cfg.subtitle && <p className="stillness-sub">{cfg.subtitle}</p>}
            {cfg.warning && phase === 'count' && elapsed >= cfg.warning.afterSeconds && (
              <p className="stillness-warning" aria-label={cfg.warning.text}>
                {[...cfg.warning.text].map((ch, i) => (
                  <span key={i} aria-hidden="true" style={{ animationDelay: `${i * 70}ms` }}>
                    {ch === ' ' ? '\u00a0' : ch}
                  </span>
                ))}
              </p>
            )}
          </div>
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
      {phase === 'retry' && <p className="stillness-text retry">{cfg.retryText ?? 'Recommence.'}</p>}
    </div>
  );
}
