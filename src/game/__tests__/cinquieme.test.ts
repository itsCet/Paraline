/** « Le cinquième » : groupe, fils privés, blocage, Téléphone, date, trois fins. */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, currentObstacle, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { deserialize, initialState, serialize } from '../save';
import type { GameState, Settings } from '../types';
import { leCinquieme as def } from '../../content/cases/le-cinquieme';

const ID = def.id;
const cases = indexCases([def]);
let now = 1_000_000;
const reducer = createReducer(cases, () => now);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const flush = (s: GameState, rounds = 30) => {
  for (let i = 0; i < rounds; i++) {
    now += 4000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => flush(run(s, { type: 'settings/update', patch }));
const send = (s: GameState, replyId: string) => {
  expect(replies(s).map((r) => r.id)).toContain(replyId);
  return flush(run(s, { type: 'reply/send', caseId: ID, replyId }));
};
const find = (s: GameState, mediaId: string, observationId: string) =>
  run(s, { type: 'media/view', caseId: ID, mediaId }, { type: 'observation/found', caseId: ID, observationId });
const p = (s: GameState) => s.cases[ID];
const got = (s: GameState, id: string) => Object.values(p(s).threads).flat().some((e) => e.messageId === id);
const replies = (s: GameState) => def.threads.flatMap((t) => availableReplies(def, s, t.id));

let s0: GameState;
beforeEach(() => {
  now = 1_000_000;
  s0 = flush(run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: ID }));
});

/** Actes 1 et 2 jusqu'au blocage de Julien. */
function jusquAuBlocage(s: GameState) {
  s = find(s, 'ponton', 'silhouette-ponton');
  s = send(s, 'g-ponton');
  s = send(s, 'g-chalet');
  s = find(s, 'annonce', 'annonce-livre');
  s = send(s, 's-livre');
  s = find(s, 'livre-dor', 'empreinte');
  s = send(s, 'm-cinq');
  s = send(s, 'i-qui');
  s = send(s, 'i-glace');
  return send(s, 'j-glace');
}

/** Jusqu'au choix de la fin, avec l'aveu de Julien. */
function jusquAuChoix(s: GameState) {
  s = jusquAuBlocage(s);
  s = set(s, { clockAuto: false, manualDate: '2014-02-15', manualTime: '02:14' });
  s = send(s, 'j-pari');
  s = find(s, 'derniere-photo', 'ils-partent');
  return send(s, 'g-derniere');
}

describe('le cinquième', () => {
  it('le groupe : quatre interlocuteurs dans un seul fil, Sarah en privé', () => {
    expect(p(s0).threads['t-groupe'].length).toBe(5);
    expect(new Set(p(s0).threads['t-groupe'].map((e) => def.messages.find((m) => m.id === e.messageId)!.from)).size).toBe(4);
    expect(got(s0, 'sarah-p1')).toBe(true);
    expect(p(s0).grantedMedia).toEqual(expect.arrayContaining(['groupe', 'ponton', 'cartes']));
  });

  it('confrontation par preuves : les réponses n’apparaissent qu’avec la preuve', () => {
    expect(replies(s0).map((r) => r.id)).not.toContain('g-ponton');
    const s = find(s0, 'cartes', 'heure-cartes');
    expect(replies(s).map((r) => r.id)).toContain('g-soiree');
    expect(replies(s).map((r) => r.id)).not.toContain('g-ponton');
  });

  it('Malik quitte le groupe et écrit en privé', () => {
    let s = send(find(s0, 'ponton', 'silhouette-ponton'), 'g-ponton');
    expect(got(s, 'sys-malik')).toBe(true);
    expect(got(s, 'malik-p2')).toBe(true);
    expect(availableReplies(def, s, 't-malik')).toEqual([]);
    s = send(find(s, 'cartes', 'heure-cartes'), 'm-cartes');
    expect(got(s, 'malik-cartes')).toBe(true);
  });

  it('Julien bloque, puis Théo se retourne sur toutes les photos et Julien débloque', () => {
    let s = run(jusquAuBlocage(s0));
    expect(p(s).flags.bloque).toBe(true);
    expect(p(s).flags.tourne).toBe(true);
    expect(['groupe', 'cartes', 'ponton'].map((m) => p(s).mediaVariants[m])).toEqual(['face', 'face', 'face']);
    expect(s.overrides.extraApp?.value).toBe('telephone');
    expect(p(s).grantedMedia).toContain('messagerie');
    expect(got(s, 'julien-debloque2')).toBe(true);
    expect(availableReplies(def, s, 't-julien').map((r) => r.id)).toEqual(['j-pari']);
  });

  it('une copie conservée garde Théo de dos', () => {
    let s = run(s0, { type: 'copy/save', caseId: ID, mediaId: 'groupe', variantId: 'dos', src: '/media/cases/le-cinquieme/groupe.jpg', name: 'IMG_2041.jpg' });
    s = jusquAuBlocage(s);
    expect(s.copies[0].variantId).toBe('dos');
  });

  it('la dernière photo : uniquement après l’acte 3, à 02:14 le 15 (ou le 14) février 2014', () => {
    let s = set(s0, { clockAuto: false, manualDate: '2014-02-15', manualTime: '02:14' });
    expect(p(s).grantedMedia).not.toContain('derniere-photo');
    s = jusquAuBlocage(set(s, { manualTime: '02:15' }));
    expect(p(s).grantedMedia).not.toContain('derniere-photo');
    s = set(s, { manualDate: '2014-02-14', manualTime: '02:14' });
    expect(p(s).grantedMedia).toContain('derniere-photo');
  });

  it('fin complète : les quatre ensemble, Léna, le reflet', () => {
    let s = jusquAuChoix(s0);
    expect(got(s, 'julien-groupe')).toBe(true);
    s = send(s, 'f-ensemble');
    expect(got(s, 'ines-vocal2')).toBe(true);
    expect(p(s).grantedMedia).toEqual(expect.arrayContaining(['lena-vocal', 'reflet']));
    expect(p(s).status).toBe('solved');
    expect(s.overrides).toEqual({});
    expect(replies(s)).toEqual([]);
  });

  it('sans l’aveu de Julien, la fin complète n’est pas proposée', () => {
    let s = jusquAuBlocage(s0);
    s = set(s, { clockAuto: false, manualDate: '2014-02-15', manualTime: '02:14' });
    s = send(find(s, 'derniere-photo', 'ils-partent'), 'g-derniere');
    expect(got(s, 'ines-lena2')).toBe(true);
    expect(currentObstacle(def, s)?.id).toBe('aveu');
    const ids = availableReplies(def, s, 't-groupe').map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['f-moi', 'f-personne']));
    expect(ids).not.toContain('f-ensemble');
  });

  it('fin « à leur place » : le mail de Léna clôt l’affaire une fois lu', () => {
    let s = send(jusquAuChoix(s0), 'f-moi');
    expect(p(s).deliveredMails).toContain('lena-mail');
    expect(p(s).status).toBe('active');
    s = flush(run(s, { type: 'mail/read', mailId: 'lena-mail' }));
    expect(p(s).status).toBe('solved');
    expect(availableReplies(def, s, 't-groupe')).toEqual([]);
  });

  it('fin sans apaisement : Théo reste sur les photos ; sauvegarde rechargée', () => {
    let s = send(jusquAuChoix(s0), 'f-personne');
    expect(p(s).status).toBe('solved');
    s = deserialize(serialize(s), cases).state;
    expect(p(s).mediaVariants.groupe).toBe('face');
    expect(p(s).firedRules).toContain('fin-personne');
  });
});
