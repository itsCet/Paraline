/**
 * Photo à 360° (image équirectangulaire 2:1) : on regarde autour de soi en glissant le doigt,
 * en pinçant pour zoomer, ou en bougeant le téléphone. Rendu WebGL maison (un seul quad, la
 * direction de chaque pixel lit l'image), sans bibliothèque. Les zones et les passages utilisent
 * les coordonnées de l'image à plat (x = longitude, y = latitude).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Hotspot } from '../game/types';
import { askOrientation } from './sensors';
import { Icon } from './icons';

interface Exit {
  x: number;
  y: number;
  label: string;
  onGo: () => void;
}

interface Props {
  src: string;
  alt: string;
  hotspots?: Hotspot[];
  found?: string[];
  onHotspot?: (h: Hotspot) => void;
  exits?: Exit[];
  /** Direction de départ (fraction de la largeur de l'image, 0,5 = centre). */
  startYaw?: number;
}

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p; gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D tex;
uniform float yaw, pitch, tanHalf, aspect;
const float PI = 3.14159265;
void main(){
  vec3 d = normalize(vec3(v.x * tanHalf * aspect, v.y * tanHalf, -1.0));
  float cp = cos(pitch), sp = sin(pitch);
  d = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);
  float cy = cos(yaw), sy = sin(yaw);
  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);
  float lon = atan(d.x, -d.z);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  gl_FragColor = texture2D(tex, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI));
}`;

/** Direction (lacet, tangage) → coordonnées de l'image. */
function toUV(yaw: number, pitch: number, nx: number, ny: number, tanHalf: number, aspect: number) {
  let x = nx * tanHalf * aspect;
  let y = ny * tanHalf;
  let z = -1;
  const n = Math.hypot(x, y, z);
  x /= n;
  y /= n;
  z /= n;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  [y, z] = [y * cp + z * sp, -y * sp + z * cp];
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const lon = Math.atan2(x, -z);
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  return { u: lon / (2 * Math.PI) + 0.5, v: 0.5 - lat / Math.PI };
}

/** Coordonnées de l'image → position à l'écran (ou null si derrière). */
function toScreen(u: number, v: number, yaw: number, pitch: number, tanHalf: number, aspect: number) {
  const lon = (u - 0.5) * 2 * Math.PI;
  const lat = (0.5 - v) * Math.PI;
  let x = Math.cos(lat) * Math.sin(lon);
  let y = Math.sin(lat);
  let z = -Math.cos(lat) * Math.cos(lon);
  const cy = Math.cos(-yaw);
  const sy = Math.sin(-yaw);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cp = Math.cos(-pitch);
  const sp = Math.sin(-pitch);
  [y, z] = [y * cp + z * sp, -y * sp + z * cp];
  if (z >= -0.05) return null;
  return { x: x / -z / (tanHalf * aspect), y: y / -z / tanHalf };
}

export function Panorama({ src, alt, hotspots = [], found = [], onHotspot, exits = [], startYaw = 0.5 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const view = useRef({ yaw: (startYaw - 0.5) * 2 * Math.PI, pitch: 0, fov: 75 });
  const [, redraw] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gyro, setGyro] = useState(false);
  const gl = useRef<{ draw: () => void } | null>(null);
  const size = useRef({ w: 1, h: 1 });

  // Mise en place WebGL et chargement de l'image.
  useLayoutEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('webgl', { antialias: true });
    if (!c || !ctx) {
      setFailed(true);
      return;
    }
    const sh = (t: number, s: string) => {
      const o = ctx.createShader(t)!;
      ctx.shaderSource(o, s);
      ctx.compileShader(o);
      return o;
    };
    const prog = ctx.createProgram()!;
    ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VERT));
    ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, FRAG));
    ctx.linkProgram(prog);
    ctx.useProgram(prog);
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, 'p');
    ctx.enableVertexAttribArray(loc);
    ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
    const u = (n: string) => ctx.getUniformLocation(prog, n);
    const tex = ctx.createTexture();
    let loaded = false;
    const draw = () => {
      if (!loaded) return;
      const { w, h } = size.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      ctx.viewport(0, 0, c.width, c.height);
      const t = Math.tan((view.current.fov * Math.PI) / 360);
      ctx.uniform1f(u('yaw'), view.current.yaw);
      ctx.uniform1f(u('pitch'), view.current.pitch);
      ctx.uniform1f(u('tanHalf'), t);
      ctx.uniform1f(u('aspect'), w / h);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    };
    const img = new Image();
    img.onload = () => {
      ctx.bindTexture(ctx.TEXTURE_2D, tex);
      ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
      ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, img);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      loaded = true;
      setReady(true);
      draw();
    };
    img.onerror = () => setFailed(true);
    img.src = src;
    gl.current = { draw };
    return () => {
      gl.current = null;
      ctx.deleteTexture(tex);
      ctx.deleteProgram(prog);
    };
  }, [src]);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const up = () => {
      size.current = { w: el.clientWidth || 1, h: el.clientHeight || 1 };
      gl.current?.draw();
      redraw((n) => n + 1);
    };
    up();
    const ro = new ResizeObserver(up);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const render = () => {
    gl.current?.draw();
    redraw((n) => n + 1);
  };
  const clampPitch = (p: number) => Math.max(-1.4, Math.min(1.4, p));

  // Regarder en bougeant le téléphone.
  useEffect(() => {
    if (!gyro) return;
    let base: { a: number; b: number; yaw: number; pitch: number } | null = null;
    const on = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null) return;
      if (!base) base = { a: e.alpha, b: e.beta, yaw: view.current.yaw, pitch: view.current.pitch };
      const da = ((e.alpha - base.a + 540) % 360) - 180;
      // Tourner le téléphone vers la gauche fait regarder à gauche ; le relever fait regarder en haut.
      view.current.yaw = base.yaw + (da * Math.PI) / 180;
      view.current.pitch = clampPitch(base.pitch - ((e.beta - base.b) * Math.PI) / 180);
      render();
    };
    window.addEventListener('deviceorientation', on);
    return () => window.removeEventListener('deviceorientation', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyro]);

  // Glisser pour regarder, pincer ou molette pour zoomer, toucher pour examiner.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ moved: 0, pinch: 0 });
  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag.current.moved = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const move = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag.current.pinch) view.current.fov = Math.max(35, Math.min(95, view.current.fov * (drag.current.pinch / d)));
      drag.current.pinch = d;
      drag.current.moved += 10;
      return render();
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    drag.current.moved += Math.abs(dx) + Math.abs(dy);
    const k = ((view.current.fov / size.current.h) * Math.PI) / 180;
    // On « attrape » l'image : glisser vers la droite fait regarder à gauche.
    view.current.yaw += dx * k;
    view.current.pitch = clampPitch(view.current.pitch - dy * k);
    render();
  };
  const up = (e: React.PointerEvent) => {
    const was = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (!was || drag.current.moved > 8 || !onHotspot) return;
    const b = wrap.current!.getBoundingClientRect();
    const nx = ((e.clientX - b.left) / b.width) * 2 - 1;
    const ny = 1 - ((e.clientY - b.top) / b.height) * 2;
    const t = Math.tan((view.current.fov * Math.PI) / 360);
    const { u, v } = toUV(view.current.yaw, view.current.pitch, nx, ny, t, b.width / b.height);
    // Tolérance : environ 22 px à l'écran, convertie en fraction de l'image.
    const deg = (22 / b.height) * view.current.fov;
    const tu = deg / 360;
    const tv = deg / 180;
    const hit = hotspots.find((z) => {
      const du = Math.min(Math.abs(u - (z.x + z.w / 2)), 1 - Math.abs(u - (z.x + z.w / 2)));
      return du <= z.w / 2 + tu && v >= z.y - tv && v <= z.y + z.h + tv;
    });
    if (hit) onHotspot(hit);
  };
  const wheel = (e: React.WheelEvent) => {
    view.current.fov = Math.max(35, Math.min(95, view.current.fov + e.deltaY * 0.05));
    render();
  };

  const turn = (deg: number) => {
    view.current.yaw += (deg * Math.PI) / 180;
    render();
  };

  const { w, h } = size.current;
  const t = Math.tan((view.current.fov * Math.PI) / 360);
  const markers = exits
    .map((x) => ({ x, s: toScreen(x.x, x.y, view.current.yaw, view.current.pitch, t, w / h) }))
    .filter((m) => m.s && Math.abs(m.s.x) < 1.1 && Math.abs(m.s.y) < 1.1);
  const foundMarks = hotspots
    .filter((z) => found.includes(z.observationId))
    .map((z) => ({ z, s: toScreen(z.x + z.w / 2, z.y + z.h / 2, view.current.yaw, view.current.pitch, t, w / h) }))
    .filter((m) => m.s && Math.abs(m.s.x) < 1 && Math.abs(m.s.y) < 1);

  return (
    <div className="panorama-wrap">
      <div
        ref={wrap}
        className="panorama"
        role="img"
        aria-label={`${alt} Photo à 360° : glissez pour regarder autour de vous.`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
        onWheel={wheel}
      >
        <canvas ref={canvas} />
        {!ready && !failed && <div className="img-state">Chargement…</div>}
        {failed && <div className="img-state">Vue à 360° indisponible sur cet appareil.</div>}
        {foundMarks.map(({ z, s }) => (
          <span key={z.id} className="flashlight-found" style={{ left: `${((s!.x + 1) / 2) * 100}%`, top: `${((1 - s!.y) / 2) * 100}%` }} aria-hidden="true" />
        ))}
        {markers.map(({ x, s }) => (
          <button
            key={`${x.label}${x.x}`}
            className="panorama-exit"
            style={{ left: `${((s!.x + 1) / 2) * 100}%`, top: `${((1 - s!.y) / 2) * 100}%` }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={x.onGo}
          >
            <Icon.Up size={18} /> {x.label}
          </button>
        ))}
      </div>
      <div className="flashlight-bar">
        <button className="btn btn-secondary btn-sm" onClick={() => turn(45)} aria-label="Tourner à gauche">
          <Icon.ArrowLeft size={18} />
        </button>
        <button
          className={`btn btn-sm ${gyro ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={gyro}
          onClick={() => {
            if (gyro) return setGyro(false);
            void askOrientation().then((ok) => ok && setGyro(true));
          }}
        >
          {gyro ? 'Regarder avec le téléphone : oui' : 'Regarder avec le téléphone'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => turn(-45)} aria-label="Tourner à droite">
          <Icon.ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
