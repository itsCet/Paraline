/**
 * Moteur de progression : fonctions pures, sans React.
 *
 * Après chaque action du joueur, `settle()` réévalue les règles de l'enquête
 * active jusqu'à stabilité. Une règle se déclenche dès que sa condition est
 * vraie, quel que soit l'ordre des actions qui y ont mené. Les règles
 * `once` (par défaut) sont mémorisées dans `firedRules` et ne se répètent
 * jamais, même après rechargement.
 */
import type {
  CaseDefinition,
  CaseProgress,
  Condition,
  Effect,
  GameState,
  Id,
  MailDef,
  MessageDef,
  QueuedDelivery,
} from './types';

export const DEFAULT_MESSAGE_DELAY = 1400;
const MAX_PASSES = 25;

export function emptyProgress(): CaseProgress {
  return {
    status: 'new',
    viewedMedia: [],
    foundObservations: [],
    filedObservations: [],
    sentReplies: [],
    unlockedReplies: [],
    deliveredMails: [],
    threads: {},
    threadRead: {},
    grantedMedia: [],
    mediaVariants: {},
    firedRules: [],
    ruleArmed: {},
    flags: {},
    hintsRevealed: {},
    log: [],
    writtenNotes: [],
  };
}

/* ------------------------------------------------------------------ */
/* Index des contenus                                                   */
/* ------------------------------------------------------------------ */

export interface CaseIndex {
  list: CaseDefinition[];
  byId: Map<Id, CaseDefinition>;
}

export function indexCases(list: CaseDefinition[]): CaseIndex {
  for (const c of list) defaultVariants.set(c.id, new Map(c.media.map((m) => [m.id, m.defaultVariant])));
  return { list, byId: new Map(list.map((c) => [c.id, c])) };
}

export const findMessage = (c: CaseDefinition, id: Id): MessageDef | undefined =>
  c.messages.find((m) => m.id === id);

export const findMail = (c: CaseDefinition, id: Id): MailDef | undefined =>
  c.initialMail.id === id ? c.initialMail : c.followUpMails?.find((m) => m.id === id);

/* ------------------------------------------------------------------ */
/* Conditions                                                           */
/* ------------------------------------------------------------------ */

/** Variantes par défaut des médias, renseignées par `indexCases` (pour `mediaVariant`). */
const defaultVariants = new Map<Id, Map<Id, Id>>();

export function evaluate(cond: Condition, state: GameState, caseId: Id): boolean {
  const p = state.cases[caseId];
  if (!p) return false;
  const s = state.settings;
  if ('all' in cond) return cond.all.every((c) => evaluate(c, state, caseId));
  if ('any' in cond) return cond.any.some((c) => evaluate(c, state, caseId));
  if ('not' in cond) return !evaluate(cond.not, state, caseId);
  if ('caseAccepted' in cond) return p.status === 'active' || p.status === 'solved';
  if ('mailRead' in cond) return state.readMails.includes(cond.mailRead);
  if ('mediaViewed' in cond) return p.viewedMedia.includes(cond.mediaViewed);
  if ('observationFound' in cond) return p.foundObservations.includes(cond.observationFound);
  if ('observationFiled' in cond) return p.filedObservations.includes(cond.observationFiled);
  if ('replySent' in cond) return p.sentReplies.includes(cond.replySent);
  if ('messageDelivered' in cond)
    return Object.values(p.threads).some((t) => t.some((e) => e.messageId === cond.messageDelivered));
  if ('stepIs' in cond) return p.stepId === cond.stepIs;
  if ('flag' in cond) {
    const v = p.flags[cond.flag];
    return cond.equals === undefined ? Boolean(v) : v === cond.equals;
  }
  if ('flagAtMost' in cond) {
    const v = p.flags[cond.flagAtMost];
    return typeof v === 'number' && v <= cond.value;
  }
  if ('manualTime' in cond) return !s.clockAuto && s.manualTime === cond.manualTime;
  if ('manualDate' in cond) return !s.clockAuto && s.manualDate === cond.manualDate;
  if ('manualDateBetween' in cond) return !s.clockAuto && s.manualDate >= cond.manualDateBetween[0] && s.manualDate <= cond.manualDateBetween[1];
  if ('manualHour' in cond) return !s.clockAuto && Number(s.manualTime.slice(0, 2)) === cond.manualHour;
  if ('airplane' in cond) return s.airplane === cond.airplane;
  if ('clockAuto' in cond) return s.clockAuto === cond.clockAuto;
  if ('sound' in cond) return s.sound === cond.sound;
  if ('noteExists' in cond) return state.notes.some((n) => n.id === noteKey(caseId, cond.noteExists));
  if ('noteWritten' in cond) return (p.writtenNotes ?? []).includes(cond.noteWritten);
  if ('mediaVariant' in cond) {
    if (p.mediaVariants[cond.mediaVariant] !== undefined) return p.mediaVariants[cond.mediaVariant] === cond.is;
    return defaultVariants.get(caseId)?.get(cond.mediaVariant) === cond.is;
  }
  if ('ruleFired' in cond) return p.firedRules.includes(cond.ruleFired);
  return false;
}

