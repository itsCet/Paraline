import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from './nav';
import { AppGlyph, Icon, LogoMark } from '../components/icons';
import { WALLPAPER } from '../content/assets';

/** Première ouverture : trois écrans courts sur fond photographique. */
export function Intro() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const [i, setI] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), [i]);
  const finish = () => {
    nav.home();
    dispatch({ type: 'intro/complete' });
  };

  const screens = [
    {
      title: 'Certaines histoires méritent qu’on les examine.',
      body: (
        <p>
          Vous êtes enquêteur paranormal indépendant. Des personnes vous contactent lorsqu’elles ne trouvent plus d’explication à ce qu’elles
          vivent.
        </p>
      ),
    },
    {
      title: 'Votre téléphone est votre outil de travail.',
      body: (
        <>
          <p>
            Recevez des demandes par e-mail. Examinez les pièces jointes, échangez avec vos clients et rassemblez vos observations. Vous
            choisissez les affaires que vous acceptez.
          </p>
          <div className="intro-apps" aria-hidden="true">
            {(['mail', 'messages', 'files'] as const).map((a) => (
              <span className="app-icon" key={a}>
                <span className="app-glyph">
                  <AppGlyph app={a} />
                </span>
                <span>{a === 'mail' ? 'Mail' : a === 'messages' ? 'Messages' : 'Dossiers'}</span>
              </span>
            ))}
          </div>
        </>
      ),
    },
    {
      title: 'Observez. Essayez. Faites le lien.',
      body: (
        <>
          <p>
            Une photo, un enregistrement ou une fonction du téléphone peut faire avancer une enquête. Vos découvertes ouvrent de nouvelles
            possibilités. En cas de blocage, des indices sont disponibles dans votre dossier.
          </p>
          <p className="secondary">Votre progression est enregistrée sur cet appareil. Le son est conseillé, mais reste facultatif.</p>
        </>
      ),
    },
  ];
  const s = screens[i];
  const last = i === screens.length - 1;
  const wallpaper = state.overrides.wallpaper?.value ?? WALLPAPER;

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Introduction" style={{ backgroundImage: `url(${wallpaper})` }}>
      <div className="intro-top">
        {i > 0 ? (
          <button className="navbar-back" onClick={() => setI(i - 1)} aria-label="Écran précédent">
            <Icon.Back size={26} />
          </button>
        ) : (
          <span />
        )}
        <span className="pill" aria-label={`Écran ${i + 1} sur 3`}>
          {i + 1} / 3
        </span>
      </div>
      <div className="intro-body" key={i}>
        <div className="intro-brand" aria-hidden="true">
          <span className="logo-tile">
            <LogoMark size={40} />
          </span>
          <span className="word">PARALINE</span>
        </div>
        <div className="bars" aria-hidden="true">
          {screens.map((_, k) => (
            <i key={k} className={k === i ? 'on' : undefined} />
          ))}
        </div>
        <h1 tabIndex={-1} ref={titleRef} style={{ outline: 'none' }}>
          {s.title}
        </h1>
        {s.body}
      </div>
      <div className="intro-actions">
        <button className="btn btn-primary btn-block wide" onClick={() => (last ? finish() : setI(i + 1))}>
          <span>{last ? 'Prendre mon téléphone' : 'Continuer'}</span>
          <Icon.ArrowRight size={24} />
        </button>
        <button className="btn btn-ghost btn-block" onClick={finish}>
          Passer l’introduction
        </button>
      </div>
    </div>
  );
}
