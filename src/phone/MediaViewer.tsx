import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { fillTemplate } from '../game/engine';
import { useNav, type ViewerSource } from './nav';
import { character, resolveMedia } from '../game/selectors';
import { resolveEntry } from '../game/reducer';
import { TUTORIAL_MEDIA, TUTORIAL_OBSERVATION } from '../content/tutorial';
import { ZoomableImage } from '../components/ZoomableImage';
import { Flashlight } from '../components/Flashlight';
import { Panorama } from '../components/Panorama';
import { AudioPlayer, DocView, VideoPlayer } from '../components/Players';
import { NavBar, Sheet } from '../components/ui';
import { Icon } from '../components/icons';
import { playCue } from '../game/sound';
import type { CaseDefinition, Hotspot, MediaDef, MediaVariant, ObservationAction, ObservationDef } from '../game/types';

interface Resolved {
  media: MediaDef;
  variantId: string;
  variant: MediaVariant;
  src: string;
  caseDef?: CaseDefinition;
  isCopy: boolean;
}

/** Clavier de code (fichier protégé). Une erreur vide la saisie et fait trembler les points. */
function CodeLock({ title, prompt, length, tries, onSubmit }: { title: string; prompt: string; length: number; tries: number; onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(0);
  const lastTries = useRef(tries);
  useEffect(() => {
    if (tries > lastTries.current) {
      setShake((x) => x + 1);
      setCode('');
      try {
        navigator.vibrate?.(180);
      } catch {
        /* sans vibreur */
      }
    }
    lastTries.current = tries;
  }, [tries]);
  const press = (d: string) => {
    const next = (code + d).slice(0, length);
    setCode(next);
    if (next.length === length) window.setTimeout(() => onSubmit(next), 120);
  };
  return (
    <div className="codelock">
      <Icon.Lock size={30} />
      <h2>{title}</h2>
      <p>{prompt}</p>
      <div key={shake} className={`codelock-dots${shake ? ' shake' : ''}`} aria-label={`${code.length} chiffre${code.length > 1 ? 's' : ''} sur ${length}`}>
        {Array.from({ length }, (_, i) => (
          <i key={i} className={i < code.length ? 'on' : undefined} />
        ))}
      </div>
      {tries > 0 && <div className="codelock-error" role="status">Code incorrect</div>}
      <div className="codelock-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} aria-label={k === '⌫' ? 'Effacer' : k} onClick={() => (k === '⌫' ? setCode((c) => c.slice(0, -1)) : press(k))}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function MediaViewer() {
  const { viewer } = useNav();
  if (!viewer) return null;
  if (viewer.kind === 'compare') return <CompareView source={viewer} />;
  if (viewer.kind === 'capture') return <CaptureViewer captureId={viewer.captureId} />;
  return <SingleViewer key={JSON.stringify(viewer)} source={viewer} />;
}

/** Capture d'écran : ce qui était affiché, figé (photo, conversation). */
function CaptureViewer({ captureId }: { captureId: string }) {
  const { state, cases } = useGame();
  const nav = useNav();
  const c = (state.captures ?? []).find((x) => x.id === captureId);
  const when = c ? new Date(c.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const def = c && c.kind !== 'app' ? cases.byId.get(c.caseId) : undefined;
  const thread = c?.kind === 'thread' ? def?.threads.find((t) => t.id === c.threadId) : undefined;
  const who = thread && def ? character(def, thread.contact).name : undefined;
  return (
    <div className="viewer" role="dialog" aria-label="Capture d’écran">
      <NavBar back="Retour" onBack={nav.closeViewer} title={`Capture · ${when}`} />
      {!c ? (
        <div className="empty">Cette capture n’existe plus.</div>
      ) : c.kind === 'media' ? (
        <ZoomableImage
          src={c.src}
          alt={`Capture d’écran de ${c.name}`}
          width={def?.media.find((m) => m.id === c.mediaId)?.variants[c.variantId]?.width ?? 1086}
          height={def?.media.find((m) => m.id === c.mediaId)?.variants[c.variantId]?.height ?? 1448}
        />
      ) : c.kind === 'thread' && def ? (
        <div className="scroll capture-thread">
          <div className="capture-head">{who}</div>
          <div className="bubbles">
            {c.entries.map((e) => {
              const m = resolveEntry(def, e.messageId);
              if (!m) return null;
              if (m.system) return <div key={e.messageId} className="stamp">{m.text}</div>;
              return m.text ? (
                <div key={e.messageId} className={`bubble${m.from === 'player' ? ' me' : ''}`}>
                  {m.text}
                </div>
              ) : (
                <div key={e.messageId} className={`bubble${m.from === 'player' ? ' me' : ''}`}>
                  <i>Pièce jointe</i>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty">{c.kind === 'app' ? c.label : ''}</div>
      )}
    </div>
  );
}

function SingleViewer({ source }: { source: Exclude<ViewerSource, { kind: 'compare' } | { kind: 'capture' }> }) {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const [sheet, setSheet] = useState<string | null>(null);
  const [needAccept, setNeedAccept] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [focus, setFocus] = useState(source.kind === 'case' ? source.focus : undefined);

  // Résolution de la source.
  let r: Resolved | null = null;
  if (source.kind === 'tutorial') {
    const v = TUTORIAL_MEDIA.variants.default;
    r = { media: TUTORIAL_MEDIA, variantId: 'default', variant: v, src: v.src, isCopy: false };
  } else if (source.kind === 'case') {
    const def = cases.byId.get(source.caseId);
    const res = def && resolveMedia(def, state, source.mediaId);
    if (def && res) r = { media: res.def, variantId: res.variantId, variant: res.variant, src: res.variant.src, caseDef: def, isCopy: false };
  } else {
    const copy = state.copies.find((c) => c.id === source.copyId);
    const def = copy && cases.byId.get(copy.caseId);
    const m = def?.media.find((x) => x.id === copy!.mediaId);
    if (copy && m) {
      const v = m.variants[copy.variantId] ?? m.variants[m.defaultVariant];
      r = { media: m, variantId: copy.variantId, variant: { ...v, src: copy.src }, src: copy.src, caseDef: def, isCopy: true };
    } else if (copy) {
      // Enquête retirée du contenu : on affiche quand même la copie figée.
      r = {
        media: { id: copy.mediaId, kind: 'image', name: copy.name, defaultVariant: 'copy', variants: {} },
        variantId: copy.variantId,
        variant: { src: copy.src },
        src: copy.src,
        isCopy: true,
      };
    }
  }

  const caseId = r?.caseDef?.id;
  const progress = caseId ? state.cases[caseId] : undefined;
  const accepted = progress?.status === 'active' || progress?.status === 'solved';
  const mediaId = r?.media.id;

  // Fichier protégé par un code : rien n'est « vu » tant qu'il n'est pas ouvert.
  const locked = !!(r?.media.lock && caseId && !r.isCopy && progress?.flags[`verrou:${r.media.id}`] !== true);

  useEffect(() => {
    if (source.kind === 'tutorial') dispatch({ type: 'tutorial/step', step: 'findDetail' });
    else if (caseId && mediaId && !r?.isCopy && !locked) dispatch({ type: 'media/view', caseId, mediaId });
  }, [source.kind, caseId, mediaId, dispatch, r?.isCopy, locked]);

  if (r && locked && caseId) {
    return (
      <div className="viewer" role="dialog" aria-label={`${r.media.name}, protégé`}>
        <NavBar back="Retour" onBack={nav.closeViewer} title={r.media.name} />
        <CodeLock
          title={r.media.lock!.title}
          prompt={r.media.lock!.prompt}
          length={r.media.lock!.code.length}
          tries={Number(progress?.flags[`verrou:${r.media.id}:essais`] ?? 0)}
          onSubmit={(code) => dispatch({ type: 'media/unlock', caseId, mediaId: r!.media.id, code })}
        />
      </div>
    );
  }

  if (!r) {
    return (
      <div className="viewer" role="dialog" aria-label="Fichier introuvable">
        <NavBar back="Retour" onBack={nav.closeViewer} />
        <div className="empty">Ce fichier n’est plus disponible.</div>
      </div>
    );
  }

  const hotspots = (r.variant.hotspots ?? []).filter((h) => !h.variants || h.variants.includes(r!.variantId));
  const isTutorial = source.kind === 'tutorial';
  const foundIds = isTutorial ? (state.tutorial.found ? [TUTORIAL_OBSERVATION.id] : []) : (progress?.foundObservations ?? []);

  const onHotspot = (h: Hotspot) => {
    if (isTutorial) dispatch({ type: 'tutorial/found' });
    else if (caseId) dispatch({ type: 'observation/found', caseId, observationId: h.observationId });
    playCue('found', state.settings);
    setSheet(h.observationId);
  };

  const observationsHere: { id: string; title: string }[] = isTutorial
    ? state.tutorial.found
      ? [{ id: TUTORIAL_OBSERVATION.id, title: TUTORIAL_OBSERVATION.title }]
      : []
    : (r.caseDef?.observations ?? []).filter((o) => hotspots.some((h) => h.observationId === o.id) && foundIds.includes(o.id));

  // Copie et comparaison.
  const canCopy = !!r.caseDef && r.media.allowSaveCopy && !r.isCopy && r.media.kind === 'image';
  const hasCopy = state.copies.some((c) => c.caseId === caseId && c.mediaId === r!.media.id && c.variantId === r!.variantId);
  const otherCopy = state.copies.find((c) => c.caseId === caseId && c.mediaId === r!.media.id && c.variantId !== r!.variantId);
  const compareTarget = r.caseDef && r.media.compareWith ? resolveMedia(r.caseDef, state, r.media.compareWith) : undefined;
  const currentResolved = r.caseDef ? resolveMedia(r.caseDef, state, r.media.id) : undefined;
  const currentSrc = currentResolved?.variant.src;
  const currentOverlay = currentResolved?.variant.overlay;
  // Copie ↔ version actuelle, ou média ↔ média désigné par le contenu.
  const comparison =
    r.isCopy && currentResolved && currentResolved.variantId !== r.variantId
      ? { left: { label: 'Copie conservée', src: r.src, overlay: r.variant.overlay }, right: { label: 'Version actuelle', src: currentSrc ?? r.src, overlay: currentOverlay } }
      : !r.isCopy && otherCopy
        ? { left: { label: 'Copie conservée', src: otherCopy.src, overlay: r.media.variants[otherCopy.variantId]?.overlay }, right: { label: 'Version actuelle', src: r.src, overlay: r.variant.overlay } }
        : compareTarget
          ? { left: { label: r.media.name, src: r.src }, right: { label: compareTarget.def.name, src: compareTarget.variant.src } }
          : undefined;

  /** Relève un passage de document ou une ligne de transcription ; propose la question associée, comme une zone de photo. */
  const relever = (id: string, label: string) => {
    if (!caseId || foundIds.includes(id)) return;
    dispatch({ type: 'observation/found', caseId, observationId: id });
    const ask = r!.caseDef?.observations.find((o) => o.id === id)?.actions.find((a) => a.type === 'ask');
    const reply = ask && ask.type === 'ask' ? r!.caseDef!.replies.find((x) => x.id === ask.replyId) : undefined;
    const thread = reply && r!.caseDef!.threads.find((t) => t.id === reply.threadId);
    if (reply && thread && ask && ask.type === 'ask') {
      const who = character(r!.caseDef!, thread.contact).name.split(' ')[0];
      nav.showToast(label, { label: ask.label ?? `Questionner ${who}`, run: () => nav.open('messages', { caseId, threadId: reply.threadId }) });
    } else nav.showToast(`${label} dans le dossier`);
  };

  const saveCopy = () => {
    if (!caseId) return;
    dispatch({ type: 'copy/save', caseId, mediaId: r!.media.id, variantId: r!.variantId, src: r!.src, name: r!.media.name });
    nav.showToast('Copie conservée dans Photos');
  };

  const W = r.variant.width ?? 4;
  const H = r.variant.height ?? 3;

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={r.media.name}>
      <NavBar
        back="Retour"
        onBack={nav.closeViewer}
        title={isTutorial ? 'Le bureau' : r.isCopy ? `${r.media.name} (copie)` : r.media.name}
        right={
          r.variant.info?.length ? (
            <button className="icon-btn" aria-label="Infos du fichier" onClick={() => setInfoOpen(true)}>
              <Icon.Info size={24} />
            </button>
          ) : undefined
        }
      />
      {r.media.kind === 'image' && r.variant.panorama && (
        <div className="viewer-stage">
          <Panorama
            src={r.src}
            alt={r.variant.alt ?? r.media.name}
            hotspots={hotspots}
            found={foundIds}
            onHotspot={onHotspot}
            startYaw={r.variant.panorama.startYaw}
            exits={(r.variant.panorama.exits ?? []).map((x) => ({
              ...x,
              onGo: () => caseId && nav.openViewer({ kind: 'case', caseId, mediaId: x.to }),
            }))}
          />
        </div>
      )}
      {r.media.kind === 'image' && !r.variant.panorama && r.variant.flashlight && (
        <div className="viewer-stage">
          <Flashlight
            src={r.src}
            alt={r.variant.alt ?? r.media.name}
            width={W}
            height={H}
            radius={r.variant.flashlight.radius}
            reveal={r.variant.flashlight.reveal}
            hotspots={hotspots}
            found={foundIds}
            onHotspot={onHotspot}
            calm={state.settings.reduceFlashes}
          />
        </div>
      )}
      {r.media.kind === 'image' && !r.variant.panorama && !r.variant.flashlight && (
        <div className="viewer-stage">
          <ZoomableImage
            src={r.src}
            alt={r.variant.alt ?? r.media.name}
            width={W}
            height={H}
            hotspots={hotspots}
            found={foundIds}
            onHotspot={onHotspot}
            focus={focus}
            maxZoom={r.variant.maxZoom}
            overlay={r.variant.overlay}
            calm={state.settings.reduceFlashes}
          />
        </div>
      )}
      {r.media.kind === 'video' && (
        <VideoPlayer variant={r.variant} name={r.media.name} volume={state.settings.volume} muted={!state.settings.sound} hotspots={hotspots} onHotspot={onHotspot} />
      )}
      {r.media.kind === 'audio' && (
        <AudioPlayer
          variant={r.variant}
          name={r.media.name}
          volume={state.settings.volume}
          muted={!state.settings.sound}
          found={foundIds}
          onCue={(id) => relever(id, 'Ligne relevée')}
        />
      )}
      {r.media.kind === 'document' && (
        <DocView
          variant={r.variant}
          name={r.media.name}
          found={foundIds}
          onPassage={(id) => {
            relever(id, 'Passage relevé');
          }}
        />
      )}

      {(hotspots.length > 0 || canCopy || comparison) && (
        <section className="viewer-panel" aria-label="Examen">
          {hotspots.length > 0 && (
            <div className={observationsHere.length ? 'panel-card' : undefined}>
              {isTutorial ? (
                <p className="viewer-hint">Touchez le tiroir entrouvert pour relever une observation.</p>
              ) : (
                (() => {
                  const left = new Set(hotspots.map((h) => h.observationId).filter((id) => !foundIds.includes(id))).size;
                  return left === 0 ? (
                    <h3>Vous avez tout relevé sur cette photo.</h3>
                  ) : (
                    <>
                      <h3>Un détail vous intrigue ?</h3>
                      <p>Touchez l’image · {left === 1 ? '1 détail' : `${left} détails`} à relever</p>
                      {r.media.kind === 'image' && !r.variant.panorama && !r.variant.flashlight && (
                        <p className="viewer-heat">Plus l’onde est chaude, plus vous êtes près.</p>
                      )}
                    </>
                  );
                })()
              )}
              {observationsHere.map((o) => (
                <button key={o.id} className="obs-chip" onClick={() => setSheet(o.id)}>
                  <span className="thumb">
                    <img src={r!.variant.poster ?? r!.src} alt="" />
                  </span>
                  <span style={{ flex: 1 }}>{o.title}</span>
                  <Icon.Chevron size={18} />
                </button>
              ))}
            </div>
          )}
          {(canCopy || comparison) && (
            <div className="viewer-actions">
              {canCopy && (
                <button className="btn btn-secondary btn-sm" onClick={saveCopy} disabled={hasCopy}>
                  {hasCopy ? <Icon.Check size={18} /> : <Icon.Save size={18} />}
                  {hasCopy ? 'Copie conservée' : 'Conserver une copie'}
                </button>
              )}
              {comparison && caseId && (
                <button className="btn btn-secondary btn-sm" onClick={() => nav.openViewer({ kind: 'compare', caseId, back: source, ...comparison })}>
                  <Icon.Compare size={18} /> Comparer
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {sheet && isTutorial && (
        <TutorialObservationSheet
          onClose={() => setSheet(null)}
          onFile={() => {
            dispatch({ type: 'tutorial/file' });
            nav.showToast('Ajouté au dossier');
            setSheet(null);
          }}
          filed={state.tutorial.filed}
        />
      )}
      {sheet && !isTutorial && r.caseDef && (
        <ObservationSheet
          def={r.caseDef}
          obs={r.caseDef.observations.find((o) => o.id === sheet)}
          accepted={accepted}
          filed={progress?.filedObservations.includes(sheet) ?? false}
          onClose={() => setSheet(null)}
          onNeedAccept={() => {
            setSheet(null);
            setNeedAccept(true);
          }}
          onAction={(a, o) => {
            if (a.type === 'addToFile') {
              dispatch({ type: 'observation/file', caseId: r!.caseDef!.id, observationId: o.id });
              nav.showToast('Ajouté au dossier');
            } else if (a.type === 'ask') {
              const reply = r!.caseDef!.replies.find((x) => x.id === a.replyId);
              setSheet(null);
              if (reply) nav.open('messages', { caseId: r!.caseDef!.id, threadId: reply.threadId });
            } else if (a.type === 'examine') {
              setSheet(null);
              if (a.mediaId && a.mediaId !== r!.media.id) nav.openViewer({ kind: 'case', caseId: r!.caseDef!.id, mediaId: a.mediaId, focus: a.zoom });
              else if (a.zoom) setFocus({ ...a.zoom });
            }
          }}
        />
      )}
      {needAccept && r.caseDef && <AcceptSheet def={r.caseDef} onClose={() => setNeedAccept(false)} />}
      {infoOpen && r.variant.info && (
        <Sheet onClose={() => setInfoOpen(false)} label="Infos du fichier">
          <h2>{r.media.name}</h2>
          <div className="group" style={{ marginBottom: 12 }}>
            {r.variant.info.map((row, i) => {
              const seen = !!row.observationId && foundIds.includes(row.observationId);
              return (
                <button
                  key={i}
                  className="row"
                  onClick={() => {
                    if (!row.observationId || !caseId || seen) return;
                    // La coche de la ligne confirme le relevé (pas de message par-dessus la feuille).
                    dispatch({ type: 'observation/found', caseId, observationId: row.observationId });
                  }}
                >
                  <span className="row-main">
                    <div className="row-sub">{row.label}</div>
                    <div className="row-title" style={{ fontWeight: 500 }}>{caseId ? fillTemplate(row.value, state.cases[caseId]?.flags ?? {}) : row.value}</div>
                  </span>
                  {seen && <Icon.Check size={18} />}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 13 }}>Touchez une ligne pour la relever dans le dossier.</p>
          <button className="btn btn-ghost btn-block" onClick={() => setInfoOpen(false)}>
            Fermer
          </button>
        </Sheet>
      )}
    </div>
  );
}

function TutorialObservationSheet({ onClose, onFile, filed }: { onClose: () => void; onFile: () => void; filed: boolean }) {
  return (
    <Sheet onClose={onClose} label="Observation">
      <h2>{TUTORIAL_OBSERVATION.title}</h2>
      <p>{TUTORIAL_OBSERVATION.description}</p>
      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={onFile} disabled={filed}>
          {filed ? 'Déjà dans le dossier' : 'Ajouter au dossier'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Sheet>
  );
}

function ObservationSheet({
  def,
  obs,
  accepted,
  filed,
  onClose,
  onAction,
  onNeedAccept,
}: {
  def: CaseDefinition;
  obs?: ObservationDef;
  accepted: boolean;
  filed: boolean;
  onClose: () => void;
  onAction: (a: ObservationAction, o: ObservationDef) => void;
  onNeedAccept: () => void;
}) {
  if (!obs) return null;
  const label = (a: ObservationAction) => {
    if (a.type === 'addToFile') return filed ? 'Dans le dossier' : 'Ajouter au dossier';
    if (a.type === 'ask') {
      const reply = def.replies.find((r) => r.id === a.replyId);
      const thread = def.threads.find((t) => t.id === reply?.threadId);
      return a.label ?? `Questionner ${thread ? character(def, thread.contact).name.split(' ')[0] : 'le contact'}`;
    }
    return a.label ?? 'Examiner de plus près';
  };
  // Seules les actions réellement disponibles sont proposées.
  const actions = obs.actions.filter((a) => a.type !== 'ask' || def.replies.some((r) => r.id === a.replyId));
  return (
    <Sheet onClose={onClose} label="Observation">
      <h2>{obs.title}</h2>
      {obs.description && <p>{obs.description}</p>}
      <div className="stack">
        {actions.map((a, i) => {
          const needsCase = a.type !== 'examine';
          const disabled = a.type === 'addToFile' && filed;
          return (
            <button
              key={i}
              className={`btn btn-block ${i === 0 ? 'btn-primary' : 'btn-secondary'}`}
              disabled={disabled}
              onClick={() => (needsCase && !accepted ? onNeedAccept() : onAction(a, obs))}
            >
              {label(a)}
            </button>
          );
        })}
        <button className="btn btn-ghost btn-block" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Sheet>
  );
}

/** Proposition d'acceptation quand une action en dépend (au lieu d'une erreur). */
export function AcceptSheet({ def, onClose }: { def: CaseDefinition; onClose: () => void }) {
  const { state, dispatch, cases } = useGame();
  const busy = state.activeCaseId && state.activeCaseId !== def.id ? cases.byId.get(state.activeCaseId) : undefined;
  return (
    <Sheet onClose={onClose} label="Accepter l’enquête">
      <h2>Accepter l’enquête ?</h2>
      <p>
        Pour conserver cette observation ou contacter {character(def, def.client).name}, acceptez d’abord l’affaire « {def.title} ».
      </p>
      {busy && <div className="callout neutral">Une autre enquête est en cours (« {busy.title} »). Terminez-la avant d’en accepter une nouvelle.</div>}
      <div className="stack">
        <button
          className="btn btn-primary btn-block"
          disabled={!!busy}
          onClick={() => {
            dispatch({ type: 'case/accept', caseId: def.id });
            onClose();
          }}
        >
          Accepter l’enquête
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>
          Plus tard
        </button>
      </div>
    </Sheet>
  );
}

function CompareView({ source }: { source: Extract<ViewerSource, { kind: 'compare' }> }) {
  const nav = useNav();
  const { state } = useGame();
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});
  useEffect(() => {
    for (const s of [source.left, source.right]) {
      const img = new Image();
      img.onload = () => setDims((d) => ({ ...d, [s.src]: { w: img.naturalWidth || 4, h: img.naturalHeight || 3 } }));
      img.src = s.src;
    }
  }, [source]);
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Comparaison">
      <NavBar back="Retour" onBack={() => nav.openViewer(source.back)} title="Comparer" />
      <div className="viewer-stage">
        <div className="compare">
          {[source.left, source.right].map((s, i) => (
            <div className="compare-side" key={i}>
              <span className="compare-label">{s.label}</span>
              {dims[s.src] && (
                <ZoomableImage src={s.src} alt={s.label} width={dims[s.src].w} height={dims[s.src].h} controls={false} maxZoom={10} overlay={s.overlay} calm={state.settings.reduceFlashes} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
