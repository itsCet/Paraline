import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { character, inbox, resolveMedia, type InboxItem } from '../game/selectors';
import { TUTORIAL_MEDIA } from '../content/tutorial';
import { AttachmentCard, Avatar, Empty, NavBar } from '../components/ui';
import { Icon } from '../components/icons';

type Filter = 'all' | 'review' | 'active';

export function MailApp() {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const items = inbox(state, cases);
  const visible = nav.app === 'mail';

  useIntent('mail', (i) => i.mailId && setOpenId(i.mailId));
  useEffect(() => {
    if (visible) dispatch({ type: 'tutorial/step', step: 'openMessage' });
  }, [visible, dispatch]);

  const current = items.find((m) => m.id === openId);
  useEffect(() => {
    nav.setScreen('mail', current?.tutorial ? 'tutorial' : current ? 'mail' : 'list');
    if (!current) return;
    dispatch({ type: 'mail/read', mailId: current.id });
    if (current.tutorial) dispatch({ type: 'tutorial/step', step: 'openAttachment' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fr');
    return items.filter((m) => {
      const status = m.caseId ? state.cases[m.caseId]?.status : undefined;
      if (filter === 'review' && !(m.tutorial || (m.initial && (status === 'new' || status === 'postponed')))) return false;
      if (filter === 'active' && status !== 'active') return false;
      if (!q) return true;
      return [m.fromName, m.subject, ...m.body].some((t) => t.toLocaleLowerCase('fr').includes(q));
    });
  }, [items, query, filter, state.cases]);

  if (current) return <MailDetail item={current} onBack={() => setOpenId(null)} />;

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Boîte de réception</h1>
        <label className="search">
          <Icon.Search size={18} />
          <span className="sr-only">Rechercher dans les e-mails</span>
          <input type="search" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} enterKeyHint="search" />
        </label>
        <div className="chips" role="group" aria-label="Filtres">
          {(
            [
              ['all', 'Tous'],
              ['review', 'À examiner'],
              ['active', 'En cours'],
            ] as [Filter, string][]
          ).map(([f, l]) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {l}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <Empty icon={<Icon.Compose size={40} />}>Aucune nouvelle demande pour le moment.</Empty>
        ) : filtered.length === 0 ? (
          <Empty>{query ? 'Aucun résultat.' : 'Aucun message dans ce filtre.'}</Empty>
        ) : (
          <ul className="list" style={{ paddingLeft: 12 }}>
            {filtered.map((m) => (
              <li key={m.id}>
                <MailRow item={m} onOpen={() => setOpenId(m.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function StatusTag({ item }: { item: InboxItem }) {
  const { state } = useGame();
  if (item.tutorial) return <span className="tag neutral">Exemple</span>;
  const st = item.caseId ? state.cases[item.caseId]?.status : undefined;
  if (st === 'active') return <span className="tag">En cours</span>;
  if (st === 'solved') return <span className="tag ok"><Icon.Check size={12} /> Résolu</span>;
  if (st === 'postponed' && item.initial) return <span className="tag neutral">Pour plus tard</span>;
  return null;
}

function MailRow({ item, onOpen }: { item: InboxItem; onOpen: () => void }) {
  return (
    <button className="mail-row" onClick={onOpen} aria-label={`${item.read ? '' : 'Non lu. '}${item.fromName}, ${item.subject}`}>
      {!item.read && <span className="dot" aria-hidden="true" />}
      <Avatar initials={item.initials} color={item.color} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="mail-head">
          <span className="mail-from">{item.fromName}</span>
          <span className="mail-time">{item.timeLabel}</span>
        </span>
        <div className="mail-subject">{item.subject}</div>
        <div className="mail-preview">{item.preview}</div>
        {(item.attachments.length > 0 || item.tutorial || item.caseId) && (
          <span className="mail-meta">
            {item.attachments.length > 0 && (
              <>
                <Icon.Clip size={14} /> {item.attachments.length} pièce{item.attachments.length > 1 ? 's' : ''} jointe{item.attachments.length > 1 ? 's' : ''}
              </>
            )}
            <StatusTag item={item} />
          </span>
        )}
      </span>
    </button>
  );
}

function MailDetail({ item, onBack }: { item: InboxItem; onBack: () => void }) {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const def = item.caseId ? cases.byId.get(item.caseId) : undefined;
  const p = def ? state.cases[def.id] : undefined;
  const busy = state.activeCaseId && def && state.activeCaseId !== def.id ? cases.byId.get(state.activeCaseId) : undefined;

  return (
    <>
      <NavBar back="Réception" onBack={onBack} />
      <div className="scroll">
        <h1 className="mail-subject-lg">{item.subject}</h1>
        <div className="mail-sender">
          <Avatar initials={item.initials} color={item.color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{item.fromName}</div>
            <div className="row-sub">À moi · {item.timeLabel}</div>
          </div>
          <StatusTag item={item} />
        </div>
        {item.tutorial && (
          <div className="callout neutral" style={{ marginTop: 14 }}>
            <Icon.Info size={18} />
            <span>Message d’exemple pour l’exercice de prise en main. Ce n’est pas une enquête.</span>
          </div>
        )}
        <div className="mail-body">
          {item.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {item.attachments.length > 0 && (
          <div className="attachments">
            {item.tutorial ? (
              <AttachmentCard media={TUTORIAL_MEDIA} variant={TUTORIAL_MEDIA.variants.default} onOpen={() => nav.openViewer({ kind: 'tutorial' })} />
            ) : (
              def &&
              item.attachments.map((id) => {
                const r = resolveMedia(def, state, id);
                return r ? (
                  <AttachmentCard key={id} media={r.def} variant={r.variant} onOpen={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: id })} />
                ) : null;
              })
            )}
          </div>
        )}

        {def && p && item.initial && (
          <div className="mail-actions">
            {(p.status === 'new' || p.status === 'postponed') && (
              <>
                {busy && (
                  <div className="callout neutral">
                    Une enquête est déjà en cours (« {busy.title} »). Vous pourrez accepter celle-ci une fois l’autre résolue.
                  </div>
                )}
                {p.status === 'postponed' && !busy && (
                  <div className="callout neutral">Demande gardée pour plus tard. Vous pouvez l’accepter quand vous voulez.</div>
                )}
                <button className="btn btn-primary btn-block" disabled={!!busy} onClick={() => dispatch({ type: 'case/accept', caseId: def.id })}>
                  Accepter l’enquête
                </button>
                {p.status === 'new' && (
                  <button
                    className="btn btn-ghost btn-block"
                    onClick={() => {
                      dispatch({ type: 'case/postpone', caseId: def.id });
                      nav.showToast('Demande gardée pour plus tard');
                      onBack();
                    }}
                  >
                    Garder pour plus tard
                  </button>
                )}
              </>
            )}
            {(p.status === 'active' || p.status === 'solved') && (
              <>
                <div className="callout">
                  <Icon.Folder size={18} />
                  <span>
                    {p.status === 'active'
                      ? `Enquête acceptée. Vos échanges avec ${character(def, def.client).name} se trouvent dans Messages.`
                      : 'Affaire résolue. La conclusion est disponible dans le dossier.'}
                  </span>
                </div>
                <button className="btn btn-secondary btn-block" onClick={() => nav.open('files', { caseId: def.id })}>
                  Ouvrir le dossier
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
