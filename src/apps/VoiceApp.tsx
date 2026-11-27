/**
 * Apps ajoutées à l'accueil par une enquête : Dictaphone (album « Dictaphone »)
 * et Téléphone (journal des appels « Récents », messagerie vocale, album « Messagerie »).
 */
import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { evaluate } from '../game/engine';
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
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">{title}</h1>
        <AlbumList album={album} empty={empty} voicemail={voicemail} />
      </div>
    </>
  );
}

function AlbumList({ album, empty, voicemail }: { album: string; empty: string; voicemail?: boolean }) {
  const { state, cases } = useGame();
  const nav = useNav();
  const items = albumItems(state, cases, album);
  return (
    <>
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
    </>
  );
}

export function VoiceApp() {
  return <AlbumApp title="Dictaphone" album="Dictaphone" empty="Aucun enregistrement." />;
}

/** Téléphone : Récents (journal des appels) et Messagerie. */
export function PhoneApp() {
  const { state, cases, dispatch } = useGame();
  const nav = useNav();
  const [tab, setTab] = useState<'recents' | 'messagerie'>('recents');
  const recents = callJournal(state, cases);
  const visible = nav.app === 'phone';
  useEffect(() => {
    if (visible && tab === 'recents') dispatch({ type: 'calls/seen' });
  }, [visible, tab, recents.length, dispatch]);
  const tabs = (
    <div className="seg" role="tablist" aria-label="Téléphone">
      <button role="tab" aria-selected={tab === 'recents'} aria-pressed={tab === 'recents'} onClick={() => setTab('recents')}>
        Récents
      </button>
      <button role="tab" aria-selected={tab === 'messagerie'} aria-pressed={tab === 'messagerie'} onClick={() => setTab('messagerie')}>
        Messagerie
      </button>
    </div>
  );
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Téléphone</h1>
        {tabs}
        {tab === 'messagerie' ? (
          <AlbumList album="Messagerie" empty="Aucun message vocal." voicemail />
        ) : recents.length === 0 ? (
          <Empty icon={<Icon.Call size={40} />}>Aucun appel.</Empty>
        ) : (
          <div className="group">
            {recents.map((c) => (
              <button
                key={c.id}
                className="row call-row"
                onClick={() => {
                  dispatch({ type: 'call/log', contact: c.contact, caseId: c.caseId });
                  nav.showToast(`Appel de ${c.contact}…`);
                  window.setTimeout(() => nav.showToast(`${c.contact} ne répond pas.`), 1800);
                }}
                aria-label={`${c.kind === 'manque' ? 'Appel manqué' : c.kind === 'passe' ? 'Appel sortant' : 'Appel reçu'} : ${c.contact}, ${c.time}. Rappeler`}
              >
                <span className="row-ico" style={{ color: c.kind === 'manque' ? 'var(--red)' : 'var(--text-3)' }}>
                  {c.kind === 'passe' ? <Icon.ArrowRight size={18} /> : c.kind === 'manque' ? <Icon.Close size={18} /> : <Icon.ArrowLeft size={18} />}
                </span>
                <span className="row-main">
                  <div className="row-title" style={c.kind === 'manque' ? { color: 'var(--red)' } : undefined}>
                    {c.contact}
                  </div>
                  <div className="row-sub">
                    {c.kind === 'manque' ? 'Appel manqué' : c.kind === 'passe' ? 'Appel sortant' : 'Appel reçu'}
                    {c.duration ? ` · ${c.duration}` : ''}
                  </div>
                </span>
                <span className="row-value">{c.time}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const hhmm = (at: number) => {
  const d = new Date(at);
  return d.toDateString() === new Date().toDateString()
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/** Journal des appels : ceux du joueur (récents d'abord), puis l'historique des enquêtes ouvertes. */
export function callJournal(state: GameState, cases: CaseIndex) {
  const mine = [...(state.calls ?? [])].reverse().map((c) => ({
    id: c.id,
    caseId: c.caseId,
    contact: c.contact,
    kind: c.kind,
    time: hhmm(c.at),
    duration: c.durationSec ? `${Math.floor(c.durationSec / 60)} min ${String(c.durationSec % 60).padStart(2, '0')}` : undefined,
  }));
  const past = cases.list.flatMap((def) => {
    const p = state.cases[def.id];
    if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
    return (def.callLog ?? []).filter((l) => !l.when || evaluate(l.when, state, def.id)).map((l) => ({ id: `${def.id}:${l.id}`, caseId: def.id, contact: l.contact, kind: l.kind, time: l.time, duration: l.duration }));
  });
  return [...mine, ...past];
}
