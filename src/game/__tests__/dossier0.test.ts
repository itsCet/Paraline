/** « Dossier 0 » : notes de Victor, absence du joueur, Récemment supprimés, épreuve « ne bouge plus ». */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, currentObstacle, evaluate, indexCases, resolution } from '../engine';
import { createReducer, type Action } from '../reducer';
import { withRapport } from './rapport-auto';
import { initialState } from '../save';
import type { GameState, Settings } from '../types';
import { dossierZero as def } from '../../content/cases/dossier-0';
import { availableNews } from '../../content/news';

const ID = def.id;
const cases = indexCases([def]);
let now = Date.parse('2026-11-22T22:00:00');
const reducer = withRapport(createReducer(cases, () => now), cases);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const flush = (s: GameState, rounds = 30) => {
  for (let i = 0; i < rounds; i++) {
    now += 4000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => flush(run(s, { type: 'settings/update', patch }));
const send = (s: GameState, id: string) => {
  expect(def.threads.flatMap((t) => availableReplies(def, s, t.id)).map((r) => r.id)).toContain(id);
  return flush(run(s, { type: 'reply/send', caseId: ID, replyId: id }));
};
const find = (s: GameState, mediaId: string, observationId: string) =>
  run(s, { type: 'media/view', caseId: ID, mediaId }, { type: 'observation/found', caseId: ID, observationId });
const view = (s: GameState, mediaId: string) => flush(run(s, { type: 'media/view', caseId: ID, mediaId }));
const p = (s: GameState) => s.cases[ID];
const got = (s: GameState, id: string) => Object.values(p(s).threads).flat().some((e) => e.messageId === id);
const note = (s: GameState, id: string) => s.notes.find((n) => n.id === `${ID}:${id}`);

let s0: GameState;
beforeEach(() => {
  now = Date.parse('2026-11-22T22:00:00');
  s0 = flush(run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: ID }));
});

function jusquALaBascule(s: GameState) {
  s = send(s, 'r-pas-victor');
  s = send(find(s, 'visite-chambre', 'dictaphone'), 'r-dicta');
  return view(s, 'visite-chambre');
}

