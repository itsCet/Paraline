/** Météo affichée par le téléphone : celle de la ville de l'enquête en cours (sinon Saint-Aubin, la ville de Victor). */
import type { CaseIndex } from './engine';
import type { GameState, Sky, Weather } from './types';

export const DEFAULT_WEATHER: Weather = { city: 'Saint-Aubin', temp: 6, sky: 'brouillard' };

export const SKY_LABEL: Record<Sky, string> = {
  clair: 'Ciel dégagé',
  nuageux: 'Nuageux',
  pluie: 'Pluie',
  brouillard: 'Brouillard',
  neige: 'Neige',
  orage: 'Orage',
};

export function currentWeather(state: GameState, cases: CaseIndex): Weather {
  const def = state.activeCaseId ? cases.byId.get(state.activeCaseId) : undefined;
  return def?.weather ?? DEFAULT_WEATHER;
}

const isNight = (h: number) => h >= 20 || h < 7;

/** Prévisions heure par heure à partir de l'heure du téléphone : il fait plus froid la nuit. */
export function forecast(w: Weather, from: Date, hours = 5): { hour: number; temp: number; night: boolean }[] {
  const out = [];
  let t = w.temp;
  for (let i = 0; i < hours; i++) {
    const h = (from.getHours() + i) % 24;
    if (i > 0) t += isNight(h) ? (i % 2 === 0 ? -1 : 0) : h < 15 ? 1 : 0;
    out.push({ hour: h, temp: t, night: isNight(h) });
  }
  return out;
}

export { isNight };
