import { useEffect, useState } from 'react';
import type { Settings } from './types';

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export interface PhoneTime {
  date: Date;
  hhmm: string;
  /** « Mercredi 18 novembre » */
  dayLabel: string;
  /** « 18 novembre 2014 » */
  fullDate: string;
}

export function toPhoneTime(d: Date): PhoneTime {
  const p = (n: number) => String(n).padStart(2, '0');
  const day = DAYS[d.getDay()];
  return {
    date: d,
    hhmm: `${p(d.getHours())}:${p(d.getMinutes())}`,
    dayLabel: `${day[0].toUpperCase()}${day.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    fullDate: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  };
}

/** Date manuelle fixe : construite en heure locale. */
export function manualDate(s: Pick<Settings, 'manualDate' | 'manualTime'>): Date {
  const [y, m, d] = s.manualDate.split('-').map(Number);
  const [hh, mm] = s.manualTime.split(':').map(Number);
  const date = new Date(y || 2000, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Heure du téléphone fictif : réelle en automatique, figée en manuel. */
export function usePhoneTime(s: Pick<Settings, 'clockAuto' | 'manualDate' | 'manualTime'>): PhoneTime {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!s.clockAuto) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(id);
  }, [s.clockAuto]);
  return toPhoneTime(s.clockAuto ? now : manualDate(s));
}
