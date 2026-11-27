/**
 * Le casier de la Coordination : premier écran du jeu, chaque saison est un téléphone.
 * Saison 1 = le jeu actuel. Saison 2 et le téléphone secret sont encore des aperçus.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LogoMark } from '../components/icons';
import { useGame } from '../game/store';
import { usePhoneTime } from '../game/clock';
import { WALLPAPER } from '../content/assets';

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

export function Casier({ onOpen }: { onOpen: () => void }) {
  const { state, cases } = useGame();
  const time = usePhoneTime(state.settings);
  const solved = cases.list.filter((d) => state.cases[d.id]?.status === 'solved').length;
  const total = cases.list.length;
  const [current, setCurrent] = useState(0);
  // Taille des téléphones calée sur la hauteur disponible (sinon ils débordent sur les écrans courts).
  const [phoneW, setPhoneW] = useState(220);
  const [opening, setOpening] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const fit = () => {
      const h = el.clientHeight - 150; // place de l'étiquette sous le téléphone
      setPhoneW(Math.round(Math.max(120, Math.min(el.clientWidth * 0.62, 290, (h * 9) / 19))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    window.setTimeout(onOpen, state.settings.reduceMotion ? 0 : 750);
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

      <div className="casier-track" ref={track} style={{ ['--pw' as string]: `${phoneW}px` }}>
        {PHONES.map((ph) => (
          <div key={ph.id} className={`casier-slot${opening === ph.id ? ' opening' : ''}`}>
            <button className={`casier-phone ${ph.state}`} onClick={() => open(ph)} aria-label={`${ph.saison || 'Téléphone inconnu'} : ${ph.label}`}>
              <span className="casier-screen" style={ph.state === 'actif' ? { backgroundImage: `url(${state.overrides.wallpaper?.value ?? WALLPAPER})` } : undefined}>
                {ph.state === 'actif' && (
                  <>
                    <span className="cs-time">{time.hhmm}</span>
                    <span className="cs-date">{time.dayLabel}</span>
                    <span className="cs-notif">
                      <b>Inconnu</b>
                      <span>Tu…</span>
                    </span>
                    <span className="cs-progress">
                      <span>
                        {solved} enquête{solved > 1 ? 's' : ''} résolue{solved > 1 ? 's' : ''} sur {total}
                      </span>
                      <i>
                        <i style={{ width: `${Math.round((solved / Math.max(1, total)) * 100)}%` }} />
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
