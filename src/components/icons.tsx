import { useId, type ReactNode, type SVGProps } from 'react';
import type { AppId } from '../game/types';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 22, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...rest,
});

export const Icon = {
  Back: (p: P) => (<svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>),
  Chevron: (p: P) => (<svg {...base(p)}><path d="M9 5l7 7-7 7" /></svg>),
  Down: (p: P) => (<svg {...base(p)}><path d="M5 9l7 7 7-7" /></svg>),
  Up: (p: P) => (<svg {...base(p)}><path d="M5 15l7-7 7 7" /></svg>),
  Search: (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>),
  Clip: (p: P) => (<svg {...base(p)}><path d="M20 11.5l-8.2 8.2a5 5 0 01-7-7L13 4.5a3.3 3.3 0 014.7 4.7l-8.2 8.2a1.7 1.7 0 01-2.4-2.4l7.6-7.6" /></svg>),
  Play: (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M7 4.5v15l12.5-7.5z" /></svg>),
  Pause: (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>),
  Plane: (p: P) => (<svg {...base(p)} fill="currentColor" stroke="none"><path d="M21 15.5v-1.8l-8-5V3.4a1.5 1.5 0 00-3 0v5.3l-8 5v1.8l8-2.5v5.4l-2 1.5v1.4l3.5-1 3.5 1v-1.4l-2-1.5V13z" /></svg>),
  Compose: (p: P) => (<svg {...base(p)}><path d="M12 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6" /><path d="M17.5 3.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z" /></svg>),
  Trash: (p: P) => (<svg {...base(p)}><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" /></svg>),
  Plus: (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>),
  Minus: (p: P) => (<svg {...base(p)}><path d="M5 12h14" /></svg>),
  Close: (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  Check: (p: P) => (<svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>),
  Info: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.1" /></svg>),
  Image: (p: P) => (<svg {...base(p)}><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M20 16l-5-5-8 8" /></svg>),
  Video: (p: P) => (<svg {...base(p)}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10.5l5-3v9l-5-3" /></svg>),
  Audio: (p: P) => (<svg {...base(p)}><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" /></svg>),
  Doc: (p: P) => (<svg {...base(p)}><path d="M14 3.5H7a2 2 0 00-2 2v13a2 2 0 002 2h10a2 2 0 002-2V8.5z" /><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5" /></svg>),
  Expand: (p: P) => (<svg {...base(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>),
  Reset: (p: P) => (<svg {...base(p)}><path d="M4 12a8 8 0 108-8 8 8 0 00-5.7 2.3L4 8.5" /><path d="M4 4v4.5h4.5" /></svg>),
  Folder: (p: P) => (<svg {...base(p)}><path d="M3.5 7a2 2 0 012-2h4l2 2.2h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z" /></svg>),
  Bulb: (p: P) => (<svg {...base(p)}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" /></svg>),
  Save: (p: P) => (<svg {...base(p)}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" /></svg>),
  Compare: (p: P) => (<svg {...base(p)}><rect x="3" y="5" width="8" height="14" rx="1.5" /><rect x="13" y="5" width="8" height="14" rx="1.5" /></svg>),
  Eye: (p: P) => (<svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>),
  Home: (p: P) => (<svg {...base(p)}><path d="M4.5 10.5L12 4l7.5 6.5V19a1 1 0 01-1 1H15v-5.5H9V20H5.5a1 1 0 01-1-1z" /></svg>),
  ArrowRight: (p: P) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  ArrowLeft: (p: P) => (<svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>),
  Calendar: (p: P) => (<svg {...base(p)}><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 16.5h.01M12 16.5h.01" /></svg>),
  Sound: (p: P) => (<svg {...base(p)}><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /></svg>),
  Bolt: (p: P) => (<svg {...base(p)}><path d="M13 3L5 13.5h6L10.5 21 19 10.5h-6z" /></svg>),
  Help: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 015 .9c0 1.7-2.5 2.1-2.5 3.6M12 17v.1" /></svg>),
  Gear: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" /></svg>),
  Message: (p: P) => (<svg {...base(p)}><path d="M20 12a7.5 7.5 0 01-11 6.6L4 20l1.4-4.3A7.5 7.5 0 1120 12z" /></svg>),
};

export function StatusIcons({ airplane }: { airplane: boolean }) {
  return (
    <span className="status-icons" aria-hidden="true">
      {airplane ? (
        <Icon.Plane size={15} />
      ) : (
        <>
          <svg width="18" height="12" viewBox="0 0 18 12">
            <g fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx=".8" />
              <rect x="5" y="5.5" width="3" height="6.5" rx=".8" />
              <rect x="10" y="3" width="3" height="9" rx=".8" />
              <rect x="15" y="0" width="3" height="12" rx=".8" />
            </g>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12">
            <path fill="currentColor" d="M8 2.3c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 008 .4 10.6 10.6 0 00.5 3.5l1.3 1.3A8.7 8.7 0 018 2.3zm0 3.6c1.4 0 2.7.5 3.6 1.4l1.3-1.3A7 7 0 008 4a7 7 0 00-4.9 2l1.3 1.3c1-.9 2.2-1.4 3.6-1.4zM8 9.4l2.2-2.2a3.1 3.1 0 00-4.4 0z" />
          </svg>
        </>
      )}
      <svg width="27" height="13" viewBox="0 0 27 13">
        <rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45" />
        <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
        <path d="M25 4.5v4a2 2 0 000-4z" fill="currentColor" opacity=".45" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Icônes d'applications                                                */
/* ------------------------------------------------------------------ */

export function LogoMark({ size = 40, color }: { size?: number; color?: string }) {
  // Identifiant unique : un dégradé défini dans un élément masqué ne s'afficherait pas ailleurs.
  const id = `logo${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6c987" />
          <stop offset="1" stopColor="#e19a3f" />
        </linearGradient>
      </defs>
      <g fill={color ?? `url(#${id})`}>
        <path d="M24 88V14h52v26l-8 4V22H32v66z" />
        <path d="M68 51l8-4v41h-8z" />
      </g>
    </svg>
  );
}

/** Icônes d'applications : tuile en dégradé doux et pictogramme au trait, sans effet 3D. */
function Tile({ from, to, children }: { from: string; to: string; children: ReactNode }) {
  const id = `t${from.slice(1)}${to.slice(1)}${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="60" height="60" fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

const line = { fill: 'none', strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function AppGlyph({ app }: { app: AppId }) {
  switch (app) {
    case 'mail':
      return (
        <Tile from="#3f8cff" to="#2563eb">
          <rect x="15" y="19" width="30" height="22" rx="4.5" stroke="#fff" {...line} />
          <path d="M16.5 22l13.5 9.5L43.5 22" stroke="#fff" {...line} />
        </Tile>
      );
    case 'messages':
      return (
        <Tile from="#5fd97a" to="#22a845">
          <path d="M30 16c-8.3 0-15 5.6-15 12.6 0 3.8 2 7.2 5.2 9.5-.3 2.2-1.4 4.2-3 5.6 3.2 0 6-1.1 8.1-2.9 1.5.4 3.1.6 4.7.6 8.3 0 15-5.6 15-12.8S38.3 16 30 16z" fill="#fff" />
        </Tile>
      );
    case 'photos':
      return (
        <Tile from="#f7f6f2" to="#e9e7e1">
          {['#f2b84b', '#ef7d57', '#e0567a', '#9d6be0', '#5b8cf0', '#4cc2c4', '#7ccf6a', '#c9d65a'].map((c, i) => (
            <ellipse key={c} cx="30" cy="21.5" rx="4.6" ry="8.5" fill={c} opacity=".78" transform={`rotate(${i * 45} 30 30)`} />
          ))}
        </Tile>
      );
    case 'files':
      return (
        <Tile from="#2c2e36" to="#1d1e24">
          <path d="M15.5 22.5a3 3 0 013-3h7l3 3.4h12.5a3 3 0 013 3V39a3 3 0 01-3 3h-22.5a3 3 0 01-3-3z" stroke="#efb35c" {...line} />
        </Tile>
      );
    case 'voice':
      return (
        <Tile from="#26272d" to="#141519">
          <g stroke="#ff453a" strokeWidth="3.2" strokeLinecap="round">
            <path d="M16 27v6M22 22v16M28 17v26M34 23v14M40 19v22M46 26v8" />
          </g>
        </Tile>
      );
    case 'phone':
      return (
        <Tile from="#5fd97a" to="#22a845">
          <path d="M23.2 16.5c-1-.9-2.6-.8-3.5.2l-2.3 2.6c-1.2 1.4-1.4 3.4-.5 5 3.7 7 9.3 12.6 16.3 16.3 1.6.9 3.6.7 5-.5l2.6-2.3c1-.9 1.1-2.5.2-3.5l-3.4-3.6c-.9-.9-2.3-1.1-3.4-.4l-2.4 1.5c-2.9-1.6-5.3-4-6.9-6.9l1.5-2.4c.7-1.1.5-2.5-.4-3.4z" fill="#fff" />
        </Tile>
      );
    case 'notes':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <rect width="60" height="60" fill="#f6f2e7" />
          <rect width="60" height="16" fill="#f2c94c" />
          <g stroke="#ddd6c4" strokeWidth="1.5">
            <path d="M0 26h60M0 34h60M0 42h60M0 50h60" />
          </g>
        </svg>
      );
    case 'settings':
      return (
        <Tile from="#a3a6ad" to="#6f737b">
          <g transform="translate(14 14) scale(1.333)" stroke="#fff" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
          </g>
        </Tile>
      );
  }
}

export const APP_LABELS: Record<AppId, string> = {
  mail: 'Mail',
  messages: 'Messages',
  photos: 'Photos',
  files: 'Dossiers',
  notes: 'Notes',
  settings: 'Réglages',
  voice: 'Dictaphone',
  phone: 'Téléphone',
};
