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
    const evs = ['timeupdate', 'durationchange', 'loadedmetadata', 'play', 'pause', 'ended', 'seeked'];
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

export function AudioPlayer({
  variant,
  name,
  volume,
  muted,
  found = [],
  onCue,
}: {
  variant: MediaVariant;
  name: string;
  volume: number;
  muted: boolean;
  found?: string[];
  /** Ligne de transcription touchée qui porte une observation. */
  onCue?: (observationId: string) => void;
}) {
  const empty = !variant.src;
  const ref = useRef<HTMLAudioElement>(null);
  const m = useMediaState(ref, volume, muted);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const active = variant.cues?.findIndex((c) => m.t >= c.start && m.t < c.end) ?? -1;
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  // Une ligne importante écoutée jusqu'au bout est relevée d'elle-même : écouter suffit,
  // inutile de deviner qu'il faut aussi la toucher. Un saut en avant ne compte pas.
  const lastT = useRef(0);
  useEffect(() => {
    const prev = lastT.current;
    lastT.current = m.t;
    if (!onCue || !variant.cues || m.t <= prev || m.t - prev > 1.5) return;
    for (const c of variant.cues) {
      if (!c.observationId || found.includes(c.observationId)) continue;
      const end = m.dur > 0 ? Math.min(c.end, m.dur - 0.25) : c.end;
      if (prev < end && m.t >= end) onCue(c.observationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.t]);
  return (
    <>
      <div className="viewer-stage">
        {!empty && <audio ref={ref} src={variant.src} preload="metadata" />}
        <div className="audio-art">
          <Icon.Audio size={64} />
          <div>{name}</div>
          {empty ? <div>Enregistrement vide · 00:00</div> : m.error && <div role="alert">Fichier audio indisponible. La transcription reste disponible.</div>}
        </div>
      </div>
      {!empty && <Controls m={m} label={name} />}
      {variant.spectrogram && <Spectrogram spec={variant.spectrogram} t={m.t} dur={m.dur} found={found} onHotspot={(id) => onCue?.(id)} />}
      {(variant.cues?.length || variant.transcript) && (
        <section className="viewer-panel" aria-label="Transcription">
          <div className="panel-card transcript">
            <h3 style={{ marginBottom: 6 }}>Transcription</h3>
            {variant.cues?.length
              ? variant.cues.map((c, i) => (
                  <p key={i} ref={i === active ? activeRef : undefined} className={i === active ? 'active' : undefined}>
                    <button
                      onClick={() => {
                        m.seek(c.start);
                        if (c.observationId) onCue?.(c.observationId);
                      }}
                      style={{ textAlign: 'left', ...(c.observationId && found.includes(c.observationId) ? { background: 'var(--amber-soft)', borderRadius: 4 } : {}) }}
                    >
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
      <FrameScrubber m={m} video={ref} fps={variant.fps ?? 30} filmstrip={variant.filmstrip} />
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

/**
 * Lecture image par image, comme dans Photos sur iPhone : on glisse sur la frise (calée sur les images)
 * ou on avance d'une image avec les flèches. Un détail peut n'exister que sur quelques images.
 */
function FrameScrubber({
  m,
  video,
  fps,
  filmstrip,
}: {
  m: ReturnType<typeof useMediaState>;
  video: React.RefObject<HTMLVideoElement | null>;
  fps: number;
  filmstrip?: { src: string; count: number };
}) {
  const total = Math.max(1, Math.floor((m.dur || 0) * fps));
  const frame = Math.min(total - 1, Math.floor(m.t * fps + 1e-3));
  const strip = useRef<HTMLDivElement>(null);
  // Sur mobile (et Safari iPhone), une vidéo jamais lancée n'est pas chargée : changer de position n'affiche
  // rien. Au premier geste, on la lance une fraction de seconde en silence, puis on la met en pause.
  const primed = useRef(false);
  const prime = async (el: HTMLVideoElement) => {
    if (primed.current || el.readyState >= 2) return;
    primed.current = true;
    const muted = el.muted;
    el.muted = true;
    try {
      await el.play();
    } catch {
      /* lecture refusée : la position changera quand même dès que les données arriveront */
    }
    el.pause();
    el.muted = muted;
  };
  const goto = (f: number) => {
    const el = video.current;
    if (!el) return;
    const n = Math.max(0, Math.min(total - 1, f));
    void prime(el).then(() => {
      if (!el.paused) el.pause();
      // Milieu de l'image : évite de retomber sur la précédente à cause des arrondis.
      el.currentTime = (n + 0.5) / fps;
    });
  };
  // Appuis rapides : on part de la position réelle de la vidéo, pas du dernier affichage.
  const step = (d: number) => {
    const el = video.current;
    if (el) goto(Math.floor(el.currentTime * fps + 1e-3) + d);
  };
  const fromPointer = (clientX: number) => {
    const r = strip.current?.getBoundingClientRect();
    if (!r) return;
    goto(Math.round(((clientX - r.left) / r.width) * (total - 1)));
  };
  const drag = useRef(false);
  return (
    <div className="frames" aria-label="Lecture image par image">
      <button className="icon-btn" onClick={() => step(-1)} aria-label="Image précédente" disabled={!m.dur}>
        <Icon.Back size={20} />
      </button>
      <div
        ref={strip}
        className="frames-strip"
        style={filmstrip ? { backgroundImage: `url(${filmstrip.src})`, backgroundSize: '100% 100%' } : undefined}
        role="slider"
        aria-label="Position, image par image"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={frame + 1}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        onPointerDown={(e) => {
          drag.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => drag.current && fromPointer(e.clientX)}
        onPointerUp={() => (drag.current = false)}
      >
        <i style={{ left: `${(frame / Math.max(1, total - 1)) * 100}%` }} />
      </div>
      <button className="icon-btn" onClick={() => step(1)} aria-label="Image suivante" disabled={!m.dur}>
        <Icon.Chevron size={20} />
      </button>
      <span className="frames-count" aria-live="polite">
        {m.playing ? formatTime(m.t) : `Image ${frame + 1}/${total}`}
      </span>
    </div>
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
  // Les passages à relever sont soulignés en pointillé (on sait quoi toucher) ; relevés, ils passent en ambre.
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
        {hasPassages && onPassage && <p className="doc-hint">Touchez un passage souligné pour le relever dans le dossier.</p>}
      </article>
    </div>
  );
}

/** Spectre d'un enregistrement : on « regarde » le son. La ligne ambre suit la lecture ; certaines zones se touchent. */
function Spectrogram({
  spec,
  t,
  dur,
  found,
  onHotspot,
}: {
  spec: NonNullable<MediaVariant['spectrogram']>;
  t: number;
  dur: number;
  found: string[];
  onHotspot: (observationId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="viewer-panel" aria-label="Spectre">
      <button className="btn btn-secondary btn-sm btn-block" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon.Audio size={18} /> {open ? 'Masquer le spectre' : 'Afficher le spectre'}
      </button>
      {open && (
        <div className="spectro" style={{ aspectRatio: `${spec.width} / ${spec.height}` }}>
          <img src={spec.src} alt={spec.alt} />
          {dur > 0 && <i className="spectro-head" style={{ left: `${Math.min(100, (t / dur) * 100)}%` }} aria-hidden="true" />}
          {(spec.hotspots ?? []).map((h) => (
            <button
              key={h.id}
              className={`spectro-zone${found.includes(h.observationId) ? ' found' : ''}`}
              style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.w * 100}%`, height: `${h.h * 100}%` }}
              aria-label="Examiner cette partie du spectre"
              onClick={() => onHotspot(h.observationId)}
            />
          ))}
          <span className="spectro-axis" aria-hidden="true">
            <span>0 Hz</span>
            <span>Temps →</span>
          </span>
        </div>
      )}
    </section>
  );
}
