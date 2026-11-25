import type { Sky } from '../game/types';

/** Pictogramme météo (trait), lune la nuit pour un ciel dégagé. */
export function WeatherIcon({ sky, night, size = 22 }: { sky: Sky; night?: boolean; size?: number }) {
  const cloud = <path d="M7 17.5h9.5a3.5 3.5 0 00.4-7A5 5 0 007.4 9.6 3.9 3.9 0 007 17.5z" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {sky === 'clair' &&
        (night ? (
          <path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
          </>
        ))}
      {sky === 'nuageux' && cloud}
      {sky === 'pluie' && (
        <>
          <path d="M7 14.5h9.5a3.5 3.5 0 00.4-7A5 5 0 007.4 6.6 3.9 3.9 0 007 14.5z" />
          <path d="M9 17.5l-1 2.5M13 17.5l-1 2.5M17 17.5l-1 2.5" />
        </>
      )}
      {sky === 'brouillard' && <path d="M4 9h16M6 13h14M4 17h12" />}
      {sky === 'neige' && (
        <>
          <path d="M7 14.5h9.5a3.5 3.5 0 00.4-7A5 5 0 007.4 6.6 3.9 3.9 0 007 14.5z" />
          <path d="M9 18.5h.01M13 20h.01M16 18h.01" strokeWidth="2.6" />
        </>
      )}
      {sky === 'orage' && (
        <>
          <path d="M7 14.5h9.5a3.5 3.5 0 00.4-7A5 5 0 007.4 6.6 3.9 3.9 0 007 14.5z" />
          <path d="M12.5 15l-2 3.5h3l-2 3.5" />
        </>
      )}
    </svg>
  );
}
