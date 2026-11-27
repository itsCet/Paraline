import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../game/store';
import { usePhoneTime } from '../game/clock';
import { useNav } from './nav';
import { AppGlyph, Icon, StatusIcons } from '../components/icons';
import { HomeScreen } from './HomeScreen';
import { Intro } from './Intro';
import { Coach } from './Coach';
import { MediaViewer } from './MediaViewer';
import { MailApp } from '../apps/MailApp';
import { MessagesApp } from '../apps/MessagesApp';
import { PhotosApp } from '../apps/PhotosApp';
import { FilesApp } from '../apps/FilesApp';
import { NotesApp } from '../apps/NotesApp';
import { SettingsApp } from '../apps/SettingsApp';
import { PhoneApp, VoiceApp } from '../apps/VoiceApp';
import { LocateApp } from '../apps/LocateApp';
import { RadioApp } from '../apps/RadioApp';
import { CompassApp } from '../apps/CompassApp';
import { NewsApp } from '../apps/NewsApp';
import { MapApp } from '../apps/MapApp';
import { Stillness } from './Stillness';
import { LockScreen } from './LockScreen';
import { CallScreen } from './CallScreen';
import { ControlCenter } from './ControlCenter';
import { resolveMedia } from '../game/selectors';
import { APP_LABELS } from '../components/icons';
import { HintBulb } from '../components/Hints';
import { unlockAudio } from '../game/sound';
import { WALLPAPER } from '../content/assets';
import type { AppId } from '../game/types';

const APPS: Record<AppId, () => ReactNode> = {
  mail: () => <MailApp />,
  messages: () => <MessagesApp />,
  photos: () => <PhotosApp />,
  files: () => <FilesApp />,
  notes: () => <NotesApp />,
  settings: () => <SettingsApp />,
  voice: () => <VoiceApp />,
  phone: () => <PhoneApp />,
  locate: () => <LocateApp />,
  radio: () => <RadioApp />,
  compass: () => <CompassApp />,
  news: () => <NewsApp />,
  // Pas une vraie app : l'icône ramène au casier (voir HomeScreen).
  casier: () => null,
  plans: () => <MapApp />,
};

export function Phone() {
  const { state, warning, dismissWarning } = useGame();
  const nav = useNav();
  const s = state.settings;
  const time = usePhoneTime(s);
  const onHome = nav.app === null && !nav.viewer;
  // Centre de contrôle, lampe torche, capture d'écran.
  const [cc, setCc] = useState(false);
  const [torch, setTorch] = useState(false);
  const [flash, setFlash] = useState(0);
  const swipe = useRef<number | null>(null);
  const capture = () => {
    setCc(false);
    const v = nav.viewer;
    let cap: Parameters<typeof dispatch>[0] | null = null;
    if (v?.kind === 'case') {
      const def = cases.byId.get(v.caseId);
      const res = def && resolveMedia(def, state, v.mediaId);
      if (def && res && res.def.kind === 'image' && res.variant.src)
        cap = { type: 'capture/take', capture: { kind: 'media', caseId: def.id, mediaId: res.def.id, variantId: res.variantId, src: res.variant.src, name: res.def.name } };
    } else if (nav.app === 'messages' && nav.capturable) {
      const { caseId, threadId } = nav.capturable;
      const entries = (state.cases[caseId]?.threads[threadId] ?? []).map((e) => ({ messageId: e.messageId, at: e.at }));
      cap = { type: 'capture/take', capture: { kind: 'thread', caseId, threadId, entries } };
    }
    window.setTimeout(() => {
      dispatch(cap ?? { type: 'capture/take', capture: { kind: 'app', label: nav.app ? APP_LABELS[nav.app] : 'Écran d’accueil' } });
      setFlash(Date.now());
      nav.showToast('Capture enregistrée dans Photos', { label: 'Voir', run: () => nav.open('photos') });
    }, 250);
  };
  // Écran verrouillé : à l'ouverture et au retour après 30 s d'absence. Les tests automatisés le passent (sauf `?verrou`).
  const lockable = () => !navigator.webdriver || new URLSearchParams(location.search).has('verrou');
  const [locked, setLocked] = useState(() => state.introDone && lockable());

  // Le jeu remarque quand le joueur le quitte (onglet caché, écran verrouillé) et combien de temps.
  const { dispatch, cases } = useGame();
  const leftAt = useRef<number | null>(null);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') leftAt.current = Date.now();
      else if (leftAt.current !== null) {
        const at = leftAt.current;
        leftAt.current = null;
        if (state.introDone) dispatch({ type: 'app/return', leftAt: at, awayMs: Date.now() - at });
        if (state.introDone && Date.now() - at >= 30_000 && !state.overrides.stillness && lockable()) setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [dispatch, state.introDone, state.overrides.stillness]);

  // Échap : ferme la visionneuse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && nav.viewer && !document.querySelector('.sheet-backdrop, .dialog-backdrop')) nav.closeViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  const cls = ['phone', s.reduceMotion && 'reduce-motion', s.largeText && 'large-text'].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={onHome ? { backgroundImage: `url(${state.overrides.wallpaper?.value ?? WALLPAPER})` } : undefined}
      onPointerDownCapture={unlockAudio} onKeyDownCapture={unlockAudio}>
      {warning && (
        <div className="warning-bar" role="alert">
          <span style={{ flex: 1 }}>{warning}</span>
          <button className="link" onClick={dismissWarning}>
            OK
          </button>
        </div>
      )}
      <div
        className="statusbar"
        onPointerDown={(e) => (swipe.current = e.clientY)}
        onPointerUp={(e) => {
          if (swipe.current !== null && e.clientY - swipe.current > 24 && state.introDone) setCc(true);
          swipe.current = null;
        }}
      >
        <span aria-label={`Heure du téléphone ${time.hhmm}`}>{time.hhmm}</span>
        <button className="status-icons" onClick={() => state.introDone && setCc(true)} aria-label="Centre de contrôle">
          {s.airplane && <span className="sr-only">Mode avion activé</span>}
          <StatusIcons airplane={s.airplane} />
        </button>
      </div>
      {state.introDone && state.tutorial.status === 'active' && <Coach />}
      <main className="screen">
        <HomeScreen hidden={nav.app !== null} time={time} />
        {nav.opened.map((id) => (
          <section key={id} className="app-layer" hidden={nav.app !== id} aria-label={id}>
            {APPS[id]()}
          </section>
        ))}
        <MediaViewer />
      </main>
      <HomeBar onHome={onHome} />
      {locked && state.introDone && (
        <div className="lock-layer" style={{ backgroundImage: `url(${state.overrides.wallpaper?.value ?? WALLPAPER})` }}>
          <LockScreen time={time} onUnlock={() => setLocked(false)} />
        </div>
      )}
      {/* Assombrissement voulu par une enquête (la lumière baisse). */}
      {state.overrides.dim && <div className="phone-dim" aria-hidden="true" style={{ opacity: Math.min(0.7, Number(state.overrides.dim.value) || 0) }} />}
      <Stillness />
      <CallScreen />
      {/* Luminosité réglée dans le Centre de contrôle. */}
      {(s.brightness ?? 1) < 1 && <div className="phone-dim" aria-hidden="true" style={{ opacity: (1 - (s.brightness ?? 1)) * 0.8, zIndex: 125 }} />}
      {cc && <ControlCenter onClose={() => setCc(false)} onCapture={capture} torch={torch} onTorch={() => setTorch((t) => !t)} />}
      {torch && (
        <button className="torch-light" style={{ zIndex: 140 }} aria-label="Éteindre la lampe torche" onClick={() => setTorch(false)}>
          <span>Touchez pour éteindre</span>
        </button>
      )}
      {flash > 0 && <div key={flash} className="capture-flash" aria-hidden="true" />}
      <Banner />
      <ToastView />
      {!state.introDone && <Intro />}
    </div>
  );
}

