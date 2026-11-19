/**
 * « La chambre condamnée » : parcours complets et cas limites, sans indice.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, currentObstacle, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { deserialize, initialState, serialize } from '../save';
import type { GameState, Settings } from '../types';
import { chambreCondamnee as def } from '../../content/cases/chambre-condamnee';

const ID = def.id;
const cases = indexCases([def]);
let now = 1_000_000;
const reducer = createReducer(cases, () => now);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
/** Fait passer le temps fictif pour vider la file de livraison. */
const flush = (s: GameState, rounds = 12) => {
  for (let i = 0; i < rounds; i++) {
    now += 4000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => flush(run(s, { type: 'settings/update', patch }));
const reload = (s: GameState) => deserialize(serialize(s), cases).state;
const p = (s: GameState) => s.cases[ID];
const variant = (s: GameState) => p(s).mediaVariants.capture ?? 'fermee';
const delivered = (s: GameState, id: string) => Object.values(p(s).threads).flat().filter((e) => e.messageId === id).length;
const replies = (s: GameState, t: string) => availableReplies(def, s, t).map((r) => r.id);
const send = (s: GameState, replyId: string) => flush(run(s, { type: 'reply/send', caseId: ID, replyId }));
const found = (s: GameState, observationId: string) => run(s, { type: 'observation/found', caseId: ID, observationId });

const at0317 = { clockAuto: false, manualDate: '2026-11-19', manualTime: '03:17' };
const night = { clockAuto: false, manualDate: '2014-11-18', manualTime: '03:17' };

let s0: GameState;
beforeEach(() => {
  now = 1_000_000;
  s0 = run(initialState(cases), { type: 'intro/complete' });
});

describe('arrivée de l’affaire', () => {
  it('rien ne démarre avant acceptation ; report puis acceptation', () => {
    let s = run(s0, { type: 'media/view', caseId: ID, mediaId: 'capture' });
    s = set(s, at0317);
    expect(p(s).status).toBe('new');
    expect(variant(s)).toBe('fermee'); // aucune anomalie avant acceptation
    s = run(s, { type: 'case/postpone', caseId: ID });
    expect(p(s).status).toBe('postponed');
    s = set(run(s, { type: 'case/accept', caseId: ID }), {});
    expect(p(s).status).toBe('active');
    expect(delivered(s, 'e-bonjour')).toBe(1);
    // déjà à 03:17 au moment d'accepter : la découverte est récompensée
    expect(variant(s)).toBe('instable');
    expect(p(s).viewedMedia).toContain('capture');
  });
});

describe('énigme 1 : l’heure', () => {
  let s: GameState;
  beforeEach(() => {
    s = flush(run(s0, { type: 'case/accept', caseId: ID }));
  });
  it('fonctionne sans avoir lu le document comparatif', () => {
    expect(delivered(s, 'e-c3')).toBe(0);
    s = set(s, at0317);
    expect(variant(s)).toBe('instable');
    expect(s.notifications.some((n) => n.title === 'capture_0317.jpg')).toBe(true);
  });
  it('quitter 03:17 avant la copie ramène la porte fermée, sans rien effacer', () => {
    s = found(set(s, at0317), 'feuille-instable');
    s = set(s, { manualTime: '03:18' });
    expect(variant(s)).toBe('fermee');
    expect(p(s).foundObservations).toContain('feuille-instable');
    expect(replies(s, 't-elise')).toContain('q-garder');
    s = set(s, { manualTime: '03:17' });
    expect(variant(s)).toBe('instable');
  });
  it('les questions de contexte ne sont pas obligatoires', () => {
    s = set(s, at0317);
    s = set(s, { airplane: true });
    expect(variant(s)).toBe('lisible');
  });
});

describe('énigme 2 : stabiliser', () => {
  let s: GameState;
  beforeEach(() => {
    s = flush(run(s0, { type: 'case/accept', caseId: ID }));
  });
  it('mode avion trop tôt : on garde la dernière image, sans pénalité', () => {
    s = set(s, { airplane: true });
    s = set(s, at0317);
    expect(variant(s)).toBe('fermee');
    s = set(s, { airplane: false });
    expect(variant(s)).toBe('instable');
    s = set(s, { airplane: true });
    expect(variant(s)).toBe('lisible');
  });
  it('la copie lisible est immuable et survit à la reconnexion', () => {
    s = set(set(s, at0317), { airplane: true });
    const v = def.media.find((m) => m.id === 'capture')!.variants.lisible;
    s = run(s, { type: 'copy/save', caseId: ID, mediaId: 'capture', variantId: 'lisible', src: v.src, name: 'capture_0317.jpg' });
    s = found(s, 'feuille-lisible');
    expect(p(s).filedObservations).toContain('feuille-lisible'); // faits relevés
    s = set(s, { airplane: false });
    expect(variant(s)).toBe('instable');
    s = set(s, { clockAuto: true });
    expect(variant(s)).toBe('fermee');
    expect(s.copies).toHaveLength(1);
    expect(s.copies[0].variantId).toBe('lisible');
    expect(reload(s).copies[0].variantId).toBe('lisible');
  });
  it('hors ligne, la question sur G. Vannier reste préparée puis part une seule fois', () => {
    s = found(set(set(s, at0317), { airplane: true }), 'feuille-lisible');
    s = send(s, 'q-vannier');
    expect(p(s).preparedReply).toBe('q-vannier');
    expect(delivered(s, 'e-e1')).toBe(0);
    s = set(s, { airplane: false });
    s = send(run(s, { type: 'reply/send', caseId: ID, replyId: 'q-vannier' }), 'q-vannier');
    expect(delivered(s, 'e-e1')).toBe(1);
    expect(delivered(s, 'e-e3')).toBe(1);
  });
  it('les messages d’Élise envoyés hors ligne arrivent une seule fois à la reconnexion', () => {
    s = send(s, 'q-change');
    s = run(s, { type: 'reply/send', caseId: ID, replyId: 'q-alim' });
    s = set(s, { airplane: true });
    const before = delivered(s, 'e-a1');
    s = set(s, { airplane: false });
    s = set(s, { airplane: true });
    s = set(reload(s), { airplane: false });
    expect(before + delivered(s, 'e-a1')).toBeGreaterThanOrEqual(1);
    expect(delivered(s, 'e-a1')).toBe(1);
    expect(delivered(s, 'e-a2')).toBe(1);
  });
});

describe('énigme 3 et réponse', () => {
  let s: GameState;
  beforeEach(() => {
    s = flush(run(s0, { type: 'case/accept', caseId: ID }));
  });
  it('Gabriel arrive avant l’article ; l’aide oriente vers l’identification', () => {
    s = set(s, night);
    expect(delivered(s, 'g-1') + delivered(s, 'g-2') + delivered(s, 'g-3')).toBe(3);
    expect(replies(s, 't-gabriel')).toEqual(['g-r-qui', 'g-r-sortez', 'g-r-verifier']);
    // il manque la lecture de la feuille puis l'article
    expect(currentObstacle(def, s)?.id).toBe('lire');
    s = set(set(s, { airplane: true }), {});
    s = found(s, 'feuille-lisible');
    expect(currentObstacle(def, s)?.id).toBe('identifier');
  });
  it('interruption du contact puis rétablissement sans doublon', () => {
    s = set(s, night);
    s = run(s, { type: 'reply/send', caseId: ID, replyId: 'g-r-qui' });
    s = set(s, { manualDate: '2014-11-19' }); // mauvaise date : plus d'émission
    expect(delivered(s, 'g-qui')).toBe(0);
    expect(replies(s, 't-gabriel')).toEqual([]);
    expect(delivered(s, 'g-3')).toBe(1); // historique conservé
    s = set(reload(s), { manualDate: '2014-11-18' });
    expect(delivered(s, 'g-qui')).toBe(1);
    expect(delivered(s, 'g-1')).toBe(1);
    s = set(s, { airplane: true });
    s = set(s, { airplane: false });
    expect(delivered(s, 'g-1')).toBe(1);
  });
  it('mauvaise réponse puis correction ; fin seulement au retour en automatique', () => {
    s = run(s, { type: 'media/view', caseId: ID, mediaId: 'article' });
    s = set(s, night);
    expect(replies(s, 't-gabriel')).toContain('g-r-sortis');
    s = send(s, 'g-r-sortis');
    expect(replies(s, 't-gabriel')).toEqual(['g-r-qui', 'g-r-sortez', 'g-r-verifier', 'g-r-temoignage', 'g-r-avec']);
    s = send(s, 'g-r-avec');
    expect(delivered(s, 'g-passez')).toBe(1);
    expect(replies(s, 't-gabriel')).toContain('g-r-corrige');
    expect(replies(s, 't-gabriel')).not.toContain('g-r-temoignage');
    s = send(s, 'g-r-corrige');
    expect(delivered(s, 'g-lacher2')).toBe(1);
    expect(p(s).flags['echange-termine']).toBe(true);
    expect(variant(s)).toBe('ouverte');
    expect(p(s).status).toBe('active'); // pas encore résolue
    expect(replies(s, 't-gabriel')).toEqual([]);
    expect(currentObstacle(def, s)?.id).toBe('terminer');
    // changer de date sans revenir en automatique ne termine pas
    s = set(s, { manualDate: '2026-11-19', manualTime: '10:00' });
    expect(p(s).status).toBe('active');
    expect(variant(s)).toBe('ouverte');
    s = set(s, { clockAuto: true });
    expect(p(s).status).toBe('solved');
    expect(variant(s)).toBe('mur');
    expect(delivered(s, 'e-f3')).toBe(1);
    expect(replies(s, 't-elise')).toEqual(['q-fin']);
    s = send(s, 'q-fin');
    expect(delivered(s, 'e-merci')).toBe(1);
    s = flush(s, 4);
    expect(p(s).deliveredMails).toEqual(['cc-brouillon']);
  });
  it('après résolution, rien ne se rejoue', () => {
    s = run(s, { type: 'media/view', caseId: ID, mediaId: 'article' });
    s = send(send(set(s, night), 'g-r-sortis'), 'g-r-temoignage');
    s = set(s, { clockAuto: true });
    expect(p(s).status).toBe('solved');
    const snapshot = JSON.stringify(p(s).threads);
    s = set(s, night);
    s = set(s, { airplane: true });
    s = set(s, { airplane: false, manualDate: '2026-11-19' });
    s = reload(s);
    s = set(s, at0317);
    expect(variant(s)).toBe('mur');
    expect(JSON.stringify(p(s).threads)).toBe(snapshot);
    expect(run(s, { type: 'hint/reveal', caseId: ID, stepId: 'terminer' })).toBe(s);
  });
});

describe('ajouts narratifs', () => {
  it('alerte d’Élise unique, réaction à la porte ouverte, copie barrée au dénouement seulement', () => {
    let s = flush(run(s0, { type: 'case/accept', caseId: ID }));
    s = set(s, at0317);
    expect(delivered(s, 'e-alerte1')).toBe(1);
    expect(delivered(s, 'e-alerte3')).toBe(1);
    s = set(set(s, { manualTime: '03:18' }), { manualTime: '03:17' });
    expect(delivered(s, 'e-alerte1')).toBe(1); // jamais répétée
    s = set(s, { airplane: true });
    const v = def.media.find((m) => m.id === 'capture')!.variants.lisible;
    s = run(s, { type: 'copy/save', caseId: ID, mediaId: 'capture', variantId: 'lisible', src: v.src, name: 'capture_0317.jpg' });
    s = set(run(s, { type: 'media/view', caseId: ID, mediaId: 'article' }), { airplane: false });
    s = send(send(set(s, night), 'g-r-sortis'), 'g-r-temoignage');
    expect(delivered(s, 'e-ouverte')).toBe(1);
    expect(s.copies[0].variantId).toBe('lisible'); // intacte tant que l'affaire n'est pas close
    s = set(s, { clockAuto: true });
    expect(s.copies[0].variantId).toBe('barree');
    expect(s.copies[0].src).toBe(v.src);
    expect(reload(s).copies[0].variantId).toBe('barree');
  });
});

describe('sauvegarde', () => {
  it('rechargement à chaque étape du parcours complet', () => {
    let s = reload(flush(run(s0, { type: 'case/accept', caseId: ID })));
    s = reload(send(s, 'q-change'));
    s = reload(run(s, { type: 'media/view', caseId: ID, mediaId: 'comparaison' }));
    s = reload(set(s, at0317));
    expect(variant(s)).toBe('instable');
    s = reload(found(s, 'feuille-instable'));
    s = reload(send(s, 'q-garder'));
    s = reload(set(s, { airplane: true }));
    expect(variant(s)).toBe('lisible');
    s = reload(found(s, 'feuille-lisible'));
    s = reload(set(s, { airplane: false }));
    s = reload(send(s, 'q-vannier'));
    s = reload(run(s, { type: 'media/view', caseId: ID, mediaId: 'article' }));
    s = reload(set(s, night));
    s = reload(send(s, 'g-r-sortis'));
    s = reload(send(s, 'g-r-temoignage'));
    expect(variant(s)).toBe('ouverte');
    s = reload(set(s, { clockAuto: true }));
    expect(p(s).status).toBe('solved');
    expect(s.introDone).toBe(true);
    for (const id of ['g-1', 'g-3', 'g-ok', 'e-e3', 'e-f1']) expect(delivered(s, id)).toBe(1);
  });
  it('une sauvegarde antérieure reçoit l’affaire sans perdre introduction ni tutoriel', () => {
    const old = initialState(indexCases([]));
    const legacy = serialize({ ...old, introDone: true, tutorial: { ...old.tutorial, status: 'completed', step: 'finish' } });
    const s = deserialize(legacy, cases).state;
    expect(s.introDone).toBe(true);
    expect(s.tutorial.status).toBe('completed');
    expect(p(s).status).toBe('new');
  });
});

describe('aide', () => {
  it('jamais révélée sans demande ; suit le premier obstacle non résolu', () => {
    let s = flush(run(s0, { type: 'case/accept', caseId: ID }));
    expect(p(s).hintsRevealed).toEqual({});
    expect(currentObstacle(def, s)?.id).toBe('image');
    s = run(s, { type: 'hint/reveal', caseId: ID, stepId: 'image' });
    expect(p(s).hintsRevealed.image).toBe(1);
    s = set(s, at0317);
    expect(currentObstacle(def, s)?.id).toBe('lire');
    expect(p(s).hintsRevealed.lire).toBeUndefined();
  });
});
