/**
 * Lecteurs audio et vidéo, avec transcription / sous-titres, et lecteur de documents HTML.
 * Aucune lecture automatique : tout démarre sur action de l'utilisateur.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Hotspot, MediaVariant } from '../game/types';
import { Icon } from './icons';
import { formatTime } from './ui';
import { unlockAudio } from '../game/sound';

function useMediaState(ref: React.RefObject<HTMLMediaElement | null>, volume: number, muted: boolean) {
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => {
      setT(el.currentTime);
      setDur(el.duration || 0);
      setPlaying(!el.paused);
    };
    const onErr = () => setError(true);
    const evs = ['timeupdate', 'durationchange', 'loadedmetadata', 'play', 'pause', 'ended'];
    evs.forEach((ev) => el.addEventListener(ev, on));
    el.addEventListener('error', onErr);
    return () => {
      evs.forEach((ev) => el.removeEventListener(ev, on));
      el.removeEventListener('error', onErr);
    };
  }, [ref]);
  useEffect(() => {
    if (ref.current) {
      ref.current.volume = Math.min(1, Math.max(0, volume));
      ref.current.muted = muted;
    }
  }, [ref, volume, muted]);
  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    unlockAudio();
    if (el.paused) void el.play().catch(() => setError(true));
    else el.pause();
  };
  const seek = (v: number) => {
    if (ref.current) ref.current.currentTime = v;
  };
  return { t, dur, playing, error, toggle, seek };
}

function Controls({ m, label, extra }: { m: ReturnType<typeof useMediaState>; label: string; extra?: React.ReactNode }) {
  return (
    <div className="player-controls">
      <button className="icon-btn" onClick={m.toggle} aria-label={m.playing ? `Pause ${label}` : `Lire ${label}`} style={{ color: '#fff' }}>
        {m.playing ? <Icon.Pause size={22} /> : <Icon.Play size={22} />}
      </button>
      <span className="time">
        {formatTime(m.t)} / {formatTime(m.dur)}
      </span>
      <input
        type="range"
        min={0}
        max={m.dur || 0}
        step={0.1}
        value={Math.min(m.t, m.dur || 0)}
        onChange={(e) => m.seek(Number(e.target.value))}
        aria-label="Position de lecture"
      />
      {extra}
    </div>
  );
}

export function AudioPlayer({ variant, name, volume, muted }: { variant: MediaVariant; name: string; volume: number; muted: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const m = useMediaState(ref, volume, muted);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const active = variant.cues?.findIndex((c) => m.t >= c.start && m.t < c.end) ?? -1;
  useEffect(() => activeRef.current?.scrollIntoView({ block: 'nearest' }), [active]);
  return (
    <>
      <div className="viewer-stage">
        <audio ref={ref} src={variant.src} preload="metadata" />
        <div className="audio-art">
          <Icon.Audio size={64} />
          <div>{name}</div>
          {m.error && <div role="alert">Fichier audio indisponible.</div>}
        </div>
      </div>
      <Controls m={m} label={name} />
      {(variant.cues?.length || variant.transcript) && (
        <section className="viewer-panel" aria-label="Transcription">
          <div className="panel-card transcript">
            <h3 style={{ marginBottom: 6 }}>Transcription</h3>
            {variant.cues?.length
              ? variant.cues.map((c, i) => (
                  <p key={i} ref={i === active ? activeRef : undefined} className={i === active ? 'active' : undefined}>
                    <button onClick={() => m.seek(c.start)} style={{ textAlign: 'left' }}>
                      <span className="time" style={{ color: 'var(--text-3)', marginRight: 8 }}>{formatTime(c.start)}</span>
                      {c.text}
                    </button>
                  </p>
                ))
              : variant.transcript!.split('\n').map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </section>
      )}
    </>
  );
}

export function VideoPlayer({
  variant,
  name,
  volume,
  muted,
  hotspots = [],
  onHotspot,
}: {
  variant: MediaVariant;
  name: string;
  volume: number;
  muted: boolean;
  hotspots?: Hotspot[];
  onHotspot?: (h: Hotspot) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const m = useMediaState(ref, volume, muted);
  const [subs, setSubs] = useState(true);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const up = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    up();
    const ro = new ResizeObserver(up);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = variant.width ?? 16;
  const H = variant.height ?? 9;
  const fit = Math.min(box.w / W, box.h / H) || 0;
  const cue = variant.cues?.find((c) => m.t >= c.start && m.t < c.end);
  const live = hotspots.filter((h) => (h.from ?? -Infinity) <= m.t && m.t <= (h.to ?? Infinity));

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onHotspot || live.length === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - r.left) / r.width;
    const ry = (e.clientY - r.top) / r.height;
    const tol = 22 / r.width;
    const hit = live.find((h) => rx >= h.x - tol && rx <= h.x + h.w + tol && ry >= h.y - tol && ry <= h.y + h.h + tol);
    if (hit) onHotspot(hit);
  };

  const fullscreen = () => {
    const el = stageRef.current as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el?.requestFullscreen) void el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else v?.webkitEnterFullscreen?.();
  };

  return (
    <>
      <div className="viewer-stage" ref={stageRef}>
        <div className="video-wrap" ref={wrapRef}>
          <div className="video-box" style={{ width: W * fit, height: H * fit }} onClick={onTap}>
            <video ref={ref} src={variant.src} poster={variant.poster} playsInline preload="metadata" aria-label={name} />
            {subs && cue && (
              <div className="subtitle" aria-live="polite">
                <span>{cue.text}</span>
              </div>
            )}
          </div>
        </div>
        {m.error && (
          <div className="audio-art" role="alert">
            Vidéo indisponible.
          </div>
        )}
      </div>
      <Controls
        m={m}
        label={name}
        extra={
          <>
            {variant.cues?.length ? (
              <button className="icon-btn" onClick={() => setSubs((s) => !s)} aria-pressed={subs} aria-label="Sous-titres" style={{ fontSize: 12, fontWeight: 700, color: subs ? 'var(--amber)' : 'var(--text-2)' }}>
                ST
              </button>
            ) : null}
            <button className="icon-btn" onClick={fullscreen} aria-label="Plein écran" style={{ color: '#fff' }}>
              <Icon.Expand size={18} />
            </button>
          </>
        }
      />
    </>
  );
}

/** Document HTML local (contenu de l'enquête, considéré comme fiable). */
export function DocView({
  variant,
  name,
  found = [],
  onPassage,
}: {
  variant: MediaVariant;
  name: string;
  /** Passages déjà relevés (attribut `data-obs`). */
  found?: string[];
  onPassage?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasPassages = /data-obs=/.test(variant.html ?? '');
  // Marque les passages déjà relevés, sans jamais signaler ceux qui ne le sont pas.
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-obs]').forEach((el) => {
      el.classList.toggle('passage-found', found.includes(el.dataset.obs ?? ''));
    });
  });
  const [html, setHtml] = useState<string | null>(variant.html ?? null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (variant.html) {
      setHtml(variant.html);
      return;
    }
    let alive = true;
    fetch(variant.src)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => alive && setHtml(t))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [variant]);
  return (
    <div className="viewer-stage">
      <article
        className="doc-page"
        aria-label={name}
        tabIndex={0}
        onClick={(e) => {
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-obs]');
          if (el?.dataset.obs && onPassage) onPassage(el.dataset.obs);
        }}
      >
        {error ? <p>Document indisponible.</p> : html ? <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} /> : <p>Chargement…</p>}
        {hasPassages && onPassage && <p className="doc-hint">Touchez un passage pour le relever dans le dossier.</p>}
      </article>
    </div>
  );
}
