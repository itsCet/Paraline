import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from './nav';
import { AppGlyph, Icon, LogoMark } from '../components/icons';

/** Première ouverture : trois écrans courts. */
export function Intro() {
  const { dispatch } = useGame();
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
          <p>
            Recevez des demandes par e-mail. Examinez les pièces jointes, échangez avec vos clients et rassemblez vos observations. Vous
            choisissez les affaires que vous acceptez.
          </p>
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

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label="Introduction">
      <div className="intro-top">
        {i > 0 ? (
          <button className="navbar-back" onClick={() => setI(i - 1)} aria-label="Écran précédent">
            <Icon.Back size={24} />
            <span>Retour</span>
          </button>
        ) : (
          <span />
        )}
        <div className="intro-progress">
          <span className="dots" aria-hidden="true">
            {screens.map((_, k) => (
              <i key={k} className={k === i ? 'on' : undefined} />
            ))}
          </span>
          <span aria-label={`Écran ${i + 1} sur 3`}>{i + 1}/3</span>
        </div>
      </div>
      <div className="intro-body" key={i}>
        {i === 0 && (
          <div className="intro-brand" aria-hidden="true">
            <LogoMark size={44} />
            <div>
              <div className="word">PARALINE</div>
              <small>ENQUÊTES PARANORMALES</small>
            </div>
          </div>
        )}
        <h1 tabIndex={-1} ref={titleRef} style={{ outline: 'none' }}>
          {s.title}
        </h1>
        {s.body}
      </div>
      <div className="intro-actions">
        <button className="btn btn-primary btn-block" onClick={() => (last ? finish() : setI(i + 1))}>
          {last ? 'Prendre mon téléphone' : 'Continuer'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={finish}>
          Passer l’introduction
        </button>
      </div>
    </div>
  );
}
