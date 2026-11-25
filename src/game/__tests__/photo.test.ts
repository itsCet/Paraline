/** « Cette photo a changé » : parcours, fins, synchronisation de l'album. */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, currentObstacle, evaluate, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { withRapport } from './rapport-auto';
import { deserialize, initialState, serialize } from '../save';
import type { GameState, Settings } from '../types';
import { photoChangee as def } from '../../content/cases/photo-changee';
import { chambreCondamnee } from '../../content/cases/chambre-condamnee';

const ID = def.id;
const cases = indexCases([chambreCondamnee, def]);
let now = 1_000_000;
const reducer = withRapport(createReducer(cases, () => now), cases);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const flush = (s: GameState, rounds = 12) => {
  for (let i = 0; i < rounds; i++) {
    now += 4000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => flush(run(s, { type: 'settings/update', patch }));
const send = (s: GameState, replyId: string) => flush(run(s, { type: 'reply/send', caseId: ID, replyId }));
const found = (s: GameState, observationId: string) => run(s, { type: 'observation/found', caseId: ID, observationId });
const p = (s: GameState) => s.cases[ID];
const delivered = (s: GameState, id: string) => Object.values(p(s).threads).flat().filter((e) => e.messageId === id).length;
const replies = (s: GameState, t: string) => availableReplies(def, s, t).map((r) => r.id);
const ending = (s: GameState) => def.endings?.find((e) => evaluate(e.when, s, ID))?.text[0] ?? '';

let s0: GameState;
beforeEach(() => {
  now = 1_000_000;
  s0 = run(initialState(cases), { type: 'intro/complete' });
});

/** Mène l'enquête jusqu'au choix final. */
function toChoice(): GameState {
  let s = flush(run(s0, { type: 'case/accept', caseId: ID }));
  s = found(s, 'parc-ombre');
  s = send(s, 'q-album');
  s = found(s, 'info-ipad');
  s = send(s, 'q-ipad');
  return s;
}

describe('cette photo a changé', () => {
  it('les deux enquêtes sont disponibles au lancement ; une seule active à la fois', () => {
    expect(p(s0).status).toBe('new');
    expect(s0.cases['chambre-condamnee'].status).toBe('new');
    let s = run(s0, { type: 'case/accept', caseId: 'chambre-condamnee' });
    s = run(s, { type: 'case/accept', caseId: ID });
    expect(p(s).status).toBe('new');
  });

  it('l’album se resynchronise : hors ligne, copie locale sans Paul', () => {
    let s = send(flush(run(s0, { type: 'case/accept', caseId: ID })), 'q-album');
    expect(p(s).grantedMedia).toEqual(expect.arrayContaining(['album-parc', 'album-anniv', 'album-plage']));
    expect(p(s).mediaVariants['album-parc'] ?? 'synchro').toBe('synchro');
    s = set(s, { airplane: true });
    expect(p(s).mediaVariants['album-parc']).toBe('locale');
    s = set(s, { airplane: false });
    expect(p(s).mediaVariants['album-parc']).toBe('synchro');
    // les pièces jointes de l'e-mail ne changent jamais
    expect(p(s).mediaVariants['mail-parc']).toBeUndefined();
  });

  it('les questions suivent les découvertes, sans ordre imposé', () => {
    let s = flush(run(s0, { type: 'case/accept', caseId: ID }));
    expect(replies(s, 't-anna')).toEqual(['q-album']);
    s = found(s, 'info-ipad'); // Infos de la pièce jointe, avant même l'album
    expect(replies(s, 't-anna')).toEqual(['q-album', 'q-ipad']);
    expect(currentObstacle(def, s)?.id).toBe('qui');
  });

  it('fin douce : Léa écrit, Anna garde les photos', () => {
    let s = toChoice();
    expect(replies(s, 't-anna')).toEqual(expect.arrayContaining(['f-froid', 'f-doux']));
    s = send(s, 'f-doux');
    expect(replies(s, 't-anna')).not.toContain('f-froid');
    expect(delivered(s, 'l-2')).toBe(1);
    s = send(s, 'l-r-2');
    expect(delivered(s, 'a-garder')).toBe(1);
    expect(p(s).status).toBe('solved');
    expect(ending(s)).toContain('décidé de les garder');
    expect(replies(s, 't-lea')).toEqual([]);
  });

  it('fin froide : Anna supprime l’album', () => {
    let s = send(toChoice(), 'f-froid');
    expect(p(s).status).toBe('solved');
    expect(delivered(s, 'l-1')).toBe(0);
    expect(ending(s)).toContain('supprimé l’album');
  });

  it('après résolution, le mode avion ne change plus l’album ; sauvegarde fidèle', () => {
    let s = send(toChoice(), 'f-froid');
    s = set(s, { airplane: true });
    expect(p(s).mediaVariants['album-parc'] ?? 'synchro').toBe('synchro');
    const r = deserialize(serialize(s), cases).state;
    expect(r.cases[ID].status).toBe('solved');
    expect(ending(r)).toContain('supprimé');
  });
});
