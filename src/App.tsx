import { Component, useEffect, type ReactNode } from 'react';
import { GameProvider } from './game/store';
import { NavProvider } from './phone/nav';
import { Phone } from './phone/Phone';
import { LogoMark } from './components/icons';
import { SAVE_KEY } from './game/save';

/** Hauteur réelle visible (barres du navigateur, clavier virtuel). */
function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`);
      // iOS fait défiler la page quand le clavier s'ouvre : on la ramène.
      if (window.scrollY) window.scrollTo(0, 0);
    };
    apply();
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);
}

/** Verrouille le portrait quand le navigateur le permet (plein écran, app installée). Sinon, l'écran « Tournez votre téléphone » prend le relais. */
function usePortraitLock() {
  useEffect(() => {
    const lock = () => {
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      o?.lock?.('portrait').catch(() => {});
    };
    lock();
    window.addEventListener('pointerdown', lock, { once: true });
    return () => window.removeEventListener('pointerdown', lock);
  }, []);
}

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="dialog-backdrop" style={{ position: 'fixed' }}>
        <div className="dialog">
          <h2>Le téléphone a rencontré un problème</h2>
          <p>Votre progression est conservée. Rechargez la page pour reprendre.</p>
          <div className="stack">
            <button className="btn btn-primary" onClick={() => location.reload()}>
              Recharger
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                try {
                  localStorage.setItem(`${SAVE_KEY}.corrupt`, localStorage.getItem(SAVE_KEY) ?? '');
                  localStorage.removeItem(SAVE_KEY);
                } catch {
                  /* ignoré */
                }
                location.reload();
              }}
            >
              Recommencer une partie
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export function App() {
  useViewportHeight();
  usePortraitLock();
  return (
    <Boundary>
      <div className="rotate-lock" role="alert">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          <rect x="20" y="8" width="24" height="44" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M46 56a20 20 0 0 0 10-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 40l4 2 2-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p>Tournez votre téléphone</p>
        <small>Paraline se joue à la verticale.</small>
      </div>
      <div className="desk-brand" aria-hidden="true">
        <LogoMark size={30} />
        <div>
          PARALINE
          <small>ENQUÊTES PARANORMALES</small>
        </div>
      </div>
      <div className="stage">
        <GameProvider>
          <NavProvider>
            <Phone />
          </NavProvider>
        </GameProvider>
      </div>
      <div className="desk-hint" aria-hidden="true">
        Molette ou boutons + / − pour agrandir une image. Échap pour fermer. La barre en bas du téléphone ramène à l’accueil.
      </div>
    </Boundary>
  );
}
