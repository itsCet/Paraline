/**
 * Apps ajoutées à l'accueil par une enquête : Dictaphone (album « Dictaphone »)
 * et Téléphone (messagerie vocale, album « Messagerie »).
 */
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { resolveMedia } from '../game/selectors';
import { Empty, NavBar } from '../components/ui';
import { Icon } from '../components/icons';
import type { GameState } from '../game/types';
import type { CaseIndex } from '../game/engine';

/** Enregistrements d'un album disponibles dans les enquêtes en cours ou résolues. */
export function albumItems(state: GameState, cases: CaseIndex, album: string) {
  return cases.list.flatMap((def) => {
    const p = state.cases[def.id];
    if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
    return def.media
      .filter((m) => m.album === album && p.grantedMedia.includes(m.id))
      .map((m) => ({ def, r: resolveMedia(def, state, m.id)!, viewed: p.viewedMedia.includes(m.id) }));
  });
}

function AlbumApp({ title, album, empty, voicemail }: { title: string; album: string; empty: string; voicemail?: boolean }) {
  const { state, cases } = useGame();
  const nav = useNav();
  const items = albumItems(state, cases, album);
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">{title}</h1>
        {items.length === 0 ? (
          <Empty icon={<Icon.Audio size={40} />}>{empty}</Empty>
        ) : (
          <div className="group">
            {items.map(({ def, r, viewed }) => (
              <button
                key={r.def.id}
                className="row"
                onClick={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: r.def.id })}
                aria-label={`${voicemail && !viewed ? 'Nouveau message, ' : ''}Ouvrir ${r.def.name}`}
              >
                {voicemail && <span className="dot" aria-hidden="true" style={{ visibility: viewed ? 'hidden' : 'visible' }} />}
                <span className="row-ico">
                  <Icon.Audio size={22} />
                </span>
                <span className="row-main">
                  <div className="row-title">{r.def.name}</div>
                  <div className="row-sub">{voicemail ? `${r.def.sizeLabel ?? ''} · ${r.def.durationLabel ?? ''}` : r.variant.src ? r.def.durationLabel : '00:00'}</div>
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

export function VoiceApp() {
  return <AlbumApp title="Dictaphone" album="Dictaphone" empty="Aucun enregistrement." />;
}

export function PhoneApp() {
  return <AlbumApp title="Messagerie" album="Messagerie" empty="Aucun message vocal." voicemail />;
}
