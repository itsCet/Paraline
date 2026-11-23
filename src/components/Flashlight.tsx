/**
 * Lampe torche : une image plongée dans le noir, éclairée par un faisceau qui suit le doigt,
 * ou l'inclinaison du téléphone. Les zones d'intérêt ne se touchent que dans la lumière.
 * Un calque `reveal` (écriture « UV ») n'est visible que dans le faisceau.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Hotspot } from '../game/types';
import { askOrientation } from './sensors';
import { Icon } from './icons';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Rayon du faisceau, en fraction de la largeur de l’image (0,26 par défaut). */
  radius?: number;
  reveal?: string;
  hotspots?: Hotspot[];
  found?: string[];
  onHotspot?: (h: Hotspot) => void;
  /** Réduire les effets brusques : pas de vacillement. */
  calm?: boolean;
}

const TOLERANCE = 22;

export function Flashlight({ src, alt, width, height, radius = 0.26, reveal, hotspots = [], found = [], onHotspot, calm }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ x: 0.5, y: 0.55 });
  const [tilt, setTilt] = useState(false);
  const [on, setOn] = useState(true);
  const base = useRef<{ b: number; g: number } | null>(null);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const up = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    up();
    const ro = new ResizeObserver(up);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Inclinaison : le faisceau suit le téléphone (repère pris au moment où l'on active le mode).
  useEffect(() => {
    if (!tilt) return;
    base.current = null;
    const onOr = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (!base.current) base.current = { b: e.beta, g: e.gamma };
      const x = 0.5 + (e.gamma - base.current.g) / 50;
      const y = 0.5 + (e.beta - base.current.b) / 50;
      setPos({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
    };
    window.addEventListener('deviceorientation', onOr);
    return () => window.removeEventListener('deviceorientation', onOr);
  }, [tilt]);

  const fit = box.w && box.h ? Math.min(box.w / width, box.h / height) : 0;
  const w = width * fit;
  const h = height * fit;
  const left = (box.w - w) / 2;
  const top = (box.h - h) / 2;
  const r = radius * w;
  const lx = pos.x * w;
  const ly = pos.y * h;
  // Le faisceau : net au centre, fondu sur le bord.
  const beam = `radial-gradient(circle ${r}px at ${lx}px ${ly}px, #000 55%, transparent 100%)`;
  const dark = `radial-gradient(circle ${r}px at ${lx}px ${ly}px, transparent 45%, #000 100%)`;

  const point = (clientX: number, clientY: number) => {
    const el = area.current;
    if (!el || !w) return null;
    const b = el.getBoundingClientRect();
    return { x: (clientX - b.left - left) / w, y: (clientY - b.top - top) / h };
  };
  const move = (e: React.PointerEvent) => {
    if (tilt) return;
    if (e.pointerType === 'mouse' || e.buttons) {
      const p = point(e.clientX, e.clientY);
      if (p) setPos({ x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) });
    }
  };
  const tap = (e: React.MouseEvent) => {
    const p = point(e.clientX, e.clientY);
    if (!p || !on) return;
    // On ne trouve que ce qui est éclairé.
    const lit = Math.hypot((p.x - pos.x) * w, (p.y - pos.y) * h) <= r * 0.85;
    if (!lit) return;
    const tx = TOLERANCE / w;
    const ty = TOLERANCE / h;
    const hit = hotspots.find((z) => p.x >= z.x - tx && p.x <= z.x + z.w + tx && p.y >= z.y - ty && p.y <= z.y + z.h + ty);
    if (hit) onHotspot?.(hit);
  };

  return (
    <div className="flashlight-wrap">
      <div ref={area} className="flashlight" onPointerMove={move} onPointerDown={move} onClick={tap} role="img" aria-label={`${alt} Photo dans le noir : glissez le doigt pour l’éclairer.`}>
        {fit > 0 && (
          <div className="flashlight-stage" style={{ left, top, width: w, height: h }}>
            <img src={src} alt="" draggable={false} />
            {reveal && on && <img className="flashlight-reveal" src={reveal} alt="" draggable={false} style={{ WebkitMaskImage: beam, maskImage: beam }} />}
            <div className={`flashlight-dark${on ? '' : ' off'}${calm ? '' : ' flicker'}`} style={on ? { WebkitMaskImage: dark, maskImage: dark } : undefined} />
            {hotspots
              .filter((z) => found.includes(z.observationId))
              .map((z) => (
                <span key={z.id} className="flashlight-found" style={{ left: `${(z.x + z.w / 2) * 100}%`, top: `${(z.y + z.h / 2) * 100}%` }} aria-hidden="true" />
              ))}
          </div>
        )}
      </div>
      <div className="flashlight-bar">
        <button className={`btn btn-sm ${on ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOn(!on)} aria-pressed={on}>
          <Icon.Bolt size={18} /> {on ? 'Lampe allumée' : 'Lampe éteinte'}
        </button>
        <button
          className={`btn btn-sm ${tilt ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={tilt}
          onClick={() => {
            if (tilt) return setTilt(false);
            void askOrientation().then((ok) => ok && setTilt(true));
          }}
        >
          {tilt ? 'Inclinaison : oui' : 'Éclairer en inclinant'}
        </button>
      </div>
    </div>
  );
}
