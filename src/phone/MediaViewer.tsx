import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { useNav, type ViewerSource } from './nav';
import { character, resolveMedia } from '../game/selectors';
import { TUTORIAL_MEDIA, TUTORIAL_OBSERVATION } from '../content/tutorial';
import { ZoomableImage } from '../components/ZoomableImage';
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

export function MediaViewer() {
  const { viewer } = useNav();
  if (!viewer) return null;
  if (viewer.kind === 'compare') return <CompareView source={viewer} />;
  return <SingleViewer key={JSON.stringify(viewer)} source={viewer} />;
}

function SingleViewer({ source }: { source: Exclude<ViewerSource, { kind: 'compare' }> }) {
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

  useEffect(() => {
    if (source.kind === 'tutorial') dispatch({ type: 'tutorial/step', step: 'findDetail' });
    else if (caseId && mediaId && !r?.isCopy) dispatch({ type: 'media/view', caseId, mediaId });
  }, [source.kind, caseId, mediaId, dispatch, r?.isCopy]);

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
      {r.media.kind === 'image' && (
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
          onCue={(id) => {
            if (!caseId || foundIds.includes(id)) return;
            dispatch({ type: 'observation/found', caseId, observationId: id });
          }}
        />
      )}
      {r.media.kind === 'document' && (
        <DocView
          variant={r.variant}
          name={r.media.name}
          found={foundIds}
          onPassage={(id) => {
            if (!caseId || foundIds.includes(id)) return;
            dispatch({ type: 'observation/found', caseId, observationId: id });
            // Comme sur une photo : si ce passage ouvre une question, on la propose depuis la confirmation.
            const ask = r!.caseDef?.observations.find((o) => o.id === id)?.actions.find((a) => a.type === 'ask');
            const reply = ask && ask.type === 'ask' ? r!.caseDef!.replies.find((x) => x.id === ask.replyId) : undefined;
            const thread = reply && r!.caseDef!.threads.find((t) => t.id === reply.threadId);
            if (reply && thread) {
              const who = character(r!.caseDef!, thread.contact).name.split(' ')[0];
              nav.showToast('Passage relevé', { label: ask && ask.type === 'ask' && ask.label ? ask.label : `Questionner ${who}`, run: () => nav.open('messages', { caseId, threadId: reply.threadId }) });
            } else nav.showToast('Passage relevé dans le dossier');
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
                <>
                  <h3>Un détail vous intrigue ?</h3>
                  <p>Touchez une zone de l’image.</p>
                </>
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
                    <div className="row-title" style={{ fontWeight: 500 }}>{row.value}</div>
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
