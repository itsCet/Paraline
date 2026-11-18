import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppId, Id } from '../game/types';

/** Ce que la visionneuse affiche. */
export type ViewerSource =
  | { kind: 'case'; caseId: Id; mediaId: Id; focus?: { x: number; y: number; scale: number } }
  | { kind: 'copy'; copyId: Id }
  | { kind: 'tutorial' }
  | { kind: 'compare'; caseId: Id; left: CompareSide; right: CompareSide; back: Exclude<ViewerSource, { kind: 'compare' }> };

export type CompareSide = { label: string; src: string };

/** Demande d'ouverture d'un écran précis dans une application. */
export interface Intent {
  app: AppId;
  seq: number;
  caseId?: Id;
  mailId?: Id;
  threadId?: Id;
  page?: string;
}

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

interface Nav {
  app: AppId | null;
  opened: AppId[];
  open: (app: AppId, intent?: Omit<Intent, 'app' | 'seq'>) => void;
  home: () => void;
  intent: Intent | null;
  viewer: ViewerSource | null;
  openViewer: (v: ViewerSource) => void;
  closeViewer: () => void;
  toast: Toast | null;
  showToast: (text: string, action?: Toast['action']) => void;
  hideToast: () => void;
  /** Écran secondaire courant de chaque application (pour le guide). */
  screens: Partial<Record<AppId, string>>;
  setScreen: (app: AppId, screen: string) => void;
}

const Ctx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<AppId | null>(null);
  const [opened, setOpened] = useState<AppId[]>([]);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [viewer, setViewer] = useState<ViewerSource | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [screens, setScreens] = useState<Partial<Record<AppId, string>>>({});
  const seq = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);

  const open = useCallback((a: AppId, i?: Omit<Intent, 'app' | 'seq'>) => {
    setOpened((o) => (o.includes(a) ? o : [...o, a]));
    setApp(a);
    setViewer(null);
    if (i) {
      seq.current += 1;
      setIntent({ ...i, app: a, seq: seq.current });
    }
  }, []);
  const home = useCallback(() => {
    setViewer(null);
    setApp(null);
  }, []);
  const hideToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((text: string, action?: Toast['action']) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, action });
    toastTimer.current = window.setTimeout(() => setToast(null), action ? 6000 : 2600);
  }, []);
  const setScreen = useCallback((a: AppId, s: string) => setScreens((x) => (x[a] === s ? x : { ...x, [a]: s })), []);

  const value = useMemo<Nav>(
    () => ({
      app,
      opened,
      open,
      home,
      intent,
      viewer,
      openViewer: setViewer,
      closeViewer: () => setViewer(null),
      toast,
      showToast,
      hideToast,
      screens,
      setScreen,
    }),
    [app, opened, open, home, intent, viewer, toast, showToast, hideToast, screens, setScreen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const n = useContext(Ctx);
  if (!n) throw new Error('useNav hors de NavProvider');
  return n;
}

/** Exécute `handler` une fois par demande d'ouverture adressée à `app`. */
export function useIntent(app: AppId, handler: (i: Intent) => void) {
  const { intent } = useNav();
  const handled = useRef(0);
  const fn = useRef(handler);
  fn.current = handler;
  useEffect(() => {
    if (intent && intent.app === app && intent.seq !== handled.current) {
      handled.current = intent.seq;
      fn.current(intent);
    }
  }, [intent, app]);
}
