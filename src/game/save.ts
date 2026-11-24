/**
 * Sauvegarde locale versionnée (localStorage).
 *
 * - Seules des références d'assets sont stockées, jamais de média encodé.
 * - Les données invalides sont mises de côté (`paraline.save.corrupt`) et
 *   le jeu repart proprement au lieu d'afficher un écran blanc.
 * - Les migrations conservent introduction, préférences et notes.
 * - `reconcile()` ajoute les nouvelles enquêtes du contenu sans rien effacer :
 *   c'est ainsi que la première mission apparaîtra dans une partie existante.
 */
import { emptyProgress, type CaseIndex } from './engine';
import type { GameState, Settings } from './types';

export const SAVE_KEY = import.meta.env?.VITE_FIXTURE === '1' ? 'paraline.fixture.save' : 'paraline.save';
export const SAVE_VERSION = 1;
/**
 * Remise à zéro générale : augmenter ce nombre efface la partie de TOUS les joueurs au prochain
 * chargement (seules les préférences de son et d'accessibilité sont gardées).
 * 1 : 24/11/2026, « Dossier 0 » enrichi (visite à 360°) : tout le monde recommence.
 * 2 : 24/11/2026, « Dossier 0 » : la visite à 360° remplace les photos à plat de la maison et de la chambre.
 */
export const RESET_EPOCH = 2;