/* ------------------------------------------------------------------ */
/* Effets                                                               */
/* ------------------------------------------------------------------ */

const add = <T>(list: T[], v: T): T[] => (list.includes(v) ? list : [...list, v]);

function updateCase(state: GameState, caseId: Id, fn: (p: CaseProgress) => CaseProgress): GameState {
  const p = state.cases[caseId];
  if (!p) return state;
  return { ...state, cases: { ...state.cases, [caseId]: fn(p) } };
}

/** Identifiant d'une note d'enquête dans Notes. */
export const noteKey = (caseId: Id, noteId: Id) => `${caseId}:${noteId}`;

export function isDelivered(state: GameState, caseId: Id, kind: QueuedDelivery['kind'], id: Id): boolean {
  const p = state.cases[caseId];
  if (!p) return false;
  if (kind === 'note') return state.notes.some((n) => n.id === noteKey(caseId, id));
  if (kind === 'mail') return p.deliveredMails.includes(id);
  return Object.values(p.threads).some((t) => t.some((e) => e.messageId === id));
}

export function isQueued(state: GameState, caseId: Id, kind: QueuedDelivery['kind'], id: Id): boolean {
  return state.queue.some((q) => q.caseId === caseId && q.kind === kind && q.id === id);
}

function threadOf(def: CaseDefinition, q: QueuedDelivery): Id | undefined {
  return q.kind === 'message' ? findMessage(def, q.id)?.threadId : undefined;
}

/** Ajoute une livraison à la file sans jamais créer de doublon. */
function enqueue(
  state: GameState,
  def: CaseDefinition,
  kind: QueuedDelivery['kind'],
  id: Id,
  delay: number,
  now: number,
  ignoreAirplane?: boolean,
  holdUntil?: Condition,
  background?: boolean,
): GameState {
  if (isDelivered(state, def.id, kind, id) || isQueued(state, def.id, kind, id)) return state;
  const thread = kind === 'message' ? findMessage(def, id)?.threadId : undefined;
  // Les messages d'un même fil s'enchaînent : le délai part du précédent.
  // Un événement d'arrière-plan n'attend personne, et personne ne l'attend.
  let base = now;
  for (const q of background ? [] : state.queue) {
    if (q.background) continue;
    if (q.caseId === def.id && q.kind === kind && (kind !== 'message' || threadOf(def, q) === thread)) {
      base = Math.max(base, q.notBefore);
    }
  }
  const item: QueuedDelivery = { kind, id, caseId: def.id, notBefore: base + delay };
  if (ignoreAirplane) item.ignoreAirplane = true;
  if (holdUntil) item.holdUntil = holdUntil;
  if (background) item.background = true;
  return { ...state, queue: [...state.queue, item] };
}

/** Livre immédiatement un message dans son fil (idempotent). */
export function deliverMessageNow(state: GameState, def: CaseDefinition, messageId: Id, now: number): GameState {
  const msg = findMessage(def, messageId);
  if (!msg || isDelivered(state, def.id, 'message', messageId)) return state;
  let next = updateCase(state, def.id, (p) => ({
    ...p,
    threads: { ...p.threads, [msg.threadId]: [...(p.threads[msg.threadId] ?? []), { messageId, at: now }] },
    threadRead:
      msg.from === 'player'
        ? { ...p.threadRead, [msg.threadId]: (p.threads[msg.threadId]?.length ?? 0) + 1 }
        : p.threadRead,
    grantedMedia: (msg.attachments ?? []).reduce(add, p.grantedMedia),
  }));
  if (msg.from !== 'player' && msg.notify !== false && !msg.system) {
    const who = def.characters.find((c) => c.id === msg.from);
    const thread = def.threads.find((t) => t.id === msg.threadId);
    const group = thread?.members ? def.characters.find((c) => c.id === thread.contact) : undefined;
    const body = msg.notify ?? msg.text ?? (msg.attachments?.length ? 'Pièce jointe' : '');
    next = pushNotification(next, {
      app: 'messages',
      title: group?.name ?? who?.name ?? 'Nouveau message',
      body: group && who ? `${who.name} : ${body}` : body,
      target: { caseId: def.id, threadId: msg.threadId },
    });
  }
  return next;
}

