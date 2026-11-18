import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, evaluate, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { deserialize, initialState, serialize } from '../save';
import { validateRegistry } from '../validate';
import { CASES } from '../../content/cases';
import type { GameState } from '../types';
import { otherCase, testCase } from './fixtures';

const cases = indexCases([testCase, otherCase]);
let now = 1_000_000;
const clock = () => now;
const reducer = createReducer(cases, clock);
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reducer, s);
/** Avance le temps fictif et vide la file de livraison. */
const advance = (s: GameState, ms = 10_000) => {
  now += ms;
  return reducer(s, { type: 'tick' });
};
const thread = (s: GameState, t: string) => (s.cases['test-case'].threads[t] ?? []).map((e) => e.messageId);
const count = (s: GameState, id: string) =>
  Object.values(s.cases['test-case'].threads).flat().filter((e) => e.messageId === id).length;

let s0: GameState;
beforeEach(() => {
  now = 1_000_000;
  s0 = run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: 'test-case' });
});

describe('contenu', () => {
  it('le registre réel et la fixture sont valides', () => {
    expect(validateRegistry(CASES)).toEqual([]);
    expect(validateRegistry([testCase, otherCase])).toEqual([]);
  });
});

describe('acceptation', () => {
  it("initialise l'affaire une seule fois", () => {
    expect(s0.activeCaseId).toBe('test-case');
    expect(s0.cases['test-case'].status).toBe('active');
    expect(thread(s0, 't1')).toEqual(['m-open']);
    const again = run(s0, { type: 'case/accept', caseId: 'test-case' });
    expect(again).toBe(s0);
  });
  it('une seule enquête active à la fois', () => {
    const s = run(s0, { type: 'case/accept', caseId: 'other-case' });
    expect(s.cases['other-case'].status).toBe('new');
    expect(s.activeCaseId).toBe('test-case');
  });
  it('garder pour plus tard ne déclenche rien', () => {
    const s = run(initialState(cases), { type: 'case/postpone', caseId: 'test-case' });
    expect(s.cases['test-case'].status).toBe('postponed');
    expect(s.activeCaseId).toBeNull();
    expect(run(s, { type: 'case/accept', caseId: 'test-case' }).cases['test-case'].status).toBe('active');
  });
  it('un média consulté avant acceptation compte après', () => {
    let s = run(initialState(cases), { type: 'media/view', caseId: 'test-case', mediaId: 'img' });
    s = run(s, { type: 'case/accept', caseId: 'test-case' });
    expect(evaluate({ mediaViewed: 'img' }, s, 'test-case')).toBe(true);
  });
});

describe('ordre des conditions', () => {
  it('observation puis réponse', () => {
    let s = run(s0, { type: 'observation/found', caseId: 'test-case', observationId: 'o1' });
    expect(s.cases['test-case'].firedRules).not.toContain('r-order');
    s = run(s, { type: 'reply/send', caseId: 'test-case', replyId: 'q1' });
    s = advance(s);
    s = advance(s);
    expect(count(s, 'm-final')).toBe(1);
    expect(s.cases['test-case'].stepId).toBe('s2');
  });
  it('réponse puis observation', () => {
    let s = run(s0, { type: 'reply/send', caseId: 'test-case', replyId: 'q1' });
    s = advance(s);
    expect(s.cases['test-case'].firedRules).not.toContain('r-order');
    s = run(s, { type: 'observation/found', caseId: 'test-case', observationId: 'o1' });
    s = advance(s);
    expect(count(s, 'm-final')).toBe(1);
    expect(thread(s, 't1')).toEqual(['m-open', 'reply:q1', 'm-ans', 'm-final']);
  });
  it("une observation débloque la question associée", () => {
    expect(availableReplies(testCase, s0, 't1').map((r) => r.id)).toEqual(['q1']);
    const s = run(s0, { type: 'observation/found', caseId: 'test-case', observationId: 'o1' });
    expect(availableReplies(testCase, s, 't1').map((r) => r.id)).toEqual(['q1', 'q-ask']);
  });
});

describe('événement unique', () => {
  it('ne se répète pas après changement de réglage, rechargement ni remontage', () => {
    const toTime = (s: GameState) =>
      run(s, { type: 'settings/update', patch: { clockAuto: false, manualDate: '2014-11-18', manualTime: '03:17' } });
    let s = toTime(s0);
    expect(s.cases['test-case'].mediaVariants.img).toBe('v2');
    expect(s.overrides.wallpaper?.value).toBe('/test/wall.jpg');
    expect(s.cases['test-case'].log.filter((l) => l.text === 'heure')).toHaveLength(1);
    // effet temporaire annulé proprement
    s = run(s, { type: 'settings/update', patch: { manualTime: '03:18' } });
    expect(s.overrides.wallpaper).toBeUndefined();
    // retour à 03:17 : la règle ne se redéclenche pas
    s = toTime(s);
    s = run(s, { type: 'settings/update', patch: { clockAuto: true } });
    s = toTime(s);
    // rechargement
    s = deserialize(serialize(s), cases).state;
    s = toTime(run(s, { type: 'settings/update', patch: { manualTime: '00:00' } }));
    expect(s.cases['test-case'].log.filter((l) => l.text === 'heure')).toHaveLength(1);
    expect(s.overrides.wallpaper).toBeUndefined();
  });
  it('une règle répétable se déclenche sur chaque front montant', () => {
    let s = s0;
    for (let i = 0; i < 3; i++) {
      s = run(s, { type: 'settings/update', patch: { airplane: true } });
      s = run(s, { type: 'settings/update', patch: { airplane: false } });
    }
    expect(s.cases['test-case'].log.filter((l) => l.text === 'avion')).toHaveLength(3);
  });
});

