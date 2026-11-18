import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
// Alias résolu par Vite : le registre réel, ou l'enquête de test si VITE_FIXTURE=1.
import { CASES } from '@paraline/cases';
import { indexCases, type CaseIndex } from './engine';
import { createReducer, type Action } from './reducer';
import { clearStorage, loadFromStorage, writeToStorage } from './save';
import type { GameState } from './types';
import { playCue } from './sound';

interface Store {
  state: GameState;
  dispatch: (a: Action) => void;
  cases: CaseIndex;
  /** Avertissement de chargement (sauvegarde illisible, stockage indisponible). */
  warning: string | null;
  dismissWarning: () => void;
}

const Ctx = createContext<Store | null>(null);
const caseIndex = indexCases(CASES);
const reducer = createReducer(caseIndex);

export function GameProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(() => loadFromStorage(caseIndex));
  const [state, rawDispatch] = useReducer(reducer, boot.state);
  const [warning, setWarning] = useState<string | null>(boot.warning ?? null);
  const latest = useRef(state);
  latest.current = state;

  const dispatch = useCallback((a: Action) => {
    if (a.type === 'reset') clearStorage();
    rawDispatch(a);
  }, []);

  // Sauvegarde différée + écriture immédiate quand la page passe en arrière-plan.
  useEffect(() => {
    const t = window.setTimeout(() => writeToStorage(state), 200);
    return () => window.clearTimeout(t);
  }, [state]);
  useEffect(() => {
    const flush = () => writeToStorage(latest.current);
    const onVis = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Horloge de la file de livraison : active seulement quand il y a quelque chose à livrer.
  const hasQueue = state.queue.length > 0;
  useEffect(() => {
    if (!hasQueue) return;
    const id = window.setInterval(() => rawDispatch({ type: 'tick' }), 400);
    return () => window.clearInterval(id);
  }, [hasQueue]);

  // Son discret à chaque nouvelle notification.
  const lastNotif = state.notifications[state.notifications.length - 1]?.id;
  const seen = useRef(lastNotif);
  useEffect(() => {
    if (lastNotif && lastNotif !== seen.current) playCue('notify', state.settings);
    seen.current = lastNotif;
  }, [lastNotif, state.settings]);

  const value = useMemo<Store>(
    () => ({ state, dispatch, cases: caseIndex, warning, dismissWarning: () => setWarning(null) }),
    [state, dispatch, warning],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useGame hors de GameProvider');
  return s;
}