/** Barre de retour à l'accueil : bouton maison, ou balayage vers le haut. */
function HomeBar({ onHome }: { onHome: boolean }) {
  const nav = useNav();
  const start = useRef<number | null>(null);
  return (
    <div
      className={`homebar${onHome ? ' on-home' : ''}`}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerUp={(e) => {
        if (start.current !== null && start.current - e.clientY > 24) nav.home();
        start.current = null;
      }}
    >
      {!onHome && (
        <button className="home-btn" onClick={nav.home} aria-label="Retour à l’accueil" title="Accueil">
          <Icon.Home size={24} />
        </button>
      )}
      <span className="indicator" aria-hidden="true" />
      <HintBulb />
    </div>
  );
}

function Banner() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const n = state.notifications[state.notifications.length - 1];
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!n) return;
    // Pas de bannière si l'utilisateur est déjà dans l'application concernée.
    if (nav.app === n.app && !nav.viewer) {
      dispatch({ type: 'notification/dismiss', id: n.id });
      return;
    }
    setShown(n.id);
    const t = window.setTimeout(() => dispatch({ type: 'notification/dismiss', id: n.id }), 5000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n?.id]);
  if (!n || shown !== n.id) return null;
  return (
    <div className="banner glass" role="status">
      <button
        style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, textAlign: 'left' }}
        onClick={() => {
          dispatch({ type: 'notification/dismiss', id: n.id });
          nav.open(n.app, n.target ? { caseId: n.target.caseId, mailId: n.target.mailId, threadId: n.target.threadId } : undefined);
        }}
      >
        <span className="widget-icon">
          <AppGlyph app={n.app} />
        </span>
        <span style={{ minWidth: 0 }}>
          <div className="widget-title">{n.title}</div>
          {n.body && <div className="widget-line">{n.body}</div>}
        </span>
      </button>
      <button className="banner-close" aria-label="Fermer la notification" onClick={() => dispatch({ type: 'notification/dismiss', id: n.id })}>
        <Icon.Close size={16} />
      </button>
    </div>
  );
}

function ToastView() {
  const { toast, hideToast } = useNav();
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite" key={toast.id}>
      <span>{toast.text}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.run();
            hideToast();
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
