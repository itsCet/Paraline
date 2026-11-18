import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { Empty, NavBar, formatDate } from '../components/ui';
import { Icon } from '../components/icons';
import type { Note } from '../game/types';

let seq = 0;
const newId = () => `note-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function NotesApp() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const [openId, setOpenId] = useState<string | null>(null);
  const note = state.notes.find((n) => n.id === openId);

  const create = () => {
    const now = Date.now();
    const n: Note = { id: newId(), title: '', body: '', createdAt: now, updatedAt: now, caseId: state.activeCaseId ?? undefined };
    dispatch({ type: 'note/upsert', note: n });
    setOpenId(n.id);
  };

  const remove = (n: Note) => {
    dispatch({ type: 'note/delete', id: n.id });
    setOpenId(null);
    nav.showToast('Note supprimée', { label: 'Annuler', run: () => dispatch({ type: 'note/upsert', note: n }) });
  };

  if (note) return <NoteEditor note={note} onBack={() => setOpenId(null)} onDelete={() => remove(note)} />;

  return (
    <>
      <NavBar
        right={
          <button className="icon-btn" onClick={create} aria-label="Nouvelle note">
            <Icon.Compose size={24} />
          </button>
        }
      />
      <div className="scroll">
        <h1 className="large-title">Notes</h1>
        {state.notes.length === 0 ? (
          <Empty icon={<Icon.Compose size={40} />}>
            Aucune note. Votre carnet est libre : rien de ce que vous écrivez n’est interprété comme une réponse.
            <br />
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={create}>
              Nouvelle note
            </button>
          </Empty>
        ) : (
          <div className="group">
            {[...state.notes]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((n) => (
                <NoteRow key={n.id} note={n} onOpen={() => setOpenId(n.id)} />
              ))}
          </div>
        )}
      </div>
    </>
  );
}

function NoteRow({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const { cases } = useGame();
  const c = note.caseId ? cases.byId.get(note.caseId) : undefined;
  const firstLine = note.body.split('\n').find((l) => l.trim()) ?? '';
  return (
    <button className="row" onClick={onOpen}>
      <span className="row-main">
        <div className="row-title" style={{ fontWeight: 600 }}>{note.title.trim() || firstLine || 'Nouvelle note'}</div>
        <div className="row-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {formatDate(note.updatedAt)}
          {c ? ` · ${c.title}` : ''}
          {note.title.trim() && firstLine ? ` · ${firstLine}` : ''}
        </div>
      </span>
      <Icon.Chevron className="chev" size={18} />
    </button>
  );
}

function NoteEditor({ note, onBack, onDelete }: { note: Note; onBack: () => void; onDelete: () => void }) {
  const { state, dispatch, cases } = useGame();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const latest = useRef({ title, body });
  latest.current = { title, body };

  // Sauvegarde automatique (courte temporisation pendant la frappe).
  useEffect(() => {
    if (title === note.title && body === note.body) return;
    const t = window.setTimeout(() => dispatch({ type: 'note/upsert', note: { ...note, title, body, updatedAt: Date.now() } }), 300);
    return () => window.clearTimeout(t);
  }, [title, body, note, dispatch]);

  const leave = () => {
    const { title: tt, body: bb } = latest.current;
    if (!tt.trim() && !bb.trim()) dispatch({ type: 'note/delete', id: note.id });
    else if (tt !== note.title || bb !== note.body) dispatch({ type: 'note/upsert', note: { ...note, title: tt, body: bb, updatedAt: Date.now() } });
    onBack();
  };

  const linkable = cases.list.filter((d) => ['active', 'solved'].includes(state.cases[d.id]?.status ?? ''));

  return (
    <>
      <NavBar
        back="Notes"
        onBack={leave}
        right={
          <button className="icon-btn" onClick={onDelete} aria-label="Supprimer la note">
            <Icon.Trash size={22} />
          </button>
        }
      />
      <div className="note-editor">
        <div className="note-meta">
          <span>Enregistrée automatiquement</span>
          {linkable.length > 0 && (
            <label>
              <span className="sr-only">Affaire liée</span>
              <select
                className="select"
                value={note.caseId ?? ''}
                onChange={(e) => dispatch({ type: 'note/upsert', note: { ...note, title, body, caseId: e.target.value || undefined, updatedAt: Date.now() } })}
              >
                <option value="">Aucune affaire</option>
                {linkable.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" aria-label="Titre de la note" enterKeyHint="next" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrivez vos observations…" aria-label="Contenu de la note" autoFocus={!note.title && !note.body} />
      </div>
    </>
  );
}
