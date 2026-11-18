import type { SVGProps } from 'react';
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

export function LogoMark({ size = 40, color = '#E0A84A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g fill={color}>
        <path d="M24 88V14h52v26l-8 4V22H32v66z" />
        <path d="M68 51l8-4v41h-8z" />
      </g>
    </svg>
  );
}

export function AppGlyph({ app }: { app: AppId }) {
  switch (app) {
    case 'mail':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1fa3ff" /><stop offset="1" stopColor="#1463f3" /></linearGradient></defs>
          <rect width="60" height="60" fill="url(#gm)" />
          <rect x="11" y="17" width="38" height="26" rx="3" fill="#fff" />
          <path d="M12 19l18 13 18-13" stroke="#1a73f5" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
        </svg>
      );
    case 'messages':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5ff777" /><stop offset="1" stopColor="#12bf3a" /></linearGradient></defs>
          <rect width="60" height="60" fill="url(#gs)" />
          <path d="M30 14c-10.5 0-19 6.7-19 15 0 4.7 2.8 8.9 7.1 11.7-.4 2.6-1.8 5-3.9 6.8 3.7-.2 7-1.6 9.6-3.9 1.9.4 4 .6 6.2.6 10.5 0 19-6.7 19-15.1S40.5 14 30 14z" fill="#fff" />
        </svg>
      );
    case 'photos':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <rect width="60" height="60" fill="#fff" />
          {['#f9b934', '#f5772e', '#ec3d4f', '#c34fd4', '#5a6cf0', '#2fb3ef', '#38c95c', '#b8d93a'].map((c, i) => (
            <ellipse key={c} cx="30" cy="18.5" rx="6.5" ry="11" fill={c} opacity=".85" transform={`rotate(${i * 45} 30 30)`} style={{ mixBlendMode: 'multiply' }} />
          ))}
        </svg>
      );
    case 'files':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <rect width="60" height="60" fill="#0d0d0f" />
          <g transform="translate(12 11) scale(.36)" fill="#E0A84A">
            <path d="M24 88V14h52v26l-8 4V22H32v66z" />
            <path d="M68 51l8-4v41h-8z" />
          </g>
        </svg>
      );
    case 'notes':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <rect width="60" height="60" fill="#fdfdfb" />
          <rect width="60" height="17" fill="#fdd54a" />
          <g stroke="#d9d6cc" strokeWidth="1.6">
            <path d="M8 27h44M8 35h44M8 43h44M8 51h44" />
          </g>
          <path d="M8 21h44" stroke="#e6b92e" strokeWidth="1" strokeDasharray="1.5 3" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 60 60" aria-hidden="true">
          <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a5a8ae" /><stop offset="1" stopColor="#6e7279" /></linearGradient></defs>
          <rect width="60" height="60" fill="url(#gg)" />
          <circle cx="30" cy="30" r="19" fill="#3a3d42" />
          <g fill="#c9ccd1">
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x="28" y="10" width="4" height="8" rx="1.2" transform={`rotate(${i * 30} 30 30)`} />
            ))}
          </g>
          <circle cx="30" cy="30" r="13" fill="#c9ccd1" />
          <circle cx="30" cy="30" r="9" fill="#3a3d42" />
          <circle cx="30" cy="30" r="4" fill="#c9ccd1" />
        </svg>
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
};