export function defaultSettings(): Settings {
  return {
    clockAuto: true,
    manualDate: todayISO(),
    manualTime: '22:17',
    airplane: false,
    sound: true,
    volume: 0.6,
    reduceMotion: false,
    reduceFlashes: false,
    largeText: false,
  };
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function initialState(cases: CaseIndex): GameState {
  return reconcile(
    {
      version: SAVE_VERSION,
      epoch: RESET_EPOCH,
      introDone: false,
      tutorial: { status: 'pending', step: 'openMail', found: false, filed: false },
      settings: defaultSettings(),
      activeCaseId: null,
      cases: {},
      readMails: [],
      queue: [],
      overrides: {},
      copies: [],
      notes: [],
      notifications: [],
    },
    cases,
  );
}

/** Ajoute une progression vierge pour chaque enquête du contenu absente de la sauvegarde. */
export function reconcile(state: GameState, cases: CaseIndex): GameState {
  let changed = false;
  const progress = { ...state.cases };
  for (const c of cases.list) {
    if (!progress[c.id]) {
      progress[c.id] = emptyProgress();
      changed = true;
    }
  }
  let activeCaseId = state.activeCaseId;
  if (activeCaseId && (!cases.byId.has(activeCaseId) || progress[activeCaseId]?.status !== 'active')) {
    activeCaseId = null;
    changed = true;
  }
  return changed ? { ...state, cases: progress, activeCaseId } : state;
}

/* ------------------------------------------------------------------ */
/* Migrations                                                           */
/* ------------------------------------------------------------------ */

type Raw = Record<string, unknown>;

/** Chaque entrée migre de la version `n` vers `n + 1`. */
const MIGRATIONS: Record<number, (s: Raw) => Raw> = {
  // v0 : prototype sans numéro de version. Rien à transformer, on complète.
  0: (s) => ({ ...s, version: 1 }),
};

export function migrate(raw: Raw): Raw {
  let s = raw;
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > SAVE_VERSION) throw new Error(`Sauvegarde plus récente que le jeu (v${v}).`);
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Migration manquante depuis v${v}`);
    s = step(s);
    v += 1;
  }
  return s;
}

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Vérifie et complète un état migré. Lance une erreur si la structure est inutilisable. */
export function normalize(raw: Raw, cases: CaseIndex): GameState {
  const base = initialState({ list: [], byId: new Map() });
  if (!isObj(raw)) throw new Error('Format invalide');
  const settings = { ...base.settings, ...(isObj(raw.settings) ? raw.settings : {}) } as Settings;
  const tutorial = { ...base.tutorial, ...(isObj(raw.tutorial) ? raw.tutorial : {}) } as GameState['tutorial'];
  const rawCases = isObj(raw.cases) ? raw.cases : {};
  const progress: GameState['cases'] = {};
  for (const [id, p] of Object.entries(rawCases)) {
    if (!isObj(p)) continue;
    progress[id] = { ...emptyProgress(), ...(p as object) } as GameState['cases'][string];
  }
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const state: GameState = {
    version: SAVE_VERSION,
    epoch: typeof raw.epoch === 'number' ? raw.epoch : 0,
    introDone: raw.introDone === true,
    tutorial,
    settings,
    activeCaseId: typeof raw.activeCaseId === 'string' ? raw.activeCaseId : null,
    cases: progress,
    readMails: arr<string>(raw.readMails).filter((x) => typeof x === 'string'),
    queue: arr<GameState['queue'][number]>(raw.queue).filter((q) => isObj(q) && typeof q.id === 'string'),
    overrides: isObj(raw.overrides) ? (raw.overrides as GameState['overrides']) : {},
    copies: arr<GameState['copies'][number]>(raw.copies).filter((c) => isObj(c) && typeof c.src === 'string'),
    notes: arr<GameState['notes'][number]>(raw.notes).filter((n) => isObj(n) && typeof n.id === 'string'),
    ...(raw.unlocked === true ? { unlocked: true } : {}),
    ...(isObj(raw.away) ? { away: raw.away as GameState['away'] } : {}),
    notifications: [],
  };
  return reconcile(state, cases);
}

export interface LoadResult {
  state: GameState;
  /** Message à afficher si la sauvegarde a dû être écartée. */
  warning?: string;
  /** La partie a été effacée par une remise à zéro générale (rien à mettre de côté). */
  reset?: boolean;
}

/** Partie neuve après une remise à zéro générale : on garde le son et l'accessibilité. */
function resetGame(old: GameState, cases: CaseIndex): GameState {
  const fresh = initialState(cases);
  const { sound, volume, reduceMotion, reduceFlashes, largeText } = old.settings;
  return { ...fresh, settings: { ...fresh.settings, sound, volume, reduceMotion, reduceFlashes, largeText } };
}

export function deserialize(json: string | null, cases: CaseIndex): LoadResult {
  if (!json) return { state: initialState(cases) };
  try {
    const state = normalize(migrate(JSON.parse(json) as Raw), cases);
    if ((state.epoch ?? 0) < RESET_EPOCH) {
      return {
        state: resetGame(state, cases),
        reset: true,
        warning: 'Paraline a été mis à jour : votre partie repart de zéro. Les enquêtes vous attendent dans Mail.',
      };
    }
    return { state };
  } catch (e) {
    return {
      state: initialState(cases),
      warning: `La sauvegarde n'a pas pu être lue (${(e as Error).message}). Une nouvelle partie a été créée ; l'ancienne a été mise de côté.`,
    };
  }
}

export function serialize(state: GameState): string {
  const { notifications: _ignored, ...rest } = state;
  void _ignored;
  return JSON.stringify(rest);
}

/* ------------------------------------------------------------------ */
/* Accès au stockage (tolérant : navigation privée, quota, etc.)        */
/* ------------------------------------------------------------------ */

export function loadFromStorage(cases: CaseIndex): LoadResult {
  let json: string | null = null;
  try {
    json = localStorage.getItem(SAVE_KEY);
  } catch {
    return { state: initialState(cases), warning: "Le stockage local est indisponible : la progression ne sera pas conservée." };
  }
  const result = deserialize(json, cases);
  if (result.warning && json && !result.reset) {
    try {
      localStorage.setItem(`${SAVE_KEY}.corrupt`, json);
    } catch {
      /* ignoré */
    }
  }
  return result;
}

export function writeToStorage(state: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignoré */
  }
}
