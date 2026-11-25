/**
 * Actions du joueur → nouvel état. Pur et testable (horloge passée en paramètre).
 */
import {
  currentVariant,
  availableReplies,
  applyEffect,
  clearOverridesOf,
  deliverMessageNow,
  emptyProgress,
  evaluate,
  findMessage,
  processQueue,
  drainBattery,
  rescheduleQueue,
  settle,
  reportScore,
  type CaseIndex,
} from './engine';
import { initialState } from './save';
import type { CaseDefinition, GameState, Id, Note, Settings, TutorialStep } from './types';
import { ACCESS_CODE } from './selectors';

export type Action =
  | { type: 'intro/complete' }
  | { type: 'intro/replay' }
  | { type: 'tutorial/start'; restart?: boolean }
  | { type: 'tutorial/dismiss' }
  | { type: 'tutorial/step'; step: TutorialStep }
  | { type: 'tutorial/found' }
  | { type: 'tutorial/file' }
  | { type: 'tutorial/complete' }
  | { type: 'mail/read'; mailId: Id }
  | { type: 'news/read'; articleId: Id }
  | { type: 'report/submit'; caseId: Id; answers: Record<Id, string> }
  | { type: 'media/unlock'; caseId: Id; mediaId: Id; code: string }
  | { type: 'case/accept'; caseId: Id }
  | { type: 'case/postpone'; caseId: Id }
  | { type: 'media/view'; caseId: Id; mediaId: Id }
  | { type: 'observation/found'; caseId: Id; observationId: Id }
  | { type: 'observation/file'; caseId: Id; observationId: Id }
  | { type: 'reply/prepare'; caseId: Id; replyId: Id | undefined }
  | { type: 'reply/send'; caseId: Id; replyId: Id }
  | { type: 'thread/read'; caseId: Id; threadId: Id }
  /** Le joueur revient dans le jeu après l'avoir quitté. */
  | { type: 'app/return'; leftAt: number; awayMs: number }
  /** Fin de l'épreuve « ne bouge plus » : tenu, ou application quittée ; `touched` compte un sursaut. */
  | { type: 'stillness/result'; result: 'held' | 'left' | 'touched' }
  /** Rejoue une affaire résolue depuis le début (les autres affaires ne bougent pas). */
  | { type: 'case/replay'; caseId: Id }
  | { type: 'hint/reveal'; caseId: Id; stepId: Id }
  | { type: 'copy/save'; caseId: Id; mediaId: Id; variantId: Id; src: string; name: string }
  | { type: 'note/upsert'; note: Note }
  | { type: 'note/delete'; id: Id }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'access/unlock'; code: string }
  /** Le joueur enregistre une émission de radio : le média rejoint ses enregistrements. */
  | { type: 'media/grant'; caseId: Id; mediaId: Id }
  /** La boussole a tenu une cible assez longtemps. */
  | { type: 'compass/found'; caseId: Id; targetId: Id }
  | { type: 'notification/dismiss'; id: Id }
  /** Active le réglage inconnu apparu dans Réglages (override `ghostSetting`). */
  | { type: 'ghost/activate' }
  | { type: 'tick' }
  | { type: 'reset' };

export type Clock = () => number;

const add = <T>(list: T[], v: T): T[] => (list.includes(v) ? list : [...list, v]);

let copySeq = 0;

export function createReducer(cases: CaseIndex, clock: Clock = Date.now) {
  return function reducer(state: GameState, action: Action): GameState {
    const now = clock();
    const next = reduce(state, action, cases, now);
    if (next === state) return state;
    // Toute action peut rendre une règle vraie : on stabilise puis on livre.
    return processQueue(settle(next, cases, now), cases, now);
  };
}

/** Ouvre une affaire : statut actif, pièces jointes, messages d'ouverture. */
function acceptCase(state: GameState, def: CaseDefinition, now: number): GameState {
  let next: GameState = patchCase(state, def.id, (q) => ({
    ...q,
    status: 'active',
    acceptedAt: now,
    stepId: q.stepId ?? def.steps[0]?.id,
    grantedMedia: (def.initialMail.attachments ?? []).reduce(add, q.grantedMedia),
    log: [...q.log, { at: now, text: 'Enquête acceptée.' }],
  }));
  next = { ...next, activeCaseId: def.id };
  for (const id of def.openingMessages ?? []) next = deliverMessageNow(next, def, id, now);
  // Les messages d'ouverture ne déclenchent pas de notification.
  return { ...next, notifications: state.notifications };
}

function patchCase(state: GameState, caseId: Id, fn: (p: GameState['cases'][string]) => GameState['cases'][string]) {
  const p = state.cases[caseId];
  return p ? { ...state, cases: { ...state.cases, [caseId]: fn(p) } } : state;
}

