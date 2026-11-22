/** Enquêtes réservées : seul « Dossier 0 » est ouvert sans le code d'accès. */
import { describe, expect, it } from 'vitest';
import { indexCases } from '../engine';
import { createReducer } from '../reducer';
import { deserialize, initialState, serialize } from '../save';
import { inbox, isLocked } from '../selectors';
import { CASES } from '../../content/cases';

const cases = indexCases(CASES);
const reducer = createReducer(cases, () => Date.parse('2026-11-22T22:00:00'));

describe('code d’accès', () => {
  it('verrouille toutes les enquêtes sauf Dossier 0', () => {
    const s = reducer(initialState(cases), { type: 'intro/complete' });
    expect(CASES.filter((c) => !isLocked(c, s)).map((c) => c.id)).toEqual(['dossier-0']);
    const locked = inbox(s, cases).filter((m) => m.locked);
    expect(locked).toHaveLength(4);
    expect(locked.every((m) => m.read)).toBe(true); // pas de pastille « non lu »
  });

  it('un mauvais code ne change rien ; 1234 ouvre tout, et c’est sauvegardé dans l’état', () => {
    let s = reducer(initialState(cases), { type: 'intro/complete' });
    s = reducer(s, { type: 'access/unlock', code: '0000' });
    expect(s.unlocked).toBeFalsy();
    s = reducer(s, { type: 'access/unlock', code: ' 1234 ' });
    expect(s.unlocked).toBe(true);
    expect(CASES.every((c) => !isLocked(c, s))).toBe(true);
    expect(deserialize(serialize(s), cases).state.unlocked).toBe(true);
  });

  it('une enquête déjà commencée reste accessible', () => {
    let s = reducer(initialState(cases), { type: 'intro/complete' });
    s = reducer(s, { type: 'case/accept', caseId: 'le-cinquieme' });
    expect(isLocked(cases.byId.get('le-cinquieme')!, s)).toBe(false);
  });
});
