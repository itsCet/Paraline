import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { availableReplies, evaluate, newReplies, queueReady } from '../game/engine';
import { resolveEntry } from '../game/reducer';
import { character, resolveMedia } from '../game/selectors';
import { Avatar, Empty, KindIcon, NavBar } from '../components/ui';
import { Icon } from '../components/icons';
import type { CaseDefinition, Id, ThreadEntry } from '../game/types';
import { manualDate } from '../game/clock';

/** Durée avant livraison pendant laquelle l'indicateur de saisie s'affiche. */
const TYPING_WINDOW = 3500;

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
      .map((t) => ({ def, t, entries: p.threads[t.id] ?? [], unread: (p.threads[t.id]?.length ?? 0) - (p.threadRead[t.id] ?? 0), fresh: newReplies(def, state, t.id).length > 0 }));
  });
  const archived = (d: CaseDefinition, t: CaseDefinition['threads'][number]) => !!t.archivedWhen && evaluate(t.archivedWhen, state, d.id);
  threads.sort(
    (a, b) =>
      Number(archived(a.def, a.t)) - Number(archived(b.def, b.t)) ||
      (b.entries[b.entries.length - 1]?.at ?? 0) - (a.entries[a.entries.length - 1]?.at ?? 0),
  );

  const def = open && cases.byId.get(open.caseId);
  const [tab, setTab] = useState<'conv' | 'arch'>('conv');
  useEffect(() => {
    nav.setScreen('messages', open ? 'thread' : 'list');
  }, [open, nav]);
  if (open && def) {
    // Barre des contacts sur le côté : on passe d'une conversation à l'autre sans revenir en arrière.
    const rail = threads.filter((x) => !archived(x.def, x.t) || (x.def.id === open.caseId && x.t.id === open.threadId));
    const thread = <Thread key={`${open.caseId}:${open.threadId}`} def={def} threadId={open.threadId} onBack={() => setOpen(null)} />;
    if (rail.length < 2) return thread;
    return (
      <div className="msg-split">
        <nav className="msg-rail" aria-label="Conversations">
          {rail.map(({ def: d, t, unread }) => {
            const who = character(d, t.contact);
            const current = d.id === open.caseId && t.id === open.threadId;
            return (
              <button
                key={`${d.id}:${t.id}`}
                className={`msg-rail-item${current ? ' current' : ''}`}
                aria-current={current ? 'true' : undefined}
                aria-label={`${who.name}${unread > 0 && !current ? `, ${unread} non lu` : ''}`}
                onClick={() => setOpen({ caseId: d.id, threadId: t.id })}
              >
                <Avatar initials={who.initials} color={who.color} />
                {unread > 0 && !current && <span className="msg-rail-dot" aria-hidden="true" />}
                <span className="msg-rail-name" aria-hidden="true">{who.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
        <div className="msg-pane">{thread}</div>
      </div>
    );
  }
  const nArch = threads.filter((x) => archived(x.def, x.t)).length;
  const shown = threads.filter((x) => archived(x.def, x.t) === (tab === 'arch'));

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Messages</h1>
        {threads.length > 0 && (
          <div className="seg" role="group" aria-label="Afficher">
            <button aria-pressed={tab === 'conv'} onClick={() => setTab('conv')}>
              Conversations
            </button>
            <button aria-pressed={tab === 'arch'} onClick={() => setTab('arch')}>
              Archivées{nArch ? ` (${nArch})` : ''}
            </button>
          </div>
        )}
        {threads.length > 0 && shown.length === 0 ? (
          <Empty>{tab === 'arch' ? 'Aucune conversation archivée.' : 'Toutes vos conversations sont archivées.'}</Empty>
        ) : threads.length === 0 ? (
          <Empty>Aucune conversation. Acceptez une enquête : vos témoins vous écriront ici.</Empty>
        ) : (
          <ul className="list">
            {shown.map(({ def: d, t, entries, unread, fresh }) => {
              const who = character(d, t.contact);
              const last = entries[entries.length - 1];
              const msg = last && resolveEntry(d, last.messageId);
              return (
                <li key={`${d.id}:${t.id}`}>
                  <button className="mail-row" onClick={() => setOpen({ caseId: d.id, threadId: t.id })} aria-label={`${who.name}${unread > 0 ? `, ${unread} non lu` : fresh ? ', nouvelle réponse possible' : ''}`}>
                    {unread > 0 ? (
                      <span className="dot" aria-hidden="true" />
                    ) : fresh ? (
                      <span className="reply-mark" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 12a7.5 7.5 0 01-11 6.6L4 20l1.4-4.3A7.5 7.5 0 1120 12z" /></svg>
                      </span>
                    ) : null}
                    <Avatar initials={who.initials} color={who.color} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="mail-head">
                        <span className="mail-from">{who.name}</span>
                        {last && <span className="mail-time">{entryTime(d, t, last, msg?.from === 'player', msg?.time, state.settings)}</span>}
                      </span>
                      <div className="mail-preview">
                        {msg
                  ? msg.from === 'player'
                    ? `Vous : ${msg.text ?? ''}`
                    : `${t.members && !msg.system ? `${character(d, msg.from).name} : ` : ''}${msg.text ?? 'Pièce jointe'}`
                  : 'Nouvelle conversation'}
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
  // « En train d'écrire » seulement pour un message imminent, jamais pour un événement programmé plus tard.
  const [clock, setClock] = useState(() => Date.now());
  const pending = state.queue.filter(
    (q) => q.caseId === def.id && q.kind === 'message' && queueReady(state, q) && def.messages.find((m) => m.id === q.id)?.threadId === threadId,
  );
  useEffect(() => {
    if (!pending.length) return;
    const id = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [pending.length]);
  const typing = pending.some((q) => q.notBefore - clock <= TYPING_WINDOW);
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
  }, [visible, entries.length, replies.length, def.id, threadId, dispatch]);
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
  const time = (e: ThreadEntry, mine: boolean, fixed?: string) => entryTime(def, thread, e, mine, fixed, state.settings);
  // Dernier message du contact : « En ligne » s'il date de moins de 3 minutes.
  const lastTheirs = [...entries].reverse().find((e) => {
    const m = resolveEntry(def, e.messageId);
    return m && !m.system && m.from !== 'player';
  });
  const recent = !!lastTheirs && !thread?.frozenTime && Date.now() - lastTheirs.at < 3 * 60_000 && !resolveEntry(def, lastTheirs.messageId)?.time;
  const online = isOnline && !presenceLabel && (typing || recent);
  // Accusé de lecture : un message du joueur est « lu » quand le contact a écrit après.
  const lastTheirsIndex = lastTheirs ? entries.indexOf(lastTheirs) : -1;
  const lastMineIndex = entries.map((e) => resolveEntry(def, e.messageId)).reduce((acc, m, i) => (m && m.from === 'player' && !m.system ? i : acc), -1);
  const call = () => {
    if (!isOnline || isEnded) {
      nav.showToast(thread?.callText ?? `${who.name} : numéro injoignable.`);
      return;
    }
    nav.showToast(`Appel de ${who.name}…`);
    window.setTimeout(() => nav.showToast(thread?.callText ?? `${who.name} ne répond pas.`), 1800);
  };
  // Batterie du contact (enquête en temps réel).
  const bat = def.battery?.threadId === threadId ? p?.flags[def.battery.flag] : undefined;
  const battery = typeof bat === 'number' ? bat : undefined;

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
              <div className="sub">
                {battery !== undefined && !isEnded ? (
                  <BatteryLevel level={battery} />
                ) : typing ? (
                  <span className="presence on">écrit…</span>
                ) : online ? (
                  <span className="presence on">En ligne</span>
                ) : (
                  (presenceLabel ?? who.role ?? status)
                )}
              </div>
            </span>
          </span>
        }
        right={
          <span className="navbar-actions">
            <button className="icon-btn" aria-label={`Appeler ${who.name}`} onClick={call}>
              <Icon.Call size={21} />
            </button>
            <button className="icon-btn" aria-label="Ouvrir le dossier de l’affaire" onClick={() => nav.open('files', { caseId: def.id })}>
              <Icon.Info size={22} />
            </button>
          </span>
        }
      />
      <div className="scroll" aria-live="polite">
        <div className="bubbles">
          {thread?.stamp && <div className="stamp">{thread.stamp}</div>}
          {entries.map((e, i) => {
            const m = resolveEntry(def, e.messageId);
            if (!m) return null;
            if (m.system) return <div key={e.messageId} className="stamp" role="status">{m.text}</div>;
            const mine = m.from === 'player';
            // Groupe : nom de l'auteur quand il change.
            const prev = i > 0 ? resolveEntry(def, entries[i - 1].messageId) : undefined;
            const author = thread?.members && !mine && (prev?.from !== m.from || prev?.system) ? character(def, m.from) : undefined;
            return (
              <div key={e.messageId} style={{ display: 'contents' }}>
                {author && (
                  <div className="bubble-sender" style={{ color: author.color }}>
                    {author.name}
                  </div>
                )}
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
                      {thumb && <img src={thumb} alt="" />}
                      <span className="bubble-file">
                        <KindIcon kind={r.def.kind} />
                        <span className="bubble-file-info">
                          <span className="bubble-file-name">{r.def.name}</span>
                          <span className="bubble-file-meta">{[r.def.durationLabel, r.def.sizeLabel].filter(Boolean).join(' · ') || KIND[r.def.kind]}</span>
                        </span>
                        <span className="bubble-time">{time(e, mine, m.time)}</span>
                      </span>
                    </button>
                  );
                })}
                {m.text && (
                  <div className={`bubble${mine ? ' me' : ''}`} aria-label={thread?.members && !mine ? `${character(def, m.from).name} : ${m.text}` : undefined}>
                    {m.text}
                    <span className="bubble-time" aria-hidden="true">
                      {time(e, mine, m.time)}
                      {mine && <Ticks read={i < lastTheirsIndex} />}
                    </span>
                  </div>
                )}
                {mine && i === lastMineIndex && (
                  <div className="receipt" role="status">
                    {i < lastTheirsIndex || typing ? 'Lu' : isOnline && !isEnded ? 'Distribué' : 'Non distribué'}
                  </div>
                )}
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

/** Niveau de batterie d'un contact, dans l'en-tête du fil. */
function BatteryLevel({ level }: { level: number }) {
  const low = level <= 5;
  return (
    <span className={`battery-level${low ? ' low' : ''}`} role="status" aria-label={`Batterie de son téléphone : ${level} %`}>
      <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden="true">
        <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="19.5" y="3.5" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.6" />
        <rect x="2" y="2" width={Math.max(1, (15 * Math.min(100, level)) / 100)} height="7" rx="1.2" fill="currentColor" />
      </svg>
      {level} %
    </span>
  );
}

const KIND: Record<string, string> = { image: 'Image', video: 'Vidéo', audio: 'Audio', document: 'Document' };

/** Heure affichée d'un message : heure écrite dans l'histoire, heure figée du fil (fantôme), sinon heure de réception. */
function entryTime(
  _def: CaseDefinition,
  thread: CaseDefinition['threads'][number] | undefined,
  e: ThreadEntry,
  mine: boolean,
  fixed: string | undefined,
  settings: Parameters<typeof manualDate>[0] & { clockAuto: boolean },
): string {
  if (fixed) return fixed;
  if (thread?.frozenTime && !mine) return thread.frozenTime;
  const d = settings.clockAuto ? new Date(e.at) : manualDate(settings);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Coches d'envoi : une (envoyé), deux (lu). */
function Ticks({ read }: { read: boolean }) {
  return (
    <svg className={`ticks${read ? ' read' : ''}`} width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
      <path d="M1 5.5l3 3L10 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {read && <path d="M6.5 8.2l.3.3L13.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
