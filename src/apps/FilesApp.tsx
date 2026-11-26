import { useEffect, useState } from 'react';
import { HintList } from '../components/Hints';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { currentObstacle, evaluate, resolution } from '../game/engine';
import { caseStatusLabel, character, resolveMedia, thumbOf } from '../game/selectors';
import { TUTORIAL_END, TUTORIAL_FOLDER_TITLE, TUTORIAL_MEDIA, TUTORIAL_OBSERVATION } from '../content/tutorial';
import { Empty, KindIcon, NavBar, formatDate } from '../components/ui';
import { Icon } from '../components/icons';
import { ReportCard } from './ReportCard';
import type { CaseDefinition } from '../game/types';


export function FilesApp() {
  const { state, cases } = useGame();
  const nav = useNav();
  const [open, setOpen] = useState<string | null>(null);
  useIntent('files', (i) => i.caseId && setOpen(i.caseId));

  const t = state.tutorial;
  const showTutorial = t.filed && t.status !== 'completed';
  const accepted = cases.list.filter((d) => ['active', 'solved'].includes(state.cases[d.id]?.status ?? ''));
  accepted.sort((a, b) => (state.cases[a.id].status === 'active' ? -1 : 0) - (state.cases[b.id].status === 'active' ? -1 : 0));

  useEffect(() => {
    nav.setScreen('files', open ?? 'list');
  }, [open, nav]);

  if (open === 'tutorial' && showTutorial) return <TutorialFolder onBack={() => setOpen(null)} />;
  const def = open ? cases.byId.get(open) : undefined;
  if (def && accepted.includes(def)) return <CaseFile def={def} onBack={() => setOpen(null)} />;

  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Dossiers</h1>
        {accepted.length === 0 && !showTutorial && <Empty>Aucun dossier ouvert. Une demande vous attend peut-être dans Mail.</Empty>}
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
              <Gauge value={resolution(d, state)} compact />
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
  const { state, dispatch, cases } = useGame();
  const [confirmReplay, setConfirmReplay] = useState(false);
  const busy = state.activeCaseId && state.activeCaseId !== def.id && state.cases[state.activeCaseId]?.status === 'active' ? cases.byId.get(state.activeCaseId) : undefined;
  const nav = useNav();
  const p = state.cases[def.id];
  const step = def.steps.find((s) => s.id === p.stepId);
  // L'aide suit le premier obstacle non résolu (ou, à défaut, l'étape en cours).
  const obstacle = currentObstacle(def, state);
  const help = obstacle ?? (step?.hints ? { id: step.id, hints: step.hints } : undefined);
  const observations = def.observations.filter((o) => p.filedObservations.includes(o.id));
  const media = p.grantedMedia.map((id) => resolveMedia(def, state, id)).filter((r): r is NonNullable<typeof r> => !!r);
  const copies = state.copies.filter((c) => c.caseId === def.id);
  const client = character(def, def.client);
  const conclusion = def.endings?.find((e) => evaluate(e.when, state, def.id)) ?? def.conclusion;
  // Fiche en trois onglets : l'enquête (objectif, rapport, aide), les indices relevés, le journal.
  const [tab, setTab] = useState<'enquete' | 'indices' | 'journal'>('enquete');

  return (
    <>
      <NavBar back="Dossiers" onBack={onBack} title={def.title} />
      <div className="scroll">
        {/* En-tête façon dossier d'enquêteur : onglet, fiche, tampon. */}
        <div style={{ marginTop: 6 }}>
          <span className="case-tab">Dossier</span>
          <div className="case-sheet">
            <span className={`case-stamp${p.status === 'solved' ? '' : ' open'}`}>{caseStatusLabel[p.status]}</span>
            <div className="row-sub">Client</div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{client.name}</div>
            {def.about && <div className="row-sub" style={{ marginTop: 6 }}>{def.about.duration} · {def.about.tone}</div>}
            <Gauge value={resolution(def, state)} />
          </div>
        </div>

        <div className="seg case-tabs" role="tablist" aria-label="Sections du dossier">
          {(
            [
              ['enquete', 'Enquête'],
              ['indices', `Indices${observations.length ? ` (${observations.length})` : ''}`],
              ['journal', 'Journal'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'enquete' && p.status === 'active' && step && (
          <div className="objective">
            <small>Objectif actuel</small>
            <p>{step.objective}</p>
          </div>
        )}

        {tab === 'enquete' && def.report && (p.flags.rapport === 'pret' || p.flags.rapport === 'ok') && <ReportCard def={def} />}

        {tab === 'enquete' && p.status === 'solved' && (
          <>
            <h2 className="section-title">Conclusion</h2>
            <div className="end-card" style={{ marginTop: 0 }}>
              <h3 style={{ margin: '0 0 8px' }}>{conclusion.title}</h3>
              {conclusion.text.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
            {/* Rejouer l'affaire, par exemple pour une autre fin. Les autres affaires ne bougent pas. */}
            <div style={{ marginTop: 12 }}>
              {busy ? (
                <div className="callout neutral">Pour rejouer cette affaire, terminez d’abord « {busy.title} ».</div>
              ) : confirmReplay ? (
                <div className="callout neutral" style={{ display: 'block' }}>
                  <p style={{ margin: '0 0 10px' }}>Tout ce qui concerne cette affaire repartira de zéro : messages, observations, copies. Les autres affaires sont conservées.</p>
                  <div className="stack">
                    <button className="btn btn-primary btn-block" onClick={() => { dispatch({ type: 'case/replay', caseId: def.id }); setConfirmReplay(false); nav.showToast('Enquête relancée'); }}>
                      Rejouer depuis le début
                    </button>
                    <button className="btn btn-ghost btn-block" onClick={() => setConfirmReplay(false)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-secondary btn-block" onClick={() => setConfirmReplay(true)}>
                  <Icon.Reset size={18} /> Rejouer l’enquête
                </button>
              )}
            </div>
          </>
        )}

        {tab === 'indices' && (
          <>
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
            <h2 className="section-title clip-title">Pièces conservées</h2>
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

          </>
        )}

        {tab === 'enquete' && p.status === 'active' && help && (
          <>
            <h2 className="section-title">Aide</h2>
            <HintList def={def} />
          </>
        )}

        {tab === 'journal' && p.log.length === 0 && <div className="note-box" style={{ marginTop: 18 }}>Rien pour l’instant.</div>}
        {tab === 'journal' && p.log.length > 0 && (
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

        {tab === 'enquete' && (
          <>
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
          </>
        )}
      </div>
    </>
  );
}

/** Jauge d'avancement de l'affaire. */
export function Gauge({ value, compact }: { value: number; compact?: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div className={`gauge${compact ? ' compact' : ''}${pct === 100 ? ' done' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Résolution : ${pct} %`}>
      {!compact && <span className="gauge-label">Résolution</span>}
      <span className="gauge-track">
        <span className="gauge-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="gauge-pct">{pct} %</span>
    </div>
  );
}
