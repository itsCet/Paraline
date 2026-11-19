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
};

export function Phone() {
  const { state, warning, dismissWarning } = useGame();
  const nav = useNav();
  const s = state.settings;
  const time = usePhoneTime(s);
  const onHome = nav.app === null && !nav.viewer;

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
      <div className="statusbar">
        <span aria-label={`Heure du téléphone ${time.hhmm}`}>{time.hhmm}</span>
        <span className="status-icons">
          {s.airplane && <span className="sr-only">Mode avion activé</span>}
          <StatusIcons airplane={s.airplane} />
        </span>
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
