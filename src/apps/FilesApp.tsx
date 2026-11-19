import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { currentObstacle } from '../game/engine';
import { caseStatusLabel, character, resolveMedia, thumbOf } from '../game/selectors';
import { TUTORIAL_END, TUTORIAL_FOLDER_TITLE, TUTORIAL_MEDIA, TUTORIAL_OBSERVATION } from '../content/tutorial';
import { Empty, KindIcon, NavBar, formatDate } from '../components/ui';
import { Icon } from '../components/icons';
import type { CaseDefinition } from '../game/types';

const HINT_LABELS = ['Rappel', 'Piste', 'Solution'];

export function FilesApp() {
  const { state, cases } = useGame();
  const nav = useNav();
  const [open, setOpen] = useState<string | null>(null);
  useIntent('files', (i) => i.caseId && setOpen(i.caseId));

  const t = state.tutorial;
  const showTutorial = t.filed && t.status !== 'completed';
  const accepted = cases.list.filter((d) => ['active', 'solved'].includes(state.cases[d.id]?.status ?? ''));
  accepted.sort((a, b) => (state.cases[a.id].status === 'active' ? -1 : 0) - (state.cases[b.id].status === 'active' ? -1 : 0));

  useEffect(() => nav.setScreen('files', open ?? 'list'), [open, nav]);

  if (open === 'tutorial' && showTutorial) return <TutorialFolder onBack={() => setOpen(null)} />;
  const def = open ? cases.byId.get(open) : undefined;
  if (def && accepted.includes(def)) return <CaseFile def={def} onBack={() => setOpen(null)} />;

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Dossiers</h1>
        {accepted.length === 0 && !showTutorial && <Empty icon={<Icon.Folder size={40} />}>Vos enquêtes acceptées seront regroupées ici.</Empty>}
        {accepted.map((d) => {
          const p = state.cases[d.id];
          const step = d.steps.find((s) => s.id === p.stepId);
          return (
            <button key={d.id} className="case-card" onClick={() => setOpen(d.id)}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3>{d.title}</h3>
                <span className={`tag${p.status === 'solved' ? ' ok' : ''}`}>{caseStatusLabel[p.status]}</span>
              </span>
              <div className="row-sub">{character(d, d.client).name}</div>
              {p.status === 'active' && step && <div style={{ fontSize: 15 }}>{step.objective}</div>}
            </button>
          );
        })}
        {showTutorial && (
          <>
            <h2 className="section-title">Exercice</h2>
            <button className="case-card" onClick={() => setOpen('tutorial')}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3>{TUTORIAL_FOLDER_TITLE}</h3>
                <span className="tag neutral">Exemple</span>
              </span>
              <div className="row-sub">1 observation</div>
            </button>
          </>
        )}
      </div>
    </>
  );
}

