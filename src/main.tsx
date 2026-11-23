import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Labo } from './labo/Labo';
import './styles/global.css';
import { ASSETS } from './content/assets';

declare const __BUILD_ID__: string;

// Jouable hors ligne après la première visite (build de production uniquement).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${__BUILD_ID__}`)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Les médias se téléchargent en arrière-plan, une fois la première page affichée.
        // Code de la page (chargé avant que le cache ne prenne la main) + tous les médias du jeu.
        const code = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"], link[rel="modulepreload"]')]
          .map((el) => new URL('src' in el && el.src ? el.src : (el as HTMLLinkElement).href).pathname)
          .filter((u) => u.startsWith('/assets/'));
        const urls = [...code, ...ASSETS.map((a) => a.path).filter((p) => p.startsWith('/media/'))];
        window.setTimeout(() => reg.active?.postMessage({ type: 'precache', urls }), 4000);
      })
      .catch(() => {
        /* sans service worker, le jeu reste jouable en ligne */
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(location.search).has('labo') ? <Labo /> : <App />}
  </StrictMode>,
);
