/**
 * Plans : la carte de l'enquête en cours. Fond dessiné (ville, lac, vallée), épingles qui
 * apparaissent au fil de l'enquête (`map.places[].when`). Toucher une épingle peut relever un indice.
 */
import { useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { evaluate } from '../game/engine';
import { Empty, NavBar } from '../components/ui';
import { Icon } from '../components/icons';
import type { CaseDefinition, MapPlace } from '../game/types';

export function MapApp() {
  const { state, cases, dispatch } = useGame();
  const nav = useNav();
  const def = state.activeCaseId ? cases.byId.get(state.activeCaseId) : undefined;
  const [sel, setSel] = useState<string | null>(null);
  if (!def?.map) {
    return (
      <>
        <NavBar />
        <div className="scroll">
          <h1 className="large-title">Plans</h1>
          <Empty icon={<Icon.Map size={40} />}>Aucun lieu pour l’enquête en cours.</Empty>
        </div>
      </>
    );
  }
  const places = def.map.places.filter((p) => !p.when || evaluate(p.when, state, def.id));
  const place = places.find((p) => p.id === sel);
  const tap = (p: MapPlace) => {
    setSel(p.id);
    if (p.observationId) dispatch({ type: 'observation/found', caseId: def.id, observationId: p.observationId });
  };
  return (
    <>
      <NavBar />
      <div className="map-app">
        <div className="map-head">
          <h1 className="large-title" style={{ margin: 0 }}>Plans</h1>
          <div className="row-sub">{def.map.title}</div>
        </div>
        <div className="map-canvas" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
          <Terrain def={def} />
          {places.map((p) => (
            <button
              key={p.id}
              className={`map-pin ${p.tone ?? 'lieu'}${sel === p.id ? ' on' : ''}`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              onClick={() => tap(p)}
              aria-label={p.label}
            >
              <span className="map-dot" aria-hidden="true" />
              <span className="map-label">{p.label}</span>
            </button>
          ))}
        </div>
        {place && (
          <div className="map-card" role="status">
            <b>{place.label}</b>
            {place.detail && <p>{place.detail}</p>}
            {place.mediaId && (
              <button className="link" onClick={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: place.mediaId! })}>
                Voir la pièce
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** Fond de carte dessiné, selon le terrain de l'enquête. */
function Terrain({ def }: { def: CaseDefinition }) {
  const t = def.map!.terrain;
  return (
    <svg className="map-terrain" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="140" fill="#1b1f25" />
      {t === 'ville' && (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={`h${i}`} d={`M0 ${8 + i * 15} L100 ${4 + i * 15.5}`} stroke="#2b313a" strokeWidth={i % 3 === 0 ? 2.4 : 1.2} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`v${i}`} d={`M${6 + i * 15} 0 L${10 + i * 14} 140`} stroke="#2b313a" strokeWidth={i % 3 === 1 ? 2.4 : 1.2} />
          ))}
          <path d="M-5 98 C20 92 30 108 52 100 S85 88 105 96 L105 104 C84 97 70 112 50 108 S18 100 -5 106Z" fill="#22394d" />
          <rect x="62" y="18" width="20" height="16" rx="3" fill="#1f3326" />
          <path d="M0 60 L100 52" stroke="#3a3324" strokeWidth="3" />
        </>
      )}
      {t === 'lac' && (
        <>
          {Array.from({ length: 70 }, (_, i) => (
            <circle key={i} cx={(i * 37) % 100} cy={(i * 53) % 140} r={1.4} fill="#1f2e24" />
          ))}
          <path d="M18 30 C40 18 78 22 86 44 S90 96 70 112 S22 120 14 96 S0 48 18 30Z" fill="#2a3b4a" stroke="#3b5163" strokeWidth="1" />
          <ellipse cx="60" cy="62" rx="7" ry="4.5" fill="#1f2e24" />
          <path d="M0 128 C30 122 60 132 100 124" stroke="#3a3324" strokeWidth="2.2" fill="none" />
        </>
      )}
      {t === 'vallee' && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M-5 ${20 + i * 14} C25 ${10 + i * 14} 60 ${32 + i * 14} 105 ${16 + i * 14}`} stroke="#27302a" strokeWidth="1" fill="none" />
          ))}
          <path d="M40 -5 C46 30 30 60 48 90 S60 120 52 145" stroke="#2a3b4a" strokeWidth="4" fill="none" />
          <path d="M-5 70 L105 64" stroke="#3a3324" strokeWidth="2.4" />
        </>
      )}
    </svg>
  );
}
