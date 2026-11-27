/**
 * Centre de contrôle (glisser depuis le haut, ou toucher les icônes de la barre d'état) :
 * mode avion, son, lampe torche, capture d'écran, luminosité, raccourci vers l'heure.
 */
import { useGame } from '../game/store';
import { useNav } from './nav';
import { Icon } from '../components/icons';

export function ControlCenter({ onClose, onCapture, torch, onTorch }: { onClose: () => void; onCapture: () => void; torch: boolean; onTorch: () => void }) {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ type: 'settings/update', patch });
  const bright = s.brightness ?? 1;
  return (
    <div className="cc-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-label="Centre de contrôle">
      <div className="cc">
        <div className="cc-grid">
          <button className={`cc-tile${s.airplane ? ' on' : ''}`} aria-pressed={s.airplane} onClick={() => set({ airplane: !s.airplane })}>
            <Icon.Plane size={26} />
            <span>Mode avion</span>
          </button>
          <button className={`cc-tile${s.sound ? ' on' : ''}`} aria-pressed={s.sound} onClick={() => set({ sound: !s.sound })}>
            <Icon.Sound size={26} />
            <span>{s.sound ? 'Son' : 'Silencieux'}</span>
          </button>
          <button className={`cc-tile${torch ? ' on' : ''}`} aria-pressed={torch} onClick={onTorch}>
            <Icon.Torch size={26} />
            <span>Lampe torche</span>
          </button>
          <button className="cc-tile" onClick={onCapture}>
            <Icon.Image size={26} />
            <span>Capture d’écran</span>
          </button>
          <label className="cc-tile cc-slider">
            <span>Luminosité</span>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={bright}
              onChange={(e) => set({ brightness: Number(e.target.value) })}
              aria-label="Luminosité"
            />
          </label>
          <button
            className="cc-tile"
            onClick={() => {
              onClose();
              nav.open('settings', { page: 'datetime' });
            }}
          >
            <Icon.Calendar size={26} />
            <span>Date et heure</span>
          </button>
        </div>
        <button className="cc-close" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
