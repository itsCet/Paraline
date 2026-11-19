/** « Elle écrit dans mes notes » : hantise du téléphone du joueur. */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { deserialize, initialState, serialize } from '../save';
import type { GameState, Settings } from '../types';
import { elleEcrit as def } from '../../content/cases/elle-ecrit';

const ID = def.id;
const cases = indexCases([def]);
let now = 1_000_000;
const reducer = createReducer(cases, () => now);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const flush = (s: GameState, rounds = 20) => {
  for (let i = 0; i < rounds; i++) {
    now += 4000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => flush(run(s, { type: 'settings/update', patch }));
const send = (s: GameState, replyId: string) => flush(run(s, { type: 'reply/send', caseId: ID, replyId }));
const view = (s: GameState, mediaId: string) => flush(run(s, { type: 'media/view', caseId: ID, mediaId }));
const p = (s: GameState) => s.cases[ID];
const delivered = (s: GameState, id: string) => Object.values(p(s).threads).flat().filter((e) => e.messageId === id).length;
const note = (s: GameState, id: string) => s.notes.find((n) => n.id === `${ID}:${id}`);

let s0: GameState;
beforeEach(() => {
  now = 1_000_000;
  s0 = flush(run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: ID }));
});

describe('elle écrit dans mes notes', () => {
  it('rien d’anormal avant l’écoute de l’enregistrement', () => {
    expect(s0.overrides).toEqual({});
    expect(s0.notes).toEqual([]);
  });

  it('la bascule : note, fond d’écran, Dictaphone, Marc soulagé', () => {
    const s = view(s0, 'enregistrement');
    expect(note(s, 'n1')?.body).toBe('C’est toi qui as mon message ?');
    expect(s.overrides.wallpaper?.value).toContain('fond-voiture');
    expect(s.overrides.extraApp?.value).toBe('dictaphone');
    expect(p(s).grantedMedia).toContain('ne-pas-effacer');
    expect(delivered(s, 'marc-plusrien')).toBe(1);
    expect(delivered(s, 'moi-1')).toBe(1);
  });

  it('effacer ses notes : elles reviennent avec une phrase de plus, puis s’arrêtent', () => {
    let s = view(s0, 'enregistrement');
    s = flush(run(s, { type: 'note/delete', id: `${ID}:n1` }));
    expect(note(s, 'n2')?.body).toContain('Ne m’efface pas.');
    s = flush(run(s, { type: 'note/delete', id: `${ID}:n2` }));
    expect(note(s, 'n3')?.body).toContain('Je veux juste rentrer.');
    s = flush(run(s, { type: 'note/delete', id: `${ID}:n3` }));
    expect(s.notes.filter((n) => n.caseId === ID)).toEqual([]);
  });

  it('le mode avion ne l’arrête pas ; le reste reste hors ligne', () => {
    let s = view(s0, 'enregistrement');
    s = set(s, { airplane: true });
    expect(delivered(s, 'moi-2')).toBe(1);
    s = send(s, 'q-origine');
    expect(delivered(s, 'marc-origine1')).toBe(0);
    expect(p(s).preparedReply).toBe('q-origine');
  });

  it('sans le son, le passage inaudible se lit', () => {
    let s = set(s0, { sound: false });
    expect(p(s).mediaVariants.enregistrement).toBe('silence');
    s = set(s, { sound: true });
    expect(p(s).mediaVariants.enregistrement).toBe('son');
  });

  it('la date et l’heure de l’accident remplissent le fichier, uniquement après la bascule', () => {
    let s = set(s0, { clockAuto: false, manualDate: '2025-03-14', manualTime: '23:48' });
    expect(p(s).mediaVariants['ne-pas-effacer']).toBeUndefined();
    s = view(set(s, { manualTime: '23:47' }), 'enregistrement');
    s = set(s, { manualTime: '23:48' });
    expect(p(s).mediaVariants['ne-pas-effacer']).toBe('plein');
    expect(delivered(s, 'moi-ecoute')).toBe(1);
    // Écouté vide auparavant : seule l'écoute de la version pleine débloque la fin.
    expect(availableReplies(def, s, 't-marc').map((r) => r.id)).not.toContain('r-transmettre');
    s = view(s, 'ne-pas-effacer');
    expect(availableReplies(def, s, 't-marc').map((r) => r.id)).toContain('r-transmettre');
  });

  it('garder puis transmettre : apaisement complet et réglage « Nora »', () => {
    let s = view(s0, 'enregistrement');
    s = set(s, { clockAuto: false, manualDate: '2025-03-14', manualTime: '23:48' });
    s = view(s, 'ne-pas-effacer');
    s = send(s, 'r-garder');
    expect(delivered(s, 'moi-garder')).toBe(1);
    expect(p(s).status).toBe('active');
    s = send(s, 'r-transmettre');
    expect(p(s).status).toBe('solved');
    expect(s.overrides.wallpaper).toBeUndefined();
    expect(s.overrides.extraApp).toBeUndefined();
    expect(s.notes.filter((n) => n.caseId === ID).map((n) => n.body)).toEqual(['Merci. Tu peux fermer.']);
    expect(s.overrides.ghostSetting?.value).toBe('Nora::Je voulais juste rentrer.');
    // Le réglage inconnu : une seule note, puis il disparaît.
    s = run(s, { type: 'ghost/activate' });
    expect(s.overrides.ghostSetting).toBeUndefined();
    expect(s.notes.some((n) => n.body === 'Je voulais juste rentrer.')).toBe(true);
    // Après résolution, plus aucune manifestation.
    s = set(set(s, { airplane: true }), { airplane: false, manualDate: '2025-03-14' });
    s = deserialize(serialize(s), cases).state;
    expect(delivered(s, 'moi-2')).toBe(0);
    expect(s.overrides).toEqual({});
  });
});
