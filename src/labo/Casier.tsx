/**
 * MAQUETTE (adresse `/?casier`) : le casier de la Coordination, où chaque saison est un téléphone.
 * Rien n'est branché au jeu : sert à valider l'idée et le rendu avant de coder la vraie version.
 */
import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '../components/icons';

interface Phone {
  id: string;
  piece: string;
  saison: string;
  label: string;
  detail: string;
  state: 'actif' | 'scelle' | 'secret';
}

const PHONES: Phone[] = [
  { id: 's1', piece: '01', saison: 'Saison 1', label: 'Téléphone de V. Hessel', detail: 'Restauré le 17/11/2024', state: 'actif' },
  { id: 's2', piece: '02', saison: 'Saison 2', label: 'Téléphone de « M. »', detail: 'Saisi le 03/02/2027', state: 'scelle' },
  { id: 's3', piece: '??', saison: '', label: 'Aucune étiquette', detail: 'Origine inconnue', state: 'secret' },
];

export function Casier() {
  const [current, setCurrent] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);

  // Téléphone au centre du défilement.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => {
      const w = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth : 1;
      setCurrent(Math.max(0, Math.min(PHONES.length - 1, Math.round(el.scrollLeft / (w + 18)))));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  const open = (p: Phone) => {
    if (p.state !== 'actif') return;
    setOpening(p.id);
    window.setTimeout(() => (location.href = '/'), 900);
  };

  const p = PHONES[current];
  return (
    <div className="casier">
      <div className="casier-light" aria-hidden="true" />
      <header className="casier-head">
        <LogoMark size={22} />
        <div>
          <div className="casier-title">Coordination Paraline</div>
          <div className="casier-sub">Casier des pièces · accès enquêteur</div>
        </div>
      </header>

      <div className="casier-track" ref={track}>
        {PHONES.map((ph) => (
          <div key={ph.id} className={`casier-slot${opening === ph.id ? ' opening' : ''}`}>
            <button className={`casier-phone ${ph.state}`} onClick={() => open(ph)} aria-label={`${ph.saison || 'Téléphone inconnu'} : ${ph.label}`}>
              <span className="casier-screen">
                {ph.state === 'actif' && (
                  <>
                    <span className="cs-time">23:48</span>
                    <span className="cs-date">Mercredi 17 novembre</span>
                    <span className="cs-notif">
                      <b>Inconnu</b>
                      <span>Tu…</span>
                    </span>
                    <span className="cs-progress">
                      <span>3 enquêtes sur 16</span>
                      <i>
                        <i style={{ width: '19%' }} />
                      </i>
                    </span>
                  </>
                )}
                {ph.state === 'scelle' && (
                  <>
                    <span className="cs-off" />
                    <span className="cs-seal" aria-hidden="true" />
                    <span className="cs-tape">SCELLÉ · PIÈCE À CONVICTION · SCELLÉ</span>
                  </>
                )}
                {ph.state === 'secret' && (
                  <>
                    <span className="cs-off" />
                    <svg className="cs-crack" viewBox="0 0 100 200" aria-hidden="true">
                      <path d="M62 40 L55 70 L68 88 L50 120 L58 150 L44 196 M55 70 L30 64 L12 80 M68 88 L92 96 M50 120 L24 132 M58 150 L80 170" />
                    </svg>
                  </>
                )}
              </span>
            </button>
            <div className={`casier-tag ${ph.state}`}>
              <span className="tag-hole" aria-hidden="true" />
              <div className="tag-piece">Pièce n° {ph.piece}</div>
              {ph.saison && <div className="tag-saison">{ph.saison}</div>}
              <div className="tag-label">{ph.label}</div>
              <div className="tag-detail">{ph.detail}</div>
              <span className={`tag-stamp ${ph.state}`}>{ph.state === 'actif' ? 'En cours' : ph.state === 'scelle' ? 'Bientôt' : 'Verrouillé'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="casier-dots" aria-hidden="true">
        {PHONES.map((ph, i) => (
          <i key={ph.id} className={i === current ? 'on' : undefined} />
        ))}
      </div>

      <footer className="casier-foot">
        {p.state === 'actif' && <button className="btn btn-primary btn-block" onClick={() => open(p)}>Prendre le téléphone</button>}
        {p.state === 'scelle' && (
          <>
            <button className="btn btn-primary btn-block">Pass Saison 2 · 5,00 CHF</button>
            <p className="casier-note">Disponible le 3 février 2027. Les 3 premières enquêtes seront gratuites.</p>
          </>
        )}
        {p.state === 'secret' && <p className="casier-note">Terminez la saison 1 pour savoir à qui il appartient.</p>}
      </footer>
    </div>
  );
}
