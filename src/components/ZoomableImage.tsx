/**
 * Image agrandissable (pincement, molette, double appui, boutons, clavier)
 * avec zones d'intérêt invisibles en coordonnées relatives.
 *
 * Les zones vivent dans le même calque transformé que l'image : elles
 * restent alignées quels que soient le zoom, le déplacement et la taille.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Hotspot } from '../game/types';
import { Icon } from './icons';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  hotspots?: Hotspot[];
  /** Zones déjà découvertes (affichées par un cercle discret). */
  found?: string[];
  onHotspot?: (h: Hotspot) => void;
  /** Zoom programmé (« examiner de plus près »). */
  focus?: { x: number; y: number; scale: number };
  controls?: boolean;
}

const MIN = 1;
const MAX = 5;
const TAP_SLOP = 8;
/** Tolérance tactile minimale autour d'une zone, en pixels écran. */
const TOUCH_TOLERANCE = 22;

export function ZoomableImage({ src, alt, width, height, hotspots = [], found = [], onHotspot, focus, controls = true }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = box.w && box.h ? Math.min(box.w / width, box.h / height) : 0;
  const w0 = width * fit;
  const h0 = height * fit;

  const clamp = useCallback(
    (z: number, x: number, y: number) => {
      const zz = Math.min(MAX, Math.max(MIN, z));
      const mx = Math.max(0, (w0 * zz - box.w) / 2);
      const my = Math.max(0, (h0 * zz - box.h) / 2);
      return { z: zz, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
    },
    [w0, h0, box.w, box.h],
  );

  /** Zoom autour d'un point (coordonnées relatives au centre de la zone d'affichage). */
  const zoomAt = useCallback(
    (nz: number, px = 0, py = 0) => {
      const v = viewRef.current;
      const z = Math.min(MAX, Math.max(MIN, nz));
      const k = z / v.z;
      setView(clamp(z, px - (px - v.x) * k, py - (py - v.y) * k));
    },
    [clamp],
  );

  // Recalage après redimensionnement.
  useEffect(() => {
    setView((v) => clamp(v.z, v.x, v.y));
  }, [clamp]);

  // Réinitialise sur changement d'image.
  useEffect(() => setView({ z: 1, x: 0, y: 0 }), [src]);

  useEffect(() => {
    if (!focus || !w0) return;
    const z = Math.min(MAX, Math.max(MIN, focus.scale));
    setView(clamp(z, -(focus.x - 0.5) * w0 * z, -(focus.y - 0.5) * h0 * z));
  }, [focus, w0, h0, clamp]);

  /* ---------- Gestes ---------- */

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    startView: typeof view;
    startDist?: number;
    moved: boolean;
    t: number;
  } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  const centerOf = (clientX: number, clientY: number) => {
    const r = areaRef.current!.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
  };

  const hitTest = (clientX: number, clientY: number) => {
    const el = contentRef.current;
    if (!el || !onHotspot) return;
    const r = el.getBoundingClientRect();
    const rx = (clientX - r.left) / r.width;
    const ry = (clientY - r.top) / r.height;
    const tx = TOUCH_TOLERANCE / r.width;
    const ty = TOUCH_TOLERANCE / r.height;
    let best: { h: Hotspot; d: number } | null = null;
    for (const h of hotspots) {
      if (rx < h.x - tx || rx > h.x + h.w + tx || ry < h.y - ty || ry > h.y + h.h + ty) continue;
      const d = Math.hypot(rx - (h.x + h.w / 2), ry - (h.y + h.h / 2));
      if (!best || d < best.d) best = { h, d };
    }
    if (best) onHotspot(best.h);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = { startX: e.clientX, startY: e.clientY, startView: viewRef.current, moved: false, t: Date.now() };
    } else if (pts.length === 2) {
      const [a, b] = pts;
      const mid = centerOf((a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current = {
        startX: mid.x,
        startY: mid.y,
        startView: viewRef.current,
        startDist: Math.hypot(a.x - b.x, a.y - b.y),
        moved: true,
        t: Date.now(),
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && g.startDist) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = centerOf((a.x + b.x) / 2, (a.y + b.y) / 2);
      const z = Math.min(MAX, Math.max(MIN, g.startView.z * (dist / g.startDist)));
      const k = z / g.startView.z;
      setView(clamp(z, mid.x - (g.startX - g.startView.x) * k, mid.y - (g.startY - g.startView.y) * k));
    } else if (pts.length === 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (Math.hypot(dx, dy) > TAP_SLOP) g.moved = true;
      if (g.moved && g.startView.z > 1) setView(clamp(g.startView.z, g.startView.x + dx, g.startView.y + dy));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      // Fin de pincement : on repart d'un déplacement simple.
      const [p] = [...pointers.current.values()];
      gesture.current = { startX: p.x, startY: p.y, startView: viewRef.current, moved: true, t: Date.now() };
      return;
    }
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (!g || g.moved || !wasSingle || Date.now() - g.t > 600) return;
    // Appui simple.
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 300 && Math.hypot(prev.x - e.clientX, prev.y - e.clientY) < 30) {
      lastTap.current = null;
      const c = centerOf(e.clientX, e.clientY);
      zoomAt(viewRef.current.z > 1.4 ? 1 : 2.5, c.x, c.y);
      return;
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    const r = areaRef.current!.getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, id: now });
    hitTest(e.clientX, e.clientY);
  };

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = centerOf(e.clientX, e.clientY);
      zoomAt(viewRef.current.z * Math.exp(-e.deltaY * 0.0022), c.x, c.y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const v = viewRef.current;
    const step = 40;
    const map: Record<string, () => void> = {
      '+': () => zoomAt(v.z * 1.4),
      '=': () => zoomAt(v.z * 1.4),
      '-': () => zoomAt(v.z / 1.4),
      '0': () => setView({ z: 1, x: 0, y: 0 }),
      ArrowLeft: () => setView(clamp(v.z, v.x + step, v.y)),
      ArrowRight: () => setView(clamp(v.z, v.x - step, v.y)),
      ArrowUp: () => setView(clamp(v.z, v.x, v.y + step)),
      ArrowDown: () => setView(clamp(v.z, v.x, v.y - step)),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const foundSpots = hotspots.filter((h) => found.includes(h.observationId));

  return (
    <>
      <div
        ref={areaRef}
        className={`zoom-area${view.z > 1 ? ' zoomed' : ''}`}
        tabIndex={0}
        role="img"
        aria-label={`${alt}. Agrandir : pincement, molette, double appui ou touches + et −. Flèches pour se déplacer.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {fit > 0 && (
          <div
            ref={contentRef}
            className="zoom-content"
            style={{
              left: (box.w - w0) / 2,
              top: (box.h - h0) / 2,
              width: w0,
              height: h0,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
            }}
          >
            <img src={src} alt="" draggable={false} />
            {foundSpots.map((h) => {
              const pad = 0.12;
              return (
                <span
                  key={h.id}
                  className="hotspot-mark"
                  style={{
                    left: `${(h.x - h.w * pad) * 100}%`,
                    top: `${(h.y - h.h * pad) * 100}%`,
                    width: `${h.w * (1 + 2 * pad) * 100}%`,
                    height: `${h.h * (1 + 2 * pad) * 100}%`,
                    borderWidth: 2 / view.z,
                  }}
                />
              );
            })}
          </div>
        )}
        {ripple && <span key={ripple.id} className="tap-ripple" style={{ left: ripple.x, top: ripple.y }} />}
      </div>
      {controls && (
        <div className="zoom-controls">
          <button onClick={() => zoomAt(view.z / 1.5)} aria-label="Réduire" disabled={view.z <= 1}>
            <Icon.Minus size={20} />
          </button>
          <button onClick={() => zoomAt(view.z * 1.5)} aria-label="Agrandir" disabled={view.z >= MAX}>
            <Icon.Plus size={20} />
          </button>
          <button onClick={() => setView({ z: 1, x: 0, y: 0 })} aria-label="Image entière" disabled={view.z === 1}>
            <Icon.Expand size={18} />
          </button>
        </div>
      )}
    </>
  );
}
