/**
 * Boussole : le cap réel du téléphone (ou, sans capteur, une rose qu'on fait tourner au doigt).
 * Viser une cible fait monter le signal ; la tenir `hold` secondes la trouve.
 */
import { useEffect, useRef, useState } from 'react';
import { angleDiff, askOrientation, watchHeading } from './sensors';

export interface CompassTarget {
  id: string;
  bearing: number;
  tolerance?: number;
  hold?: number;
  label: string;
}

interface Props {
  targets: CompassTarget[];
  found: string[];
  onFound: (id: string) => void;
}

const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export function CompassDial({ targets, found, onFound }: Props) {
  const [heading, setHeading] = useState(0);
  const [live, setLive] = useState(false);
  // Un vrai cap a-t-il été reçu ? Sinon (ordinateur, capteur absent), la rose se tourne au doigt.
  const [sensor, setSensor] = useState(false);
  const [held, setHeld] = useState(0);
  const holdRef = useRef<{ id: string; since: number } | null>(null);
  const dragging = useRef<{ x: number; h: number } | null>(null);

  useEffect(
    () =>
      live
        ? watchHeading((h) => {
            setSensor(true);
            setHeading(h);
          })
        : undefined,
    [live],
  );

  // La cible active la plus proche du cap.
  const active = targets.filter((t) => !found.includes(t.id));
  const near = active
    .map((t) => ({ t, d: Math.abs(angleDiff(heading, t.bearing)) }))
    .sort((a, b) => a.d - b.d)[0];
  const tol = near?.t.tolerance ?? 15;
  const signal = near ? Math.max(0, 1 - near.d / 90) : 0;
  const onTarget = !!near && near.d <= tol;

  // Tenir la direction.
  useEffect(() => {
    if (!onTarget || !near) {
      holdRef.current = null;
      setHeld(0);
      return;
    }
    if (holdRef.current?.id !== near.t.id) holdRef.current = { id: near.t.id, since: performance.now() };
    const id = window.setInterval(() => {
      const h = holdRef.current;
      if (!h) return;
      const s = (performance.now() - h.since) / 1000;
      const need = near.t.hold ?? 3;
      setHeld(Math.min(1, s / need));
      if (s >= need) {
        holdRef.current = null;
        navigator.vibrate?.([60, 40, 120]);
        onFound(near.t.id);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTarget, near?.t.id]);

  // Le téléphone vibre de plus en plus vite quand on approche.
  useEffect(() => {
    if (!sensor || !near || signal < 0.6) return;
    const id = window.setInterval(() => navigator.vibrate?.(15), 900 - signal * 600);
    return () => window.clearInterval(id);
  }, [sensor, near, signal]);

  const cardinal = CARD[Math.round(heading / 45) % 8];
  return (
    <div className="compass">
      <div
        className="compass-rose"
        onPointerDown={(e) => {
          if (sensor) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          dragging.current = { x: e.clientX, h: heading };
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setHeading((((dragging.current.h - (e.clientX - dragging.current.x) * 0.6) % 360) + 360) % 360);
        }}
        onPointerUp={() => (dragging.current = null)}
        role="img"
        aria-label={`Boussole : cap ${Math.round(heading)} degrés, ${cardinal}. Signal ${Math.round(signal * 100)} %.`}
      >
        <svg viewBox="-100 -100 200 200" aria-hidden="true">
          <circle r="96" className="compass-ring" />
          <g style={{ transform: `rotate(${-heading}deg)` }} className="compass-face">
            {Array.from({ length: 72 }, (_, i) => (
              <line key={i} x1="0" y1={-92} x2="0" y2={i % 9 === 0 ? -80 : -86} transform={`rotate(${i * 5})`} className={i % 18 === 0 ? 'major' : undefined} />
            ))}
            {['N', 'E', 'S', 'O'].map((c, i) => (
              <text key={c} x="0" y="-62" transform={`rotate(${i * 90})`} className={c === 'N' ? 'north' : undefined}>
                {c}
              </text>
            ))}
          </g>
          <path d="M0 -98 L7 -84 L-7 -84 Z" className="compass-index" />
          <circle r={18 + signal * 40} className="compass-pulse" style={{ opacity: 0.15 + signal * 0.5 }} />
          <circle r="5" className="compass-dot" />
        </svg>
      </div>
      <div className="compass-read" aria-live="polite">
        <span className="compass-deg">{Math.round(heading)}°</span> <span className="compass-card">{cardinal}</span>
      </div>
      <div className="compass-signal" aria-hidden="true">
        <i style={{ transform: `scaleX(${onTarget ? Math.max(signal, held) : signal})` }} className={onTarget ? 'on' : undefined} />
      </div>
      <p className="compass-hint">
        {active.length === 0
          ? 'Aucun signal pour le moment.'
          : onTarget
            ? `${near!.t.label} · ne bougez plus…`
            : signal > 0.6
              ? 'Le signal se renforce.'
              : 'Tournez-vous lentement pour chercher le signal.'}
      </p>
      {!live && (
        <button className="btn btn-primary btn-block" onClick={() => void askOrientation().then((ok) => ok && setLive(true))}>
          Activer la boussole
        </button>
      )}
      {!sensor && <p className="compass-hint small">{live ? 'Pas de boussole détectée : ' : 'Sans boussole, '}faites tourner la rose avec le doigt.</p>}
    </div>
  );
}
