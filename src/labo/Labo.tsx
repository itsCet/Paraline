/**
 * Labo (adresse `/?labo`) : essayer sur un vrai téléphone les mécaniques pas encore utilisées
 * par une enquête : lampe torche, photo à 360°, boussole. Rien n'est sauvegardé.
 */
import { useState } from 'react';
import { Flashlight } from '../components/Flashlight';
import { Panorama } from '../components/Panorama';
import { CompassDial } from '../components/CompassDial';
import type { Hotspot } from '../game/types';

type Tab = 'lampe' | '360' | 'boussole';

const LAMPE_ZONES: Hotspot[] = [{ id: 'uv', x: 0.1, y: 0.58, w: 0.42, h: 0.16, observationId: 'uv' }];
const PANOS: Record<string, { src: string; zones: Hotspot[]; exit: { x: number; y: number; to: string; label: string } }> = {
  chambre: {
    src: '/media/labo/chambre.jpg',
    zones: [{ id: 'main1', x: 0.9, y: 0.45, w: 0.034, h: 0.105, observationId: 'main-chambre' }],
    exit: { x: 0.75, y: 0.53, to: 'couloir', label: 'Couloir' },
  },
  couloir: {
    src: '/media/labo/couloir.jpg',
    zones: [{ id: 'main2', x: 0.066, y: 0.45, w: 0.034, h: 0.105, observationId: 'main-couloir' }],
    exit: { x: 0.25, y: 0.53, to: 'chambre', label: 'Chambre' },
  },
};

export function Labo() {
  const [tab, setTab] = useState<Tab>('lampe');
  const [found, setFound] = useState<string[]>([]);
  const [room, setRoom] = useState('chambre');
  const [msg, setMsg] = useState('');
  const add = (id: string, text: string) => {
    setFound((f) => (f.includes(id) ? f : [...f, id]));
    setMsg(text);
    navigator.vibrate?.(30);
  };
  const p = PANOS[room];
  return (
    <div className="labo">
      <header className="labo-head">
        <h1>Labo Paraline</h1>
        <div className="chips" role="tablist" aria-label="Mécaniques">
          {(
            [
              ['lampe', 'Lampe torche'],
              ['360', 'Photo à 360°'],
              ['boussole', 'Boussole'],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button key={t} role="tab" className="chip" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => (setTab(t), setMsg(''))}>
              {l}
            </button>
          ))}
        </div>
        <p className="labo-help">
          {tab === 'lampe' && 'Glissez le doigt (ou inclinez le téléphone) pour éclairer. Une écriture n’apparaît que dans le faisceau : touchez-la.'}
          {tab === '360' && 'Glissez pour regarder autour de vous, pincez pour zoomer, ou « Regarder avec le téléphone ». Trouvez l’empreinte de main, puis passez dans l’autre pièce.'}
          {tab === 'boussole' && 'Activez la boussole et tournez-vous lentement : un signal vient du nord-est (45°). Tenez la direction 3 secondes.'}
        </p>
        <p className="labo-msg" role="status">{msg}</p>
      </header>
      <div className="labo-stage">
        {tab === 'lampe' && (
          <Flashlight
            src="/media/cases/douze-pourcent/piece.jpg"
            alt="Le local au sous-sol."
            width={1086}
            height={1448}
            reveal="/media/labo/uv-ecriture.png"
            hotspots={LAMPE_ZONES}
            found={found}
            onHotspot={() => add('uv', 'Trouvé : « ELLE EST LÀ », écrit à l’encre invisible.')}
          />
        )}
        {tab === '360' && (
          <Panorama
            key={room}
            src={p.src}
            alt={`Pièce de test : ${room}.`}
            hotspots={p.zones}
            found={found}
            onHotspot={(h) => add(h.observationId, 'Trouvé : une empreinte de main, sur le mur.')}
            exits={[{ ...p.exit, onGo: () => (setRoom(p.exit.to), setMsg(`Vous êtes dans : ${p.exit.label}`)) }]}
          />
        )}
        {tab === 'boussole' && (
          <div className="scroll">
            <CompassDial targets={[{ id: 'ne', bearing: 45, label: 'Signal au nord-est' }]} found={found} onFound={(id) => add(id, 'Signal trouvé au nord-est !')} />
            {found.includes('ne') && (
              <button className="btn btn-secondary btn-block" onClick={() => setFound((f) => f.filter((x) => x !== 'ne'))}>
                Recommencer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