function reduce(state: GameState, action: Action, cases: CaseIndex, now: number): GameState {
  switch (action.type) {
    case 'intro/complete':
      return state.introDone ? state : { ...state, introDone: true };
    case 'intro/replay':
      return { ...state, introDone: false };

    case 'tutorial/start': {
      const t = state.tutorial;
      // Reprise là où le joueur s'était arrêté, sauf redémarrage demandé.
      if (!action.restart && t.status === 'dismissed' && t.step !== 'openMail') {
        return { ...state, tutorial: { ...t, status: 'active' } };
      }
      return { ...state, tutorial: { status: 'active', step: 'openMail', found: false, filed: false } };
    }
    case 'tutorial/dismiss':
      return { ...state, tutorial: { ...state.tutorial, status: 'dismissed' } };
    case 'tutorial/step': {
      const t = state.tutorial;
      if (t.status !== 'active') return state;
      const order: TutorialStep[] = ['openMail', 'openMessage', 'openAttachment', 'findDetail', 'fileObservation', 'openFiles', 'finish'];
      // On n'avance jamais en arrière (reprise après abandon).
      if (order.indexOf(action.step) <= order.indexOf(t.step)) return state;
      return { ...state, tutorial: { ...t, step: action.step } };
    }
    case 'tutorial/found': {
      const t = state.tutorial;
      if (t.found) return state;
      return { ...state, tutorial: { ...t, found: true, step: t.filed ? t.step : 'fileObservation' } };
    }
    case 'tutorial/file': {
      const t = state.tutorial;
      if (t.filed) return state;
      return { ...state, tutorial: { ...t, found: true, filed: true, step: 'openFiles' } };
    }
    case 'tutorial/complete':
      return { ...state, tutorial: { ...state.tutorial, status: 'completed', step: 'finish' } };

    case 'mail/read':
      return state.readMails.includes(action.mailId) ? state : { ...state, readMails: [...state.readMails, action.mailId] };

    case 'news/read':
      return state.readNews?.includes(action.articleId) ? state : { ...state, readNews: [...(state.readNews ?? []), action.articleId] };

    case 'app/return': {
      const away = { at: action.leftAt, ms: action.awayMs, count: (state.away?.count ?? 0) + 1 };
      let next: GameState = { ...state, away };
      const def = state.activeCaseId ? cases.byId.get(state.activeCaseId) : undefined;
      const r = def?.onReturn;
      if (def && r && state.cases[def.id]?.status === 'active' && action.awayMs >= r.minAwayMs && (!r.when || evaluate(r.when, next, def.id))) {
        for (const e of r.effects) next = applyEffect(next, def, e, now);
      }
      return next;
    }
    case 'stillness/result': {
      const cid = state.overrides.stillness?.caseId;
      if (!cid) return state;
      if (action.result === 'touched') {
        return patchCase(state, cid, (p) => ({ ...p, flags: { ...p.flags, sursauts: Number(p.flags.sursauts ?? 0) + 1 } }));
      }
      const overrides = { ...state.overrides };
      delete overrides.stillness;
      return patchCase({ ...state, overrides }, cid, (p) => ({ ...p, flags: { ...p.flags, immobile: action.result } }));
    }
    case 'case/replay': {
      const def = cases.byId.get(action.caseId);
      if (!def || state.cases[def.id]?.status !== 'solved') return state;
      if (state.activeCaseId && state.cases[state.activeCaseId]?.status === 'active') return state;
      // Tout ce qui appartient à l'affaire repart de zéro ; le reste du téléphone est conservé.
      const followUps = (def.followUpMails ?? []).map((m) => m.id);
      let next: GameState = {
        ...state,
        cases: { ...state.cases, [def.id]: { ...emptyProgress(), status: 'new' } },
        queue: state.queue.filter((q) => q.caseId !== def.id),
        notes: state.notes.filter((n) => n.caseId !== def.id),
        copies: state.copies.filter((c) => c.caseId !== def.id),
        readMails: state.readMails.filter((id) => !followUps.includes(id)),
      };
      next = clearOverridesOf(next, def.id);
      return acceptCase(next, def, now);
    }

    case 'case/accept': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      if (!def || !p) return state;
      // Initialisation unique : une affaire déjà acceptée n'est jamais réinitialisée.
      if (p.status === 'active' || p.status === 'solved') return state;
      // Une seule enquête active à la fois.
      if (state.activeCaseId && state.activeCaseId !== def.id && state.cases[state.activeCaseId]?.status === 'active') {
        return state;
      }
      return acceptCase(state, def, now);
    }
    case 'case/postpone':
      return patchCase(state, action.caseId, (p) => (p.status === 'new' ? { ...p, status: 'postponed' } : p));

    case 'media/view': {
      // On retient le média et la version consultée (`id@variante`) : certaines énigmes en dépendent.
      const def = cases.byId.get(action.caseId);
      const v = def ? currentVariant(def, state.cases[action.caseId], action.mediaId) : undefined;
      return patchCase(state, action.caseId, (p) => {
        const ids = [action.mediaId, ...(v ? [`${action.mediaId}@${v}`] : [])].filter((x) => !p.viewedMedia.includes(x));
        return ids.length ? { ...p, viewedMedia: [...p.viewedMedia, ...ids] } : p;
      });
    }

    case 'observation/found': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      if (!def || !p || p.foundObservations.includes(action.observationId)) return state;
      const obs = def.observations.find((o) => o.id === action.observationId);
      if (!obs) return state;
      let next = patchCase(state, def.id, (q) => ({
        ...q,
        foundObservations: [...q.foundObservations, obs.id],
        filedObservations: obs.autoFile ? add(q.filedObservations, obs.id) : q.filedObservations,
        log: obs.autoFile ? [...q.log, { at: now, text: `Observation : ${obs.title}` }] : q.log,
      }));
      for (const a of obs.actions) {
        if (a.type === 'ask') next = applyEffect(next, def, { type: 'unlockReply', replyId: a.replyId }, now);
      }
      return next;
    }
    case 'observation/file': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      if (!def || !p || p.filedObservations.includes(action.observationId)) return state;
      const obs = def.observations.find((o) => o.id === action.observationId);
      if (!obs) return state;
      return patchCase(state, def.id, (q) => ({
        ...q,
        foundObservations: add(q.foundObservations, obs.id),
        filedObservations: [...q.filedObservations, obs.id],
        log: [...q.log, { at: now, text: `Observation ajoutée : ${obs.title}` }],
      }));
    }

    case 'reply/prepare':
      return patchCase(state, action.caseId, (p) => ({ ...p, preparedReply: action.replyId }));
    case 'reply/send': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      const reply = def?.replies.find((r) => r.id === action.replyId);
      // Garde anti double-appui et mode avion.
      if (!def || !p || !reply || p.sentReplies.includes(reply.id)) return state;
      // Une réponse n'est envoyable que si elle est réellement proposée (contact joignable, etc.).
      if (!availableReplies(def, state, reply.threadId).some((r) => r.id === reply.id)) return state;
      if (state.settings.airplane) return patchCase(state, def.id, (q) => ({ ...q, preparedReply: reply.id }));
      const entryId = `reply:${reply.id}`;
      let next = patchCase(state, def.id, (q) => {
        const entries = [...(q.threads[reply.threadId] ?? []), { messageId: entryId, at: now }];
        return {
          ...q,
          sentReplies: [...q.sentReplies, reply.id],
          preparedReply: undefined,
          threads: { ...q.threads, [reply.threadId]: entries },
          threadRead: { ...q.threadRead, [reply.threadId]: entries.length },
        };
      });
      for (const e of reply.effects ?? []) next = applyEffect(next, def, e, now);
      return next;
    }
    case 'thread/read': {
      const def = cases.byId.get(action.caseId);
      const offered = def ? availableReplies(def, state, action.threadId).map((r) => r.id) : [];
      return patchCase(state, action.caseId, (p) => {
        const n = p.threads[action.threadId]?.length ?? 0;
        const seen = p.seenReplies?.[action.threadId] ?? [];
        const unseen = offered.filter((id) => !seen.includes(id));
        if (p.threadRead[action.threadId] === n && unseen.length === 0) return p;
        return {
          ...p,
          threadRead: { ...p.threadRead, [action.threadId]: n },
          seenReplies: unseen.length ? { ...p.seenReplies, [action.threadId]: [...seen, ...unseen] } : p.seenReplies,
        };
      });
    }
    case 'hint/reveal':
      // Une affaire résolue n'a plus d'aide.
      if (state.cases[action.caseId]?.status !== 'active') return state;
      return patchCase(state, action.caseId, (p) => {
        const n = p.hintsRevealed[action.stepId] ?? 0;
        return n >= 3 ? p : { ...p, hintsRevealed: { ...p.hintsRevealed, [action.stepId]: n + 1 } };
      });
    case 'copy/save': {
      const exists = state.copies.some(
        (c) => c.caseId === action.caseId && c.mediaId === action.mediaId && c.variantId === action.variantId,
      );
      if (exists) return state;
      copySeq += 1;
      return {
        ...state,
        copies: [
          ...state.copies,
          {
            id: `copy-${now}-${copySeq}`,
            caseId: action.caseId,
            mediaId: action.mediaId,
            variantId: action.variantId,
            src: action.src,
            name: action.name,
            savedAt: now,
          },
        ],
      };
    }

    case 'note/upsert': {
      const i = state.notes.findIndex((n) => n.id === action.note.id);
      const notes = [...state.notes];
      if (i >= 0) notes[i] = action.note;
      else notes.unshift(action.note);
      return { ...state, notes };
    }
    case 'note/delete':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };

    case 'media/grant': {
      const def = cases.byId.get(action.caseId);
      if (!def?.media.some((m) => m.id === action.mediaId)) return state;
      const next = patchCase(state, action.caseId, (p) => (p.grantedMedia.includes(action.mediaId) ? p : { ...p, grantedMedia: [...p.grantedMedia, action.mediaId] }));
      return next === state ? state : settle(next, cases, now);
    }

    case 'compass/found': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      const key = `boussole:${action.targetId}`;
      if (!def?.compass?.targets.some((t) => t.id === action.targetId) || !p || p.flags[key]) return state;
      return settle(patchCase(state, action.caseId, (q) => ({ ...q, flags: { ...q.flags, [key]: true } })), cases, now);
    }

    case 'media/unlock': {
      const def = cases.byId.get(action.caseId);
      const m = def?.media.find((x) => x.id === action.mediaId);
      const p = state.cases[action.caseId];
      const key = `verrou:${action.mediaId}`;
      if (!def || !m?.lock || !p || p.flags[key] === true) return state;
      if (action.code.replace(/\s/g, '') !== m.lock.code) {
        return patchCase(state, def.id, (q) => ({ ...q, flags: { ...q.flags, [`${key}:essais`]: Number(q.flags[`${key}:essais`] ?? 0) + 1 } }));
      }
      const next = patchCase(state, def.id, (q) => ({ ...q, flags: { ...q.flags, [key]: true }, log: [...q.log, { at: now, text: `${m.name} déverrouillé.` }] }));
      return processQueue(settle(next, cases, now), cases, now);
    }

    case 'report/submit': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      if (!def?.report || !p || p.flags.rapport !== 'pret') return state;
      const { total, right } = reportScore(def, state, action.answers);
      const saved: Record<string, string | number> = { 'rapport:justes': right, 'rapport:essais': Number(p.flags['rapport:essais'] ?? 0) + 1 };
      for (const id of Object.keys(def.report.blanks)) if (action.answers[id]) saved[`rapport:${id}`] = action.answers[id];
      let next = patchCase(state, def.id, (q) => ({ ...q, flags: { ...q.flags, ...saved } }));
      if (right < total) return next;
      next = patchCase(next, def.id, (q) => ({ ...q, flags: { ...q.flags, rapport: 'ok' }, log: [...q.log, { at: now, text: 'Rapport remis.' }] }));
      return processQueue(settle(applyEffect(next, def, { type: 'solveCase' }, now), cases, now), cases, now);
    }

    case 'access/unlock':
      return action.code.trim() === ACCESS_CODE && !state.unlocked ? { ...state, unlocked: true } : state;

    case 'settings/update': {
      const prev = state.settings;
      let next: GameState = { ...state, settings: { ...prev, ...action.patch } };
      if (prev.airplane && !next.settings.airplane) next = rescheduleQueue(next, now);
      return next;
    }
    case 'ghost/activate': {
      const o = state.overrides.ghostSetting;
      if (!o) return state;
      const [, text] = o.value.split('::');
      const overrides = { ...state.overrides };
      delete overrides.ghostSetting;
      const note = text
        ? [{ id: `${o.caseId}:reglage`, title: '', body: text, caseId: o.caseId, createdAt: now, updatedAt: now }]
        : [];
      return { ...state, overrides, notes: [...note, ...state.notes.filter((n) => n.id !== `${o.caseId}:reglage`)] };
    }
    case 'notification/dismiss':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case 'tick':
      return processQueue(drainBattery(state, cases, now), cases, now);
    case 'reset':
      return initialState(cases);
  }
}

/** Message affichable dans un fil (contenu ou réponse du joueur). */
export function resolveEntry(def: Parameters<typeof findMessage>[0], messageId: Id) {
  if (messageId.startsWith('reply:')) {
    const r = def.replies.find((x) => `reply:${x.id}` === messageId);
    return r ? { id: messageId, from: 'player' as const, text: r.text ?? r.label, attachments: [] as Id[], system: false, time: undefined as string | undefined } : undefined;
  }
  const m = findMessage(def, messageId);
  return m ? { id: m.id, from: m.from, text: m.text, attachments: m.attachments ?? [], system: !!m.system, time: m.time } : undefined;
}

export { emptyProgress, clearOverridesOf };