describe('mode avion et reconnexion', () => {
  it('suspend les échanges puis reprend sans doublon', () => {
    let s = run(s0, { type: 'settings/update', patch: { airplane: true } });
    // message « surnaturel » livré malgré le mode avion
    s = advance(s);
    expect(count(s, 'm-ghost')).toBe(1);
    // envoi bloqué → réponse préparée
    s = run(s, { type: 'reply/send', caseId: 'test-case', replyId: 'q1' });
    expect(s.cases['test-case'].sentReplies).toEqual([]);
    expect(s.cases['test-case'].preparedReply).toBe('q1');
    // livraison réseau en attente
    s = run(s, { type: 'observation/file', caseId: 'test-case', observationId: 'o1' });
    s = advance(s);
    s = advance(s);
    expect(count(s, 'm-net')).toBe(0);
    expect(s.cases['test-case'].deliveredMails).toEqual([]);
    expect(s.queue).toHaveLength(2);
    // bascules répétées + rechargement : rien ne double
    s = run(s, { type: 'settings/update', patch: { airplane: false } });
    s = run(s, { type: 'settings/update', patch: { airplane: true } });
    s = deserialize(serialize(s), cases).state;
    s = run(s, { type: 'settings/update', patch: { airplane: false } });
    s = advance(s);
    s = advance(s);
    s = advance(s);
    expect(count(s, 'm-net')).toBe(1);
    expect(s.cases['test-case'].deliveredMails).toEqual(['test-mail-2']);
    expect(s.queue).toHaveLength(0);
    // la réponse préparée s'envoie une seule fois, même en double appui
    s = run(s, { type: 'reply/send', caseId: 'test-case', replyId: 'q1' }, { type: 'reply/send', caseId: 'test-case', replyId: 'q1' });
    expect(thread(s, 't1').filter((x) => x === 'reply:q1')).toHaveLength(1);
    s = advance(s);
    expect(count(s, 'm-ans')).toBe(1);
    expect(count(s, 'm-ghost')).toBe(1);
  });
});

describe('sauvegarde', () => {
  it('aller-retour identique (hors notifications)', () => {
    let s = run(
      s0,
      { type: 'observation/file', caseId: 'test-case', observationId: 'o1' },
      { type: 'hint/reveal', caseId: 'test-case', stepId: 's1' },
      { type: 'copy/save', caseId: 'test-case', mediaId: 'img', variantId: 'v1', src: '/test/v1.jpg', name: 'img.jpg' },
      { type: 'note/upsert', note: { id: 'n1', title: 'T', body: 'B', createdAt: 1, updatedAt: 1 } },
    );
    s = advance(s);
    const restored = deserialize(serialize(s), cases).state;
    expect(restored).toEqual({ ...s, notifications: [] });
  });
  it('les copies conservées restent figées', () => {
    let s = run(s0, { type: 'copy/save', caseId: 'test-case', mediaId: 'img', variantId: 'v1', src: '/test/v1.jpg', name: 'img.jpg' });
    s = run(s, { type: 'settings/update', patch: { clockAuto: false, manualDate: '2014-11-18', manualTime: '03:17' } });
    expect(s.cases['test-case'].mediaVariants.img).toBe('v2');
    expect(s.copies[0].src).toBe('/test/v1.jpg');
  });
  it('données invalides : pas de plantage', () => {
    for (const bad of ['{', '"x"', '[]', JSON.stringify({ version: 99 }), JSON.stringify({ version: 1, cases: 4 })]) {
      const r = deserialize(bad, cases);
      expect(r.state.cases['test-case'].status).toBeDefined();
    }
    expect(deserialize('{', cases).warning).toBeTruthy();
  });
  it("migration v0 et ajout d'une enquête sans perdre l'introduction ni les préférences", () => {
    const legacy = JSON.stringify({ introDone: true, settings: { sound: false, largeText: true }, notes: [{ id: 'n', title: 'a', body: '', createdAt: 0, updatedAt: 0 }] });
    const r = deserialize(legacy, cases);
    expect(r.warning).toBeUndefined();
    expect(r.state.introDone).toBe(true);
    expect(r.state.settings.sound).toBe(false);
    expect(r.state.settings.largeText).toBe(true);
    expect(r.state.notes).toHaveLength(1);
    expect(r.state.cases['test-case'].status).toBe('new');
    // Une sauvegarde faite sans enquête reçoit la nouvelle enquête au chargement.
    const empty = indexCases([]);
    const before = deserialize(null, empty).state;
    const after = deserialize(serialize({ ...before, introDone: true }), cases).state;
    expect(after.introDone).toBe(true);
    expect(Object.keys(after.cases)).toEqual(['test-case', 'other-case']);
  });
});

describe('résolution', () => {
  it("termine l'affaire, libère le téléphone et autorise la suivante", () => {
    let s = run(s0, { type: 'settings/update', patch: { clockAuto: false, manualDate: '2014-11-18', manualTime: '03:17' } });
    expect(s.overrides.wallpaper).toBeDefined();
    // un drapeau posé par un effet → solveCase
    s = { ...s, cases: { ...s.cases, 'test-case': { ...s.cases['test-case'], flags: { done: true } } } };
    s = run(s, { type: 'tick' }, { type: 'hint/reveal', caseId: 'test-case', stepId: 's1' });
    expect(s.cases['test-case'].status).toBe('solved');
    expect(s.activeCaseId).toBeNull();
    expect(s.overrides.wallpaper).toBeUndefined();
    s = run(s, { type: 'case/accept', caseId: 'other-case' });
    expect(s.activeCaseId).toBe('other-case');
  });
});
