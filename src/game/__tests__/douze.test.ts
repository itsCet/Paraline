/** « 12 % » : batterie en temps réel, le lieu, « Hugo », et les quatre fins. */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { initialState } from '../save';
import type { GameState } from '../types';
import { douzePourcent as def } from '../../content/cases/douze-pourcent';

const ID = def.id;
const cases = indexCases([def]);
let now = Date.parse('2026-11-22T23:45:00');
const reducer = createReducer(cases, () => now);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
/** Avance le temps par pas de 2 s. */
const wait = (s: GameState, ms: number) => {
  for (let t = 0; t < ms; t += 2000) {
    now += 2000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const replies = (s: GameState) => def.threads.flatMap((t) => availableReplies(def, s, t.id)).map((r) => r.id);
const send = (s: GameState, id: string, ms = 15000) => {
  expect(replies(s)).toContain(id);
  return wait(run(s, { type: 'reply/send', caseId: ID, replyId: id }), ms);
};
const find = (s: GameState, mediaId: string, ...obs: string[]) =>
  run(s, { type: 'media/view', caseId: ID, mediaId }, ...obs.map((observationId) => ({ type: 'observation/found' as const, caseId: ID, observationId })));
const p = (s: GameState) => s.cases[ID];
const got = (s: GameState, id: string) => Object.values(p(s).threads).flat().some((e) => e.messageId === id);
const bat = (s: GameState) => p(s).flags.batterie;
const ending = (s: GameState) => def.endings!.find((e) => {
  // évaluation identique à celle du dossier
  return (function ev(c: unknown): boolean {
    const x = c as Record<string, unknown>;
    if ('all' in x) return (x.all as unknown[]).every(ev);
    if ('flag' in x) return x.equals === undefined ? Boolean(p(s).flags[x.flag as string]) : p(s).flags[x.flag as string] === x.equals;
    return false;
  })(e.when);
})?.title;

let s0: GameState;
beforeEach(() => {
  now = Date.parse('2026-11-22T23:45:00');
  s0 = wait(run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: ID }), 10000);
});

/** Chemin économe : prévenir, photo, soupirail, Jean-Bouin. */
function jusquAuLieu(s: GameState) {
  s = send(s, 'r-gend', 20000);
  expect(got(s, 'g-4')).toBe(true); // liste des piscines
  s = send(s, 'r-photo');
  s = find(s, 'piece', 'soupirail', 'b14');
  s = send(s, 'r-soupirail');
  s = find(s, 'dehors', 'toboggan', 'clocher');
  return send(s, 'g-r-bouin', 5000);
}

describe('12 %', () => {
  it('démarre à 12 % et perd 1 % toutes les 50 s ; chaque demande coûte', () => {
    expect(got(s0, 'l-3')).toBe(true);
    expect(bat(s0)).toBe(12);
    let s = wait(s0, 52000);
    expect(bat(s)).toBe(11);
    s = send(s, 'r-gend', 6000); // texte : 1 %
    expect(bat(s)).toBe(10);
    s = send(s, 'r-photo', 2000); // photo : 2 %
    expect(bat(s)).toBe(8);
  });

  it('une absence ne coûte qu’un cran', () => {
    now += 10 * 60000; // dix minutes sans tick
    const s = run(s0, { type: 'tick' });
    expect(bat(s)).toBe(11);
  });

  it('Retrouvée : lieu donné, B-14, Hugo démasqué et signalé', () => {
    let s = send(s0, 'r-qui'); // « la seule famille qui me reste »
    s = jusquAuLieu(s);
    expect(p(s).flags.lieu).toBe('ok');
    s = send(s, 'g-r-b14', 2000);
    s = wait(s, 34000); // B-14 : les secours vont droit au local
    expect(got(s, 'g-trouvee-vite')).toBe(true);
    s = wait(s, 30000);
    expect(p(s).status).toBe('solved');
    expect(ending(s)).toBe('Retrouvée');
  });

  it('« Hugo » se démasque ; le signaler change la conclusion', () => {
    let s = send(s0, 'r-qui');
    s = send(s, 'r-gend', 20000);
    s = wait(s, 45000);
    expect(got(s, 'h-2')).toBe(true);
    expect(replies(s)).not.toContain('h-r-donner'); // il ne sait encore rien
    s = send(s, 'h-r-accuse', 8000);
    expect(p(s).flags['hugo-demasque']).toBe(true);
    expect(replies(s)).not.toContain('h-r-donner');
    s = send(s, 'g-r-hugo', 5000);
    s = send(s, 'r-photo');
    s = find(s, 'piece', 'soupirail');
    s = send(s, 'r-soupirail');
    s = find(s, 'dehors', 'clocher');
    s = send(s, 'g-r-bouin', 120000);
    expect(p(s).status).toBe('solved');
    expect(def.endings!.find((e) => e.title === 'Retrouvée' && JSON.stringify(e.when).includes('hugo-signale'))).toBeTruthy();
    expect(p(s).flags['hugo-signale']).toBe(true);
  });

  it('Il est arrivé avant : le lieu donné à « Hugo »', () => {
    let s = send(s0, 'r-gend', 20000);
    s = send(s, 'r-photo');
    s = find(s, 'piece', 'soupirail');
    s = send(s, 'r-soupirail');
    s = find(s, 'dehors', 'clocher');
    s = wait(s, 40000);
    s = send(s, 'h-r-donner', 60000);
    expect(got(s, 'l-lui')).toBe(true);
    expect(p(s).flags.fin).toBe('hugo');
    expect(p(s).status).toBe('solved');
    expect(ending(s)).toBe('Il est arrivé avant');
  });

  it('1 % puis dernier indice : retrouvée au petit matin', () => {
    let s = send(s0, 'r-gend', 20000);
    s = wait(s, 12 * 50000);
    expect(bat(s)).toBe(1);
    expect(got(s, 'l-1pc-b')).toBe(true);
    expect(replies(s)).not.toContain('r-photo'); // un seul message possible
    s = send(s, 'r-dernier', 10000);
    expect(p(s).flags.off).toBe(true);
    s = send(s, 'g-r-bouin', 40000);
    expect(got(s, 'g-trouvee-matin')).toBe(true);
    s = wait(s, 30000);
    expect(p(s).status).toBe('solved');
    expect(ending(s)).toBe('Au petit matin');
  });

  it('1 % puis message pour Camille : elle y va seule', () => {
    let s = send(s0, 'r-gend', 20000);
    s = wait(s, 12 * 50000);
    s = send(s, 'r-camille', 10000);
    expect(got(s, 'c-0')).toBe(true);
    s = send(s, 'c-r-transmettre', 15000);
    expect(got(s, 'c-3')).toBe(true);
    s = wait(s, 95000);
    expect(p(s).status).toBe('solved');
    expect(p(s).flags.fin).toBe('message');
  });
});