/** Remplace `{flag:nom:heure}` et `{flag:nom:duree}` par la valeur d'un drapeau (heure HH:MM ou durée « 3 min 12 s »). */
export function fillTemplate(text: string, flags: Record<string, unknown>): string {
  return text.replace(/\{flag:([\w-]+):(heure|duree)\}/g, (_, name: string, kind: string) => {
    const v = Number(flags[name] ?? 0);
    if (kind === 'heure') {
      const d = new Date(v);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const sec = Math.max(1, Math.round(v / 1000));
    return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, '0')} s`;
  });
}

/** Écrit une note d'enquête dans Notes (sans notification : elle est simplement là). */
export function writeNoteNow(state: GameState, def: CaseDefinition, noteId: Id, now: number): GameState {
  const n = def.notes?.find((x) => x.id === noteId);
  if (!n || isDelivered(state, def.id, 'note', noteId)) return state;
  const p = state.cases[def.id];
  const next = p ? updateCase(state, def.id, (q) => ({ ...q, writtenNotes: add(q.writtenNotes ?? [], noteId) })) : state;
  const at = n.at ? Date.parse(n.at) : now;
  return {
    ...next,
    notes: [{ id: noteKey(def.id, noteId), title: n.title ?? '', body: fillTemplate(n.body, p?.flags ?? {}), caseId: def.id, createdAt: at, updatedAt: at }, ...next.notes],
  };
}

export function deliverMailNow(state: GameState, def: CaseDefinition, mailId: Id): GameState {
  const mail = findMail(def, mailId);
  if (!mail || isDelivered(state, def.id, 'mail', mailId)) return state;
  const next = updateCase(state, def.id, (p) => ({ ...p, deliveredMails: [...p.deliveredMails, mailId] }));
  const who = def.characters.find((c) => c.id === mail.from);
  return pushNotification(next, {
    app: 'mail',
    title: mail.draft ? 'Mail' : (who?.name ?? 'Nouveau message'),
    body: mail.notify ?? mail.subject,
    target: { caseId: def.id, mailId },
  });
}

let notifSeq = 0;
export function pushNotification(state: GameState, n: Omit<GameState['notifications'][number], 'id'>): GameState {
  notifSeq += 1;
  return { ...state, notifications: [...state.notifications.slice(-3), { ...n, id: `n${Date.now()}-${notifSeq}` }] };
}

export function applyEffect(state: GameState, def: CaseDefinition, effect: Effect, now: number): GameState {
  const cid = def.id;
  switch (effect.type) {
    case 'deliverMessage':
      return enqueue(state, def, 'message', effect.messageId, effect.delayMs ?? DEFAULT_MESSAGE_DELAY, now, effect.ignoreAirplane, effect.holdUntil, effect.background);
    case 'deliverMail':
      return enqueue(state, def, 'mail', effect.mailId, effect.delayMs ?? DEFAULT_MESSAGE_DELAY, now, effect.ignoreAirplane, effect.holdUntil);
    case 'writeNote':
      return enqueue(state, def, 'note', effect.noteId, effect.delayMs ?? 0, now, true);
    case 'removeNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== noteKey(cid, effect.noteId)) };
    case 'setMediaVariant':
      return updateCase(state, cid, (p) => ({ ...p, mediaVariants: { ...p.mediaVariants, [effect.mediaId]: effect.variantId } }));
    case 'unlockReply':
      return updateCase(state, cid, (p) => ({ ...p, unlockedReplies: add(p.unlockedReplies, effect.replyId) }));
    case 'grantMedia':
      return updateCase(state, cid, (p) => ({ ...p, grantedMedia: add(p.grantedMedia, effect.mediaId) }));
    case 'setStep':
      return updateCase(state, cid, (p) => ({ ...p, stepId: effect.stepId }));
    case 'setFlag': {
      // Jetons : `$now`, `$awayAt` (heure de départ du joueur), `$awayMs` (durée de son absence).
      const v = effect.value === '$now' ? now : effect.value === '$awayAt' ? (state.away?.at ?? now) : effect.value === '$awayMs' ? (state.away?.ms ?? 0) : effect.value;
      return updateCase(state, cid, (p) => ({ ...p, flags: { ...p.flags, [effect.name]: v } }));
    }
    case 'addFlag': {
      return updateCase(state, cid, (p) => {
        const cur = typeof p.flags[effect.name] === 'number' ? (p.flags[effect.name] as number) : 0;
        const v = Math.min(effect.max ?? Infinity, Math.max(effect.min ?? -Infinity, cur + effect.delta));
        return { ...p, flags: { ...p.flags, [effect.name]: v } };
      });
    }
    case 'phoneOverride':
      return {
        ...state,
        overrides: { ...state.overrides, [effect.key]: { value: effect.value, caseId: cid, until: effect.until } },
      };
    case 'clearPhoneOverride': {
      const overrides = { ...state.overrides };
      delete overrides[effect.key];
      return { ...state, overrides };
    }
    case 'notify':
      return pushNotification(state, { app: effect.app ?? 'files', title: effect.title, body: effect.body });
    case 'log':
      return updateCase(state, cid, (p) => ({ ...p, log: [...p.log, { at: now, text: effect.text }] }));
    case 'alterCopies':
      return {
        ...state,
        copies: state.copies.map((c) =>
          c.caseId === cid && c.mediaId === effect.mediaId && c.variantId === effect.fromVariant ? { ...c, variantId: effect.toVariant } : c,
        ),
      };
    case 'solveCase': {
      // Avec un rapport : l'affaire n'est résolue qu'une fois le rapport juste remis.
      const flags = state.cases[cid]?.flags ?? {};
      if (def.report && flags.rapport !== 'ok') {
        if (flags.rapport === 'pret') return state;
        let pending = updateCase(state, cid, (p) => ({ ...p, flags: { ...p.flags, rapport: 'pret' }, log: [...p.log, { at: now, text: 'Il reste à remettre votre rapport.' }] }));
        // Comme à la résolution : le téléphone redevient normal tout de suite (les effets suivants de la règle restent).
        pending = clearOverridesOf(pending, cid);
        pending = pushNotification(pending, { app: 'files', title: 'Dossiers', body: `Rapport à remettre : ${def.title}`, target: { caseId: cid } });
        return pending;
      }
      let next = updateCase(state, cid, (p) => ({ ...p, status: 'solved', solvedAt: now }));
      if (!def.report) next = clearOverridesOf(next, cid);
      // Une énigme a pu laisser le téléphone à une autre date : on le rappelle, une fois.
      if (!next.settings.clockAuto) {
        next = pushNotification(next, { app: 'settings', title: 'Réglages', body: 'Le téléphone n’est plus à l’heure : réactivez « Réglage automatique ».' });
      }
      return { ...next, activeCaseId: next.activeCaseId === cid ? null : next.activeCaseId };
    }
  }
}

export function clearOverridesOf(state: GameState, caseId: Id): GameState {
  const overrides = { ...state.overrides };
  let changed = false;
  for (const k of Object.keys(overrides) as (keyof typeof overrides)[]) {
    if (overrides[k]?.caseId === caseId) {
      delete overrides[k];
      changed = true;
    }
  }
  return changed ? { ...state, overrides } : state;
}

/* ------------------------------------------------------------------ */
/* Résolution des règles                                                */
/* ------------------------------------------------------------------ */

/** Réévalue les règles de l'enquête active jusqu'à stabilité. */
export function settle(state: GameState, cases: CaseIndex, now: number): GameState {
  let next = expireOverrides(state);
  const cid = next.activeCaseId;
  const def = cid ? cases.byId.get(cid) : undefined;
  // Une affaire terminée qui attend son rapport ne bouge plus (seuls les messages déjà prévus arrivent).
  if (!cid || !def || next.cases[cid]?.status !== 'active' || next.cases[cid]?.flags.rapport === 'pret') return next;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;
    for (const rule of def.rules) {
      const p = next.cases[cid];
      if (!p || p.status !== 'active' || p.flags.rapport === 'pret') return next;
      const once = rule.once !== false;
      if (once && p.firedRules.includes(rule.id)) continue;
      const ok = evaluate(rule.when, next, cid);
      if (!once) {
        const wasArmed = p.ruleArmed[rule.id] ?? false;
        if (ok !== wasArmed) {
          next = updateCase(next, cid, (q) => ({ ...q, ruleArmed: { ...q.ruleArmed, [rule.id]: ok } }));
        }
        if (!ok || wasArmed) continue;
      } else if (!ok) continue;
      // Marque avant d'appliquer : un effet ne peut pas relancer sa propre règle.
      next = updateCase(next, cid, (q) => ({ ...q, firedRules: add(q.firedRules, rule.id) }));
      for (const e of rule.effects) next = applyEffect(next, def, e, now);
      changed = true;
    }
    next = expireOverrides(next);
    if (!changed) break;
  }
  return next;
}

/** Supprime les modifications temporaires dont la condition de fin est vraie. */
export function expireOverrides(state: GameState): GameState {
  let overrides = state.overrides;
  for (const k of Object.keys(overrides) as (keyof typeof overrides)[]) {
    const o = overrides[k];
    if (o?.until && evaluate(o.until, state, o.caseId)) {
      overrides = { ...overrides };
      delete overrides[k];
    }
  }
  return overrides === state.overrides ? state : { ...state, overrides };
}

/* ------------------------------------------------------------------ */
/* File de livraison                                                    */
/* ------------------------------------------------------------------ */

/** Livre ce qui est dû. En mode avion, seuls les éléments `ignoreAirplane` passent. */
export function processQueue(state: GameState, cases: CaseIndex, now: number): GameState {
  if (state.queue.length === 0) return state;
  let next = state;
  const remaining: QueuedDelivery[] = [];
  let delivered = false;
  for (const q of state.queue) {
    const def = cases.byId.get(q.caseId);
    if (!def) continue; // enquête retirée du contenu : on abandonne l'élément
    if (!queueReady(next, q) || q.notBefore > now) {
      remaining.push(q);
      continue;
    }
    next =
      q.kind === 'message'
        ? deliverMessageNow(next, def, q.id, now)
        : q.kind === 'note'
          ? writeNoteNow(next, def, q.id, now)
          : deliverMailNow(next, def, q.id);
    delivered = true;
  }
  next = { ...next, queue: remaining };
  return delivered ? settle(next, cases, now) : next;
}

/** Un élément de la file peut-il partir (réseau, condition d'attente) ? */
export function queueReady(state: GameState, q: QueuedDelivery): boolean {
  const online = !state.settings.airplane || q.ignoreAirplane;
  return Boolean(online) && (!q.holdUntil || evaluate(q.holdUntil, state, q.caseId));
}

/** À la reconnexion, échelonne la file pour éviter une avalanche. */
export function rescheduleQueue(state: GameState, now: number): GameState {
  let t = now + 800;
  const queue = [...state.queue]
    .sort((a, b) => a.notBefore - b.notBefore)
    .map((q) => {
      if (q.ignoreAirplane) return q;
      const item = { ...q, notBefore: Math.max(q.notBefore, t) };
      t = item.notBefore + DEFAULT_MESSAGE_DELAY;
      return item;
    });
  return { ...state, queue };
}

/* ------------------------------------------------------------------ */
/* Lecture                                                              */
/* ------------------------------------------------------------------ */

export function currentVariant(def: CaseDefinition, p: CaseProgress | undefined, mediaId: Id): Id | undefined {
  const m = def.media.find((x) => x.id === mediaId);
  if (!m) return undefined;
  return p?.mediaVariants[mediaId] ?? m.defaultVariant;
}

/** Réponses proposées dans un fil, selon l'état de l'enquête. */
export function availableReplies(def: CaseDefinition, state: GameState, threadId: Id) {
  const p = state.cases[def.id];
  if (!p || (p.status !== 'active' && p.status !== 'solved')) return [];
  const solved = p.status === 'solved';
  return def.replies.filter(
    (r) =>
      r.threadId === threadId &&
      Boolean(r.whenSolved) === solved &&
      !p.sentReplies.includes(r.id) &&
      // La condition `available` s'applique toujours ; une réponse visée par un déblocage doit en plus être débloquée.
      (r.available ? evaluate(r.available, state, def.id) : true) &&
      (p.unlockedReplies.includes(r.id) || !isLocked(def, r.id)),
  );
}

/** Réponses apparues dans un fil depuis la dernière fois que le joueur l'a ouvert. */
export function newReplies(def: CaseDefinition, state: GameState, threadId: Id) {
  const p = state.cases[def.id];
  if (!p || p.status !== 'active') return [];
  const seen = p.seenReplies?.[threadId] ?? [];
  return availableReplies(def, state, threadId).filter((r) => !seen.includes(r.id));
}

/** Premier obstacle non résolu (indices sur demande). */
export const REPORT_HINTS = [
  'L’affaire est terminée sur le terrain. Il reste à l’expliquer.',
  'Relisez vos observations dans Dossiers : chaque trou du rapport correspond à quelque chose que vous avez relevé.',
  'Dans Dossiers, ouvrez l’affaire et complétez le rapport. Un choix qui manque ? Il reste un détail à relever dans les pièces.',
];

/** Rapport : paragraphes demandés dans cette partie, et les trous qu'ils contiennent. */
export function reportParagraphs(def: CaseDefinition, state: GameState): string[] {
  return (def.report?.text ?? []).flatMap((t) => (typeof t === 'string' ? [t] : evaluate(t.when, state, def.id) ? [t.text] : []));
}
export function reportBlanks(def: CaseDefinition, state: GameState): Id[] {
  return reportParagraphs(def, state).flatMap((t) => [...t.matchAll(/\{([\w-]+)\}/g)].map((m) => m[1]));
}

/** Rapport : nombre de réponses justes (trous des paragraphes demandés). */
export function reportScore(def: CaseDefinition, state: GameState, answers: Record<Id, string | undefined>) {
  const ids = reportBlanks(def, state);
  return { total: ids.length, right: ids.filter((id) => answers[id] === def.report!.blanks[id].answer).length };
}

export function currentObstacle(def: CaseDefinition, state: GameState) {
  const p = state.cases[def.id];
  if (!p || p.status !== 'active') return undefined;
  if (def.report && p.flags.rapport === 'pret') return { id: 'rapport', hints: def.report.hints ?? REPORT_HINTS, solved: { flag: 'rapport', equals: 'ok' } as Condition };
  return def.obstacles?.find((o) => !evaluate(o.solved, state, def.id));
}

/** Une réponse sans condition mais visée par `unlockReply` reste verrouillée jusqu'au déblocage. */
function isLocked(def: CaseDefinition, replyId: Id): boolean {
  const targeted = (effects: Effect[] | undefined) =>
    (effects ?? []).some((e) => e.type === 'unlockReply' && e.replyId === replyId);
  return (
    def.rules.some((r) => targeted(r.effects)) ||
    def.replies.some((r) => targeted(r.effects)) ||
    def.observations.some((o) => o.actions.some((a) => a.type === 'ask' && a.replyId === replyId))
  );
}

/** Batterie d'un contact (`CaseDefinition.battery`) : un cran de moins toutes les `everyMs`. */
export function drainBattery(state: GameState, cases: CaseIndex, now: number): GameState {
  const cid = state.activeCaseId;
  const def = cid ? cases.byId.get(cid) : undefined;
  const b = def?.battery;
  const p = cid ? state.cases[cid] : undefined;
  if (!cid || !def || !b || !p || p.status !== 'active' || p.flags.rapport === 'pret') return state;
  const level = p.flags[b.flag];
  const key = `${b.flag}:t`;
  if (typeof level !== 'number' || level <= b.floor || !evaluate(b.while, state, cid)) {
    // Le compte repart de zéro quand la batterie se remet à baisser.
    return p.flags[key] === undefined ? state : updateCase(state, cid, (q) => {
      const flags = { ...q.flags };
      delete flags[key];
      return { ...q, flags };
    });
  }
  const last = p.flags[key];
  if (typeof last !== 'number') return updateCase(state, cid, (q) => ({ ...q, flags: { ...q.flags, [key]: now } }));
  if (now - last < b.everyMs) return state;
  const next = updateCase(state, cid, (q) => ({ ...q, flags: { ...q.flags, [b.flag]: level - 1, [key]: now } }));
  return settle(next, cases, now);
}