describe('dossier 0', () => {
  it('ouverture : anciens échanges de Victor, notes datées de 2024', () => {
    expect(p(s0).threads['t-agnes'].length).toBe(7);
    expect(note(s0, 'v1')?.createdAt).toBe(Date.parse('2024-11-08T21:14:00'));
    expect(note(s0, 'v3')).toBeUndefined();
  });

  it('quitter le jeu avant la bascule ne fait rien', () => {
    const s = run(s0, { type: 'app/return', leftAt: now - 60000, awayMs: 60000 });
    expect(note(s, 'absent')).toBeUndefined();
  });

  it('bascule : la chambre change, elle écrit, la lumière baisse', () => {
    const s = jusquALaBascule(s0);
    expect(p(s).mediaVariants['visite-chambre']).toBe('elle');
    expect(p(s).flags.hante).toBe(true);
    expect(got(s, 'i-1')).toBe(true);
    expect(s.overrides.dim?.value).toBe('0.12');
  });

  it('absence : note avec la durée réelle et photo horodatée à l’heure du départ', () => {
    let s = jusquALaBascule(s0);
    const leftAt = now - 192000;
    s = flush(run(s, { type: 'app/return', leftAt, awayMs: 192000 }), 2);
    expect(note(s, 'absent')?.body).toBe('Tu es parti 3 min 12 s.\nJe suis restée.');
    expect(p(s).flags.photo).toBe(leftAt);
    expect(p(s).grantedMedia).toContain('bureau-derriere');
    // Une absence trop courte ne compte pas ; une nouvelle absence remplace la note.
    s = flush(run(s, { type: 'app/return', leftAt: now - 3000, awayMs: 3000 }), 2);
    expect(note(s, 'absent')?.body).toContain('3 min 12 s');
    s = flush(run(s, { type: 'app/return', leftAt: now - 45000, awayMs: 45000 }), 2);
    expect(note(s, 'absent')?.body).toContain('45 s');
    expect(s.notes.filter((n) => n.id === `${ID}:absent`).length).toBe(1);
  });

  it('sans jamais quitter le jeu, la photo arrive quand même', () => {
    const s = flush(jusquALaBascule(s0), 30);
    expect(p(s).grantedMedia).toContain('bureau-derriere');
  });

  it('« Je viens » puis son reflet dans la photo ; Récemment supprimés seulement dans les 30 jours', () => {
    let s = flush(jusquALaBascule(s0), 30);
    s = view(s, 'bureau-derriere');
    expect(got(s, 'i-viens')).toBe(true);
    expect(p(s).mediaVariants['bureau-derriere']).toBe('elle');
    expect(s.overrides.extraApp).toBeUndefined();
    s = set(s, { clockAuto: false, manualDate: '2024-12-16' });
    expect(p(s).grantedMedia).not.toContain('temoignage');
    s = set(s, { manualDate: '2024-11-20' });
    expect(p(s).grantedMedia).toContain('temoignage');
    expect(got(s, 'i-trouvee')).toBe(true);
  });

  function jusquALEpreuve(s: GameState) {
    s = jusquALaBascule(s);
    s = set(s, { clockAuto: false, manualDate: '2024-11-16' });
    s = find(s, 'temoignage', 'entendue');
    return send(s, 'r-envoyer');
  }

  it('l’épreuve démarre après l’envoi ; un sursaut est compté sans la terminer', () => {
    let s = jusquALEpreuve(s0);
    expect(got(s, 'i-bouge')).toBe(true);
    expect(s.overrides.stillness?.value).toBe(ID);
    s = run(s, { type: 'stillness/result', result: 'touched' }, { type: 'stillness/result', result: 'touched' });
    expect(p(s).flags.sursauts).toBe(2);
    expect(s.overrides.stillness).toBeDefined();
  });

  it('rapport : l’affaire n’est résolue qu’avec un rapport juste ; les choix se découvrent', () => {
    const brut = createReducer(cases, () => now);
    let s = jusquALEpreuve(s0);
    s = brut(s, { type: 'stillness/result', result: 'held' });
    for (let i = 0; i < 30; i++) {
      now += 4000;
      s = brut(s, { type: 'tick' });
    }
    // Fin de l'histoire : l'affaire attend le rapport, le téléphone redevient normal, Le Fil ne parle pas encore.
    expect(got(s, 'i-eteindre')).toBe(true);
    expect(p(s).status).toBe('active');
    expect(p(s).flags.rapport).toBe('pret');
    expect(s.overrides).toEqual({});
    expect(availableNews(s, cases).map((n) => n.id)).toEqual(['d0-hessel-un-an']);
    expect(currentObstacle(def, s)?.id).toBe('rapport');
    // Jauge : 0 % au début, toutes les étapes franchies sauf le rapport (7 sur 8).
    expect(resolution(def, s0)).toBe(0);
    expect(resolution(def, send(s0, 'r-pas-victor'))).toBeCloseTo(1 / 8);
    expect(resolution(def, s)).toBeCloseTo(7 / 8);
    // Un choix n'apparaît que s'il a été découvert : le cadre d'enfance n'a pas été touché.
    const support = def.report!.blanks.support.options.filter((o) => !o.requires || evaluate(o.requires, s, ID)).map((o) => o.text);
    expect(support).toContain('un mini-dictaphone');
    expect(support).not.toContain('le dos d’un cadre photo');
    // Mauvais rapport : seulement le nombre de réponses justes.
    const juste = Object.fromEntries(Object.entries(def.report!.blanks).map(([k, b]) => [k, b.answer]));
    s = brut(s, { type: 'report/submit', caseId: ID, answers: { ...juste, coupable: 'Victor Hessel', but: 'se venger de Victor' } });
    expect(p(s).status).toBe('active');
    expect(p(s).flags['rapport:justes']).toBe(2);
    expect(p(s).flags['rapport:essais']).toBe(1);
    // Bon rapport : l'affaire est résolue et l'article paraît.
    s = brut(s, { type: 'report/submit', caseId: ID, answers: juste });
    expect(p(s).status).toBe('solved');
    expect(p(s).flags.rapport).toBe('ok');
    expect(resolution(def, s)).toBe(1);
    expect(availableNews(s, cases).map((n) => n.id)).toContain('d0-affaire-rouverte');
    expect(s.activeCaseId).toBeNull();
  });

  it('tenir 30 secondes : fin complète', () => {
    let s = flush(run(jusquALEpreuve(s0), { type: 'stillness/result', result: 'held' }));
    expect(s.overrides.stillness).toBeUndefined();
    expect(got(s, 'i-eteindre')).toBe(true);
    expect(p(s).grantedMedia).toContain('bureau-matin');
    expect(p(s).status).toBe('solved');
    expect(s.overrides).toEqual({});
    // Le Fil : l'article de réouverture paraît, daté de la résolution, et une notification l'annonce.
    const news = availableNews(s, cases);
    expect(news.map((n) => n.id)).toEqual(['d0-affaire-rouverte', 'd0-hessel-un-an']);
    expect(news[0].at).toBe(p(s).solvedAt);
    expect(news[0].read).toBe(false);
    expect(run(s, { type: 'news/read', articleId: 'd0-affaire-rouverte' }).readNews).toEqual(['d0-affaire-rouverte']);
  });

  it('premier signe : 25 s après l’acceptation, « Tu… » puis un message supprimé', () => {
    expect(got(s0, 'i-0')).toBe(true);
    expect(got(s0, 'i-1')).toBe(false);
  });

  it('Le Fil : seul l’article sur Victor au début', () => {
    expect(availableNews(s0, cases).map((n) => n.id)).toEqual(['d0-hessel-un-an']);
  });

  it('quitter pendant l’épreuve : fin sombre', () => {
    const s = flush(run(jusquALEpreuve(s0), { type: 'stillness/result', result: 'left' }));
    expect(p(s).grantedMedia).toContain('bureau-porte');
    expect(got(s, 'i-parti')).toBe(true);
    expect(p(s).status).toBe('solved');
    // Pas de réouverture dans la presse : l'affaire n'a pas été réussie.
    expect(availableNews(s, cases).map((n) => n.id)).toEqual(['d0-hessel-un-an']);
  });
});
