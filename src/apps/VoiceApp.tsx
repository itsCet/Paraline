/** Dictaphone : n'apparaît que lorsqu'une enquête l'ajoute à l'accueil. Liste les enregistrements de l'album « Dictaphone ». */
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { resolveMedia } from '../game/selectors';
import { Empty, NavBar } from '../components/ui';
import { Icon } from '../components/icons';

export function VoiceApp() {
  const { state, cases } = useGame();
  const nav = useNav();
  const items = cases.list.flatMap((def) => {
    const p = state.cases[def.id];
    if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
    return def.media
      .filter((m) => m.album === 'Dictaphone' && p.grantedMedia.includes(m.id))
      .map((m) => ({ def, r: resolveMedia(def, state, m.id)! }));
  });
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Dictaphone</h1>
        {items.length === 0 ? (
          <Empty icon={<Icon.Audio size={40} />}>Aucun enregistrement.</Empty>
        ) : (
          <div className="group">
            {items.map(({ def, r }) => (
              <button key={r.def.id} className="row" onClick={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: r.def.id })} aria-label={`Ouvrir ${r.def.name}`}>
                <span className="row-ico">
                  <Icon.Audio size={22} />
                </span>
                <span className="row-main">
                  <div className="row-title">{r.def.name}</div>
                  <div className="row-sub">{r.variant.src ? r.def.durationLabel : '00:00'}</div>
                </span>
                <Icon.Chevron className="chev" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
