/**
 * Actions du joueur → nouvel état. Pur et testable (horloge passée en paramètre).
 */
import {
  applyEffect,
  clearOverridesOf,
  deliverMessageNow,
  emptyProgress,
  findMessage,
  processQueue,
  rescheduleQueue,
  settle,
  type CaseIndex,
} from './engine';
import { initialState } from './save';
import type { GameState, Id, Note, Settings, TutorialStep } from './types';

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
  | { type: 'case/accept'; caseId: Id }
  | { type: 'case/postpone'; caseId: Id }
  | { type: 'media/view'; caseId: Id; mediaId: Id }
  | { type: 'observation/found'; caseId: Id; observationId: Id }
  | { type: 'observation/file'; caseId: Id; observationId: Id }
  | { type: 'reply/prepare'; caseId: Id; replyId: Id | undefined }
  | { type: 'reply/send'; caseId: Id; replyId: Id }
  | { type: 'thread/read'; caseId: Id; threadId: Id }
  | { type: 'hint/reveal'; caseId: Id; stepId: Id }
  | { type: 'copy/save'; caseId: Id; mediaId: Id; variantId: Id; src: string; name: string }
  | { type: 'note/upsert'; note: Note }
  | { type: 'note/delete'; id: Id }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'notification/dismiss'; id: Id }
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
    case 'case/postpone':
      return patchCase(state, action.caseId, (p) => (p.status === 'new' ? { ...p, status: 'postponed' } : p));

    case 'media/view':
      return patchCase(state, action.caseId, (p) =>
        p.viewedMedia.includes(action.mediaId) ? p : { ...p, viewedMedia: [...p.viewedMedia, action.mediaId] },
      );

    case 'observation/found': {
      const def = cases.byId.get(action.caseId);
      const p = state.cases[action.caseId];
      if (!def || !p || p.foundObservations.includes(action.observationId)) return state;
      const obs = def.observations.find((o) => o.id === action.observationId);
      if (!obs) return state;
      let next = patchCase(state, def.id, (q) => ({ ...q, foundObservations: [...q.foundObservations, obs.id] }));
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
      if (!def || !p || !reply || p.status !== 'active' || p.sentReplies.includes(reply.id)) return state;
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
    case 'thread/read':
      return patchCase(state, action.caseId, (p) => {
        const n = p.threads[action.threadId]?.length ?? 0;
        return p.threadRead[action.threadId] === n ? p : { ...p, threadRead: { ...p.threadRead, [action.threadId]: n } };
      });
    case 'hint/reveal':
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

    case 'settings/update': {
      const prev = state.settings;
      let next: GameState = { ...state, settings: { ...prev, ...action.patch } };
      if (prev.airplane && !next.settings.airplane) next = rescheduleQueue(next, now);
      return next;
    }
    case 'notification/dismiss':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    case 'tick':
      return processQueue(state, cases, now);
    case 'reset':
      return initialState(cases);
  }
}

/** Message affichable dans un fil (contenu ou réponse du joueur). */
export function resolveEntry(def: Parameters<typeof findMessage>[0], messageId: Id) {
  if (messageId.startsWith('reply:')) {
    const r = def.replies.find((x) => `reply:${x.id}` === messageId);
    return r ? { id: messageId, from: 'player' as const, text: r.text ?? r.label, attachments: [] as Id[] } : undefined;
  }
  const m = findMessage(def, messageId);
  return m ? { id: m.id, from: m.from, text: m.text, attachments: m.attachments ?? [] } : undefined;
}

export { emptyProgress, clearOverridesOf };
