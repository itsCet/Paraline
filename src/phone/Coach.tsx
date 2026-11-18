import { useGame } from '../game/store';
import { useNav } from './nav';
import { coachText } from '../content/tutorial';

/** Guide de l'exercice : placé dans le flux, il ne recouvre jamais l'écran utile. */
export function Coach() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const text = coachText(state.tutorial.step, {
    app: nav.app,
    viewerOpen: nav.viewer?.kind === 'tutorial',
    inMail: nav.app === 'mail' && nav.screens.mail === 'tutorial',
    inFolder: nav.app === 'files' && nav.screens.files === 'tutorial',
  });
  return (
    <aside className="coach" aria-live="polite" aria-label="Exercice de prise en main">
      <div style={{ minWidth: 0 }}>
        <div className="coach-label">Exercice · exemple</div>
        <div className="coach-text">{text}</div>
      </div>
      <button className="coach-quit" onClick={() => {
          dispatch({ type: 'tutorial/dismiss' });
          nav.showToast('Exercice en pause. Reprise possible dans Réglages › Aide.');
        }} aria-label="Quitter l’exercice (reprise possible dans Réglages, Aide)">
        Quitter
      </button>
    </aside>
  );
}
