import { useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { resolveMedia, thumbOf } from '../game/selectors';
import { Empty, KindIcon, NavBar } from '../components/ui';
import { Icon } from '../components/icons';

type Tab = 'received' | 'copies';

export function PhotosApp() {
  const { state, cases } = useGame();
  const nav = useNav();
  const [tab, setTab] = useState<Tab>('received');

  const received = cases.list.flatMap((def) => {
    const p = state.cases[def.id];
    if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
    return p.grantedMedia
      .map((id) => resolveMedia(def, state, id))
      .filter((r): r is NonNullable<typeof r> => !!r && (r.def.kind === 'image' || r.def.kind === 'video'))
      .map((r) => ({ caseId: def.id, r }));
  });

  // Pièces jointes d'abord, puis un groupe par album partagé.
  const groupMap = new Map<string, typeof received>();
  for (const item of received) {
    const key = item.r.def.album ?? '';
    groupMap.set(key, [...(groupMap.get(key) ?? []), item]);
  }
  const groups = [...groupMap.entries()].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Photos</h1>
        <div className="chips" role="tablist" aria-label="Albums">
          <button className="chip" role="tab" aria-selected={tab === 'received'} aria-pressed={tab === 'received'} onClick={() => setTab('received')}>
            Pièces reçues
          </button>
          <button className="chip" role="tab" aria-selected={tab === 'copies'} aria-pressed={tab === 'copies'} onClick={() => setTab('copies')}>
            Copies conservées
          </button>
        </div>
        {tab === 'received' &&
          (received.length === 0 ? (
            <Empty icon={<Icon.Image size={40} />}>Les photos et vidéos des enquêtes acceptées apparaîtront ici.</Empty>
          ) : (
            groups.map(([album, items]) => (
              <section key={album || 'pj'} aria-label={album ? `Album partagé ${album}` : 'Pièces jointes'}>
                {groups.length > 1 && <h2 className="section-title">{album ? `Album partagé « ${album} »` : 'Pièces jointes'}</h2>}
                <div className="photo-grid">
                  {items.map(({ caseId, r }) => {
                    const t = thumbOf(r.variant, r.def.kind);
                    return (
                      <button key={`${caseId}:${r.def.id}`} className="photo-cell" onClick={() => nav.openViewer({ kind: 'case', caseId, mediaId: r.def.id })} aria-label={`Ouvrir ${r.def.name}`}>
                        {t ? <img src={t} alt="" loading="lazy" /> : <KindIcon kind={r.def.kind} size={28} />}
                        {r.def.kind === 'video' && (
                          <span className="kind">
                            <Icon.Video size={16} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          ))}
        {tab === 'copies' &&
          (state.copies.length === 0 ? (
            <Empty icon={<Icon.Save size={40} />}>Aucune copie. Lorsqu’une enquête le permet, « Enregistrer une copie » conserve une image telle qu’elle est à cet instant.</Empty>
          ) : (
            <div className="photo-grid">
              {[...state.copies].reverse().map((c) => (
                <button key={c.id} className="photo-cell" onClick={() => nav.openViewer({ kind: 'copy', copyId: c.id })} aria-label={`Ouvrir la copie de ${c.name}`}>
                  <img src={c.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
