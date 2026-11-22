/**
 * Localiser : ajoutée à l'accueil par une enquête (override `extraApp: 'localiser'`).
 * Plan fictif d'un quartier (jamais la vraie position du joueur). Un contact sans nom
 * se rapproche : sa position suit le drapeau `distance` de l'enquête (5 = loin, 0 = ici).
 */
import { useGame } from '../game/store';
import { NavBar } from '../components/ui';

/** Trajet du point, du plus loin (index 5) jusqu'au joueur (index 0). */
const PATH: [number, number][] = [
  [200, 470], // 0 : ici
  [200, 420],
  [118, 380],
  [118, 250],
  [262, 170],
  [322, 64], // 5 : loin
];
const LABELS = ['ici', 'à 15 m', 'à 120 m', 'à 400 m', 'à 900 m', 'à 2,1 km'];

export function LocateApp() {
  const { state } = useGame();
  const cid = state.overrides.extraApp?.caseId;
  const raw = cid ? state.cases[cid]?.flags.distance : undefined;
  const d = Math.max(0, Math.min(5, Math.round(Number(raw ?? 5))));
  const [x, y] = PATH[d];
  const near = d <= 1;
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Localiser</h1>
        <div className="locate-map" role="img" aria-label={`Plan du quartier. Contact inconnu ${LABELS[d]} de vous.`}>
          <svg viewBox="0 0 400 520" width="100%" aria-hidden="true">
            <rect width="400" height="520" fill="#1a1c20" />
            {/* Pâtés de maisons */}
            {[
              [20, 20, 150, 120], [230, 20, 150, 90], [20, 170, 70, 180], [150, 210, 90, 140], [290, 230, 90, 120],
              [20, 400, 140, 100], [240, 400, 140, 100], [150, 30, 50, 140],
            ].map(([a, b, c, e], i) => (
              <rect key={i} x={a} y={b} width={c} height={e} rx="6" fill="#262a30" />
            ))}
            {/* Rues */}
            <g stroke="#3d424b" strokeWidth="16" strokeLinecap="round" fill="none">
              <path d="M0 150 H400 M0 380 H400 M118 0 V520 M262 0 V520 M200 380 V520 M322 0 V150" />
            </g>
            <path d="M322 64 L262 170 L118 250 L118 380 L200 420 L200 470" stroke="rgba(239,179,92,.18)" strokeWidth="3" strokeDasharray="6 8" fill="none" />
            {/* Vous */}
            <circle cx="200" cy="470" r="22" fill="rgba(10,132,255,.18)" />
            <circle cx="200" cy="470" r="9" fill="#0a84ff" stroke="#fff" strokeWidth="3" />
            {/* Inconnu */}
            <circle cx={x} cy={y} r={near ? 26 : 18} fill="rgba(239,90,70,.18)" className="locate-pulse" />
            <circle cx={x} cy={y} r="10" fill="#e5533d" stroke="#fff" strokeWidth="3" />
          </svg>
        </div>
        <div className="group">
          <div className="row">
            <span className="avatar sm" style={{ background: '#3a2a2a' }} aria-hidden="true">?</span>
            <span className="row-main">
              <div className="row-title">Contact inconnu</div>
              <div className="row-sub">{d === 0 ? 'Avec vous' : `${LABELS[d]} · mis à jour à l’instant`}</div>
            </span>
          </div>
          <div className="row">
            <span className="avatar sm" style={{ background: '#0a84ff' }} aria-hidden="true">•</span>
            <span className="row-main">
              <div className="row-title">Vous</div>
              <div className="row-sub">Position partagée avec 1 contact</div>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
