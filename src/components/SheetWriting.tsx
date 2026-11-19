/**
 * Écriture à l'encre posée sur une feuille de photo (SVG vectoriel : reste net au zoom).
 *
 * Mode `unstable` : chaque caractère est remplacé par un autre, toujours différent
 * du vrai caractère, et quelques-uns se recomposent lentement. Le texte réel n'est
 * donc jamais lisible, même par hasard. Avec `calm`, une texture fixe illisible
 * remplace le mouvement (atténuation des effets brusques).
 */
import { useEffect, useMemo, useState } from 'react';
import type { ImageOverlay } from '../game/types';

const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';

function scramble(text: string, seed: number): string {
  let x = seed || 1;
  const rnd = () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
  return [...text]
    .map((ch) => {
      if (ch === ' ') return ' ';
      let g = ch;
      while (g === ch) g = GLYPHS[Math.floor(rnd() * GLYPHS.length)];
      return g;
    })
    .join('');
}

export function SheetWriting({ overlay, calm }: { overlay: ImageOverlay; calm?: boolean }) {
  const unstable = overlay.mode === 'unstable';
  const [tick, setTick] = useState(1);
  useEffect(() => {
    if (!unstable || calm) return;
    // Recomposition lente (aucun clignotement) : une nouvelle forme toutes les ~1,6 s.
    const id = window.setInterval(() => setTick((t) => t + 1), 1600);
    return () => window.clearInterval(id);
  }, [unstable, calm]);

  const lines = useMemo(
    () =>
      overlay.lines.map((l, i) => {
        if (!unstable) return l.text;
        // Chaque ligne évolue à son rythme : seuls certains caractères changent à chaque pas.
        const a = scramble(l.text, (i + 1) * 7919 + Math.floor(tick / (1 + (i % 2))) * 104729);
        const b = scramble(l.text, (i + 3) * 6113 + tick * 15485863);
        return [...a].map((c, k) => (k % 3 === tick % 3 ? b[k] : c)).join('');
      }),
    [overlay.lines, unstable, tick],
  );

  const { box } = overlay;
  return (
    <svg
      className={`sheet-writing${unstable ? ' unstable' : ''}${calm ? ' calm' : ''}${overlay.tone === 'imprint' ? ' imprint' : ''}`}
      viewBox={`0 0 100 ${overlay.viewHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
        transform: overlay.rotate ? `rotate(${overlay.rotate}deg)` : undefined,
      }}
    >
      {overlay.lines.map((l, i) => (
        <text
          key={i}
          x="50"
          y={l.y}
          fontSize={l.size}
          textAnchor="middle"
          textLength={l.width}
          lengthAdjust={l.width ? 'spacingAndGlyphs' : undefined}
          className={unstable && !calm ? `ink ink-${i % 3}` : 'ink'}>
          {lines[i]}
        </text>
      ))}
      {overlay.lines
        .filter((l) => l.strike)
        .map((l, i) => (
          // Trait d'encre irrégulier, tracé à la main par-dessus la ligne.
          <path
            key={`s${i}`}
            className="ink-strike"
            d={`M ${50 - (l.width ?? 60) / 2 - 3} ${l.y - l.size * 0.32} q ${(l.width ?? 60) / 2} ${-1.6} ${(l.width ?? 60) + 6} ${0.9}`}
          />
        ))}
    </svg>
  );
}
