import { useEffect, useRef } from 'react';
import { useGame } from '../game/store';
import { useNav } from './nav';
import { Icon, LogoMark } from '../components/icons';
import { WALLPAPER } from '../content/assets';

/** Première ouverture : un seul écran sur fond photographique, puis le téléphone. */
export function Intro() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  const finish = () => {
    nav.home();
    dispatch({ type: 'intro/complete' });
  };

  // Un seul écran : on veut que le joueur ait son téléphone en main (et un premier frisson) au plus vite.
  const wallpaper = state.overrides.wallpaper?.value ?? WALLPAPER;

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Introduction" style={{ backgroundImage: `url(${wallpaper})` }}>
      <div className="intro-top">
        <span />
      </div>
      <div className="intro-body">
        <div className="intro-brand" aria-hidden="true">
          <span className="logo-tile">
            <LogoMark size={40} />
          </span>
          <span className="word">PARALINE</span>
        </div>
        <h1 tabIndex={-1} ref={titleRef} style={{ outline: 'none' }}>
          Certaines histoires méritent qu’on les examine.
        </h1>
        <p>Vous êtes enquêteur paranormal. Tout se passe dans ce téléphone : les demandes arrivent par Mail, les témoins vous écrivent.</p>
        <ul className="intro-tips">
          <li>
            <Icon.Image size={20} />
            <span>
              <b>Touchez les photos</b> là où un détail vous intrigue, et zoomez.
            </span>
          </li>
          <li>
            <Icon.Gear size={20} />
            <span>
              <b>Le téléphone lui-même</b> peut servir : heure, mode avion, son…
            </span>
          </li>
          <li>
            <Icon.Bulb size={20} />
            <span>
              Bloqué ? L’<b>ampoule</b>, en bas à droite, donne un indice.
            </span>
          </li>
        </ul>
        <p className="secondary">Le son est conseillé. Votre progression reste sur cet appareil.</p>
      </div>
      <div className="intro-actions">
        <button className="btn btn-primary btn-block wide" onClick={finish}>
          <span>Prendre mon téléphone</span>
          <Icon.ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
