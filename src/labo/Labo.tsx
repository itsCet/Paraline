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
const PANOS: Record<string, { src: string; zones: Hotspot[]; found: Record<string, string>; exit: { x: number; y: number; to: string; label: string } }> = {
  chambre: {
    // Image de l'auteur : la chambre de Clara (Skybox AI).
    src: '/media/labo/chambre-clara.jpg',
    zones: [
      { id: 'dicta', x: 0.752, y: 0.64, w: 0.048, h: 0.04, observationId: 'dictaphone' },
      { id: 'poste', x: 0.405, y: 0.55, w: 0.04, h: 0.04, observationId: 'poste' },
      { id: 'ours', x: 0.09, y: 0.29, w: 0.04, h: 0.06, observationId: 'ours' },
    ],
    found: {
      dictaphone: 'Trouvé : un mini-dictaphone, sur la table de nuit.',
      poste: 'Trouvé : un poste-cassette, sur le bureau.',
      ours: 'Trouvé : un ours en peluche, en haut de l’armoire.',
    },
    exit: { x: 0.955, y: 0.55, to: 'couloir', label: 'Couloir' },
  },
  couloir: {
    // Image de l'auteur : le couloir de l'étage, la porte de la mère brûlée par l'incendie.
    src: '/media/labo/couloir.jpg',
    zones: [
      { id: 'cle', x: 0.81, y: 0.58, w: 0.025, h: 0.07, observationId: 'cle' },
      { id: 'porte', x: 0.69, y: 0.22, w: 0.14, h: 0.6, observationId: 'porte-brulee' },
      { id: 'photos', x: 0.13, y: 0.29, w: 0.075, h: 0.21, observationId: 'photos' },
    ],
    found: {
      cle: 'Trouvé : la clé est restée dans la serrure… côté couloir. On l’a enfermée de l’extérieur.',
      'porte-brulee': 'Trouvé : la porte de la chambre de la mère, noircie par l’incendie.',
      photos: 'Trouvé : des photos de famille. Clara, sa mère… et un homme.',
    },
    exit: { x: 0.32, y: 0.55, to: 'chambre', label: 'Chambre de Clara' },
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
          {tab === '360' && 'Glissez, pincez, ou « Regarder avec le téléphone ». Chambre : dictaphone, poste-cassette, ours. Couloir : la porte brûlée.'}
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
            onHotspot={(h) => add(h.observationId, p.found[h.observationId] ?? 'Trouvé.')}
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