function TutorialFolder({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useGame();
  const nav = useNav();
  useEffect(() => {
    dispatch({ type: 'tutorial/step', step: 'finish' });
  }, [dispatch]);
  return (
    <>
      <NavBar back="Dossiers" onBack={onBack} title={TUTORIAL_FOLDER_TITLE} />
      <div className="scroll">
        <div className="callout neutral" style={{ marginTop: 8 }}>
          <Icon.Info size={18} />
          <span>Dossier d’exemple, séparé de vos futures enquêtes.</span>
        </div>
        <h2 className="section-title">Observations</h2>
        <div className="group">
          <button className="row" onClick={() => nav.openViewer({ kind: 'tutorial' })}>
            <span className="obs-chip" style={{ border: 0, margin: 0, padding: 0, width: 'auto' }}>
              <span className="thumb">
                <img src={TUTORIAL_MEDIA.variants.default.src} alt="" />
              </span>
            </span>
            <span className="row-main">
              <div className="row-title">{TUTORIAL_OBSERVATION.title}</div>
              <div className="row-sub">bureau.jpg</div>
            </span>
            <Icon.Chevron className="chev" size={18} />
          </button>
        </div>
        {state.tutorial.status === 'active' && (
          <div className="end-card">
            <p>{TUTORIAL_END}</p>
            <p className="row-sub">Pour revenir à l’accueil à tout moment, touchez la barre en bas de l’écran.</p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                dispatch({ type: 'tutorial/complete' });
                nav.showToast('Exercice terminé');
                onBack();
                nav.home();
              }}
            >
              Terminer l’exercice
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CaseFile({ def, onBack }: { def: CaseDefinition; onBack: () => void }) {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const p = state.cases[def.id];
  const step = def.steps.find((s) => s.id === p.stepId);
  // L'aide suit le premier obstacle non résolu (ou, à défaut, l'étape en cours).
  const obstacle = currentObstacle(def, state);
  const help = obstacle ?? (step?.hints ? { id: step.id, hints: step.hints } : undefined);
  const revealed = help ? (p.hintsRevealed[help.id] ?? 0) : 0;
  const observations = def.observations.filter((o) => p.filedObservations.includes(o.id));
  const media = p.grantedMedia.map((id) => resolveMedia(def, state, id)).filter((r): r is NonNullable<typeof r> => !!r);
  const copies = state.copies.filter((c) => c.caseId === def.id);
  const client = character(def, def.client);

  return (
    <>
      <NavBar back="Dossiers" onBack={onBack} title={def.title} />
      <div className="scroll">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 14px' }}>
          <div style={{ flex: 1 }}>
            <div className="row-sub">Client</div>
            <div style={{ fontWeight: 600 }}>{client.name}</div>
          </div>
          <span className={`tag${p.status === 'solved' ? ' ok' : ''}`}>{caseStatusLabel[p.status]}</span>
        </div>

        {p.status === 'active' && step && (
          <div className="objective">
            <small>Objectif actuel</small>
            <p>{step.objective}</p>
          </div>
        )}

        {p.status === 'solved' && (
          <>
            <h2 className="section-title">Conclusion</h2>
            <div className="end-card" style={{ marginTop: 0 }}>
              <h3 style={{ margin: '0 0 8px' }}>{def.conclusion.title}</h3>
              {def.conclusion.text.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </>
        )}

        <h2 className="section-title">Observations</h2>
        {observations.length === 0 ? (
          <div className="note-box">Aucune observation pour l’instant. Examinez les pièces jointes et touchez les détails qui vous intriguent.</div>
        ) : (
          <div className="group">
            {observations.map((o) => {
              const r = o.mediaId ? resolveMedia(def, state, o.mediaId) : undefined;
              const thumb = r && thumbOf(r.variant, r.def.kind);
              return (
                <button key={o.id} className="row" onClick={() => o.mediaId && nav.openViewer({ kind: 'case', caseId: def.id, mediaId: o.mediaId })}>
                  {thumb && (
                    <span className="obs-chip" style={{ border: 0, margin: 0, padding: 0, width: 'auto' }}>
                      <span className="thumb">
                        <img src={thumb} alt="" />
                      </span>
                    </span>
                  )}
                  <span className="row-main">
                    <div className="row-title">{o.title}</div>
                    {o.description && <div className="row-sub">{o.description}</div>}
                  </span>
                  {o.mediaId && <Icon.Chevron className="chev" size={18} />}
                </button>
              );
            })}
          </div>
        )}

        {(media.length > 0 || copies.length > 0) && (
          <>
            <h2 className="section-title">Pièces conservées</h2>
            <div className="group">
              {media.map((r) => (
                <button key={r.def.id} className="row" onClick={() => nav.openViewer({ kind: 'case', caseId: def.id, mediaId: r.def.id })}>
                  <KindIcon kind={r.def.kind} />
                  <span className="row-main">
                    <div className="row-title">{r.def.name}</div>
                    {r.def.sizeLabel && <div className="row-sub">{r.def.sizeLabel}</div>}
                  </span>
                  <Icon.Chevron className="chev" size={18} />
                </button>
              ))}
              {copies.map((c) => (
                <button key={c.id} className="row" onClick={() => nav.openViewer({ kind: 'copy', copyId: c.id })}>
                  <Icon.Save size={20} />
                  <span className="row-main">
                    <div className="row-title">Copie de {c.name}</div>
                    <div className="row-sub">Enregistrée le {formatDate(c.savedAt)}</div>
                  </span>
                  <Icon.Chevron className="chev" size={18} />
                </button>
              ))}
            </div>
          </>
        )}

        {p.status === 'active' && help && (
          <>
            <h2 className="section-title">Aide</h2>
            <div className="group">
              {help.hints.slice(0, revealed).map((h, i) => (
                <div key={i} className="hint">
                  <div className="hint-level">
                    {i + 1}. {HINT_LABELS[i]}
                  </div>
                  <p>{h}</p>
                </div>
              ))}
              {revealed < 3 && (
                <button className="row" onClick={() => dispatch({ type: 'hint/reveal', caseId: def.id, stepId: help.id })}>
                  <span className="row-ico">
                    <Icon.Bulb size={22} />
                  </span>
                  <span className="row-main">
                    <div className="row-title">{revealed === 0 ? 'Demander un indice' : revealed === 1 ? 'Indice suivant' : 'Afficher la solution'}</div>
                    <div className="row-sub">Niveau {revealed + 1} sur 3</div>
                  </span>
                </button>
              )}
            </div>
          </>
        )}

        {p.log.length > 0 && (
          <>
            <h2 className="section-title">Historique</h2>
            <ul className="list group log">
              {[...p.log].reverse().map((l, i) => (
                <li key={i}>
                  <span style={{ color: 'var(--text-3)' }}>{formatDate(l.at)}</span> — {l.text}
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="section-title">Échanges</h2>
        <div className="group">
          {/* Seules les conversations déjà commencées : un contact à venir ne doit pas être dévoilé. */}
          {def.threads.filter((t) => (p.threads[t.id]?.length ?? 0) > 0).map((t) => (
            <button key={t.id} className="row" onClick={() => nav.open('messages', { caseId: def.id, threadId: t.id })}>
              <Icon.Message size={20} />
              <span className="row-main">
                <div className="row-title">{character(def, t.contact).name}</div>
              </span>
              <Icon.Chevron className="chev" size={18} />
            </button>
          ))}
          <button className="row" onClick={() => nav.open('mail', { mailId: def.initialMail.id })}>
            <Icon.Compose size={20} />
            <span className="row-main">
              <div className="row-title">E-mail initial</div>
              <div className="row-sub">{def.initialMail.subject}</div>
            </span>
            <Icon.Chevron className="chev" size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
