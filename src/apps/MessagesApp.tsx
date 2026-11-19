import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { availableReplies, evaluate, queueReady } from '../game/engine';
import { resolveEntry } from '../game/reducer';
import { character, resolveMedia } from '../game/selectors';
import { Avatar, Empty, KindIcon, NavBar } from '../components/ui';
import { Icon } from '../components/icons';
import type { CaseDefinition, Id } from '../game/types';

interface ThreadRef {
  caseId: Id;
  threadId: Id;
}

export function MessagesApp() {
  const { state, cases } = useGame();
  const nav = useNav();
  const [open, setOpen] = useState<ThreadRef | null>(null);
  useIntent('messages', (i) => i.caseId && i.threadId && setOpen({ caseId: i.caseId, threadId: i.threadId }));

  const threads = cases.list.flatMap((def) => {
    const p = state.cases[def.id];
    if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
    return def.threads
      .filter((t) => (p.threads[t.id]?.length ?? 0) > 0 || availableReplies(def, state, t.id).length > 0)
      .map((t) => ({ def, t, entries: p.threads[t.id] ?? [], unread: (p.threads[t.id]?.length ?? 0) - (p.threadRead[t.id] ?? 0) }));
  });
  const archived = (d: CaseDefinition, t: CaseDefinition['threads'][number]) => !!t.archivedWhen && evaluate(t.archivedWhen, state, d.id);
  threads.sort(
    (a, b) =>
      Number(archived(a.def, a.t)) - Number(archived(b.def, b.t)) ||
      (b.entries[b.entries.length - 1]?.at ?? 0) - (a.entries[a.entries.length - 1]?.at ?? 0),
  );

  const def = open && cases.byId.get(open.caseId);
  useEffect(() => nav.setScreen('messages', open ? 'thread' : 'list'), [open, nav]);
  if (open && def) return <Thread def={def} threadId={open.threadId} onBack={() => setOpen(null)} />;

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Messages</h1>
        {threads.length === 0 ? (
          <Empty icon={<Icon.Message size={40} />}>Vos échanges apparaîtront ici lorsque vous accepterez une enquête.</Empty>
        ) : (
          <ul className="list">
            {threads.map(({ def: d, t, entries, unread }) => {
              const who = character(d, t.contact);
              const last = entries[entries.length - 1];
              const msg = last && resolveEntry(d, last.messageId);
              return (
                <li key={`${d.id}:${t.id}`}>
                  <button className="mail-row" onClick={() => setOpen({ caseId: d.id, threadId: t.id })} aria-label={`${who.name}${unread > 0 ? `, ${unread} non lu` : ''}`}>
                    {unread > 0 && <span className="dot" aria-hidden="true" />}
                    <Avatar initials={who.initials} color={who.color} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="mail-head">
                        <span className="mail-from">{who.name}</span>
                      </span>
                      <div className="mail-preview">
                        {msg ? (msg.from === 'player' ? `Vous : ${msg.text ?? ''}` : (msg.text ?? 'Pièce jointe')) : 'Nouvelle conversation'}
                      </div>
                      <span className="mail-meta">
                        {d.title}
                        {archived(d, t) && <span className="tag neutral">Archivée</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function Thread({ def, threadId, onBack }: { def: CaseDefinition; threadId: Id; onBack: () => void }) {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const p = state.cases[def.id];
  const thread = def.threads.find((t) => t.id === threadId);
  const who = character(def, thread?.contact ?? def.client);
  const entries = p?.threads[threadId] ?? [];
  const replies = availableReplies(def, state, threadId);
  const airplane = state.settings.airplane;
  const prepared = p?.preparedReply ? replies.find((r) => r.id === p.preparedReply) : undefined;
  const typing = state.queue.some(
    (q) => q.caseId === def.id && q.kind === 'message' && queueReady(state, q) && def.messages.find((m) => m.id === q.id)?.threadId === threadId,
  );
  // Joignabilité particulière (contact qui n'émet que sous certaines conditions).
  const presence = thread?.presence;
  const isEnded = !!presence?.endedWhen && evaluate(presence.endedWhen, state, def.id);
  const isOnline = !presence || (!isEnded && evaluate(presence.online, state, def.id));
  const presenceLabel = presence ? (isEnded ? presence.endedLabel : isOnline ? undefined : presence.offlineLabel) : undefined;
  const visible = nav.app === 'messages' && !nav.viewer;
  const endRef = useRef<HTMLDivElement>(null);
  const sending = useRef<string | null>(null);

  useEffect(() => {
    if (visible) dispatch({ type: 'thread/read', caseId: def.id, threadId });
  }, [visible, entries.length, def.id, threadId, dispatch]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: state.settings.reduceMotion ? 'auto' : 'smooth' });
  }, [entries.length, typing, state.settings.reduceMotion]);
  useEffect(() => {
    sending.current = null;
  }, [entries.length]);

  const choose = (replyId: Id) => {
    // Garde locale contre le double appui ; le moteur refuse aussi les doublons.
    if (sending.current === replyId) return;
    if (airplane) {
      dispatch({ type: 'reply/prepare', caseId: def.id, replyId });
      return;
    }
    sending.current = replyId;
    dispatch({ type: 'reply/send', caseId: def.id, replyId });
  };

  const status = p?.status === 'solved' ? 'Affaire résolue' : 'Enquête en cours';

  return (
    <>
      <NavBar
        back="Messages"
        onBack={onBack}
        title={
          <span className="thread-head" style={{ justifyContent: 'center' }}>
            <Avatar initials={who.initials} color={who.color} small />
            <span className="who" style={{ textAlign: 'left' }}>
              <div className="name">{who.name}</div>
              <div className="sub">{presenceLabel ?? who.role ?? status}</div>
            </span>
          </span>
        }
        right={
          <button className="icon-btn" aria-label="Ouvrir le dossier de l’affaire" onClick={() => nav.open('files', { caseId: def.id })}>
            <Icon.Info size={22} />
          </button>
        }
      />
      <div className="scroll" aria-live="polite">
        <div className="bubbles">
          {thread?.stamp && <div className="stamp">{thread.stamp}</div>}
          {entries.map((e) => {
            const m = resolveEntry(def, e.messageId);
            if (!m) return null;
            const mine = m.from === 'player';
            return (
              <div key={e.messageId} style={{ display: 'contents' }}>
                {m.attachments.map((a) => {
                  const r = resolveMedia(def, state, a);
                  if (!r) return null;
                  const thumb = r.def.kind === 'image' ? r.variant.src : r.variant.poster;
                  return (
                    <button
                      key={a}
                      className={`bubble media${mine ? ' me' : ''}`}
                      onClick={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: a })}
                      aria-label={`Ouvrir ${r.def.name}`}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" />
                      ) : (
                        <span className="bubble-file">
                          <KindIcon kind={r.def.kind} /> {r.def.name}
                        </span>
                      )}
                    </button>
                  );
                })}
                {m.text && <div className={`bubble${mine ? ' me' : ''}`}>{m.text}</div>}
              </div>
            );
          })}
          {typing && (
            <div className="typing" aria-label={`${who.name} écrit…`}>
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      {presence && presenceLabel && entries.length > 0 && (
        <div className="replies" aria-live="polite">
          <div className="callout neutral" role="status" style={{ marginBottom: 0 }}>
            <span>{presenceLabel}</span>
          </div>
        </div>
      )}
      {(p?.status === 'active' || p?.status === 'solved') && isOnline && (replies.length > 0 || (airplane && !presence && p?.status === 'active')) && (
        <div className="replies" aria-label="Votre réponse">
          {airplane && (
            <div className="callout neutral" role="status">
              <Icon.Plane size={18} />
              <span>
                Mode avion activé : l’historique reste lisible, mais aucun message ne part. Choisissez une réponse pour la préparer, puis
                désactivez le mode avion dans{' '}
                <button className="link" onClick={() => nav.open('settings', { page: 'root' })}>
                  Réglages
                </button>
                .
              </span>
            </div>
          )}
          {prepared && !airplane && (
            <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => choose(prepared.id)}>
              Envoyer la réponse préparée
            </button>
          )}
          {replies.length > 0 && <h3>Votre réponse</h3>}
          {replies.map((r) => (
            <button
              key={r.id}
              className={`reply${prepared?.id === r.id ? ' prepared' : ''}`}
              onClick={() => choose(r.id)}
              aria-label={`${prepared?.id === r.id ? 'Réponse préparée : ' : ''}${r.label}`}
            >
              <span>{r.label}</span>
              {prepared?.id === r.id ? <span className="tag neutral">{airplane ? 'En attente' : 'Préparée'}</span> : <Icon.Chevron size={18} />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
