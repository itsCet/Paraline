/** « 87.6 FM » : stations selon l'heure et la date, spectre, enregistrement, fin. */
import { beforeEach, describe, expect, it } from 'vitest';
import { availableReplies, evaluate, indexCases } from '../engine';
import { createReducer, type Action } from '../reducer';
import { withRapport } from './rapport-auto';
import { initialState } from '../save';
import type { GameState, Settings } from '../types';
import { quatreVingtSept as def } from '../../content/cases/quatre-vingt-sept';

const ID = def.id;
const cases = indexCases([def]);
let now = Date.parse('2026-11-23T10:00:00');
const reducer = withRapport(createReducer(cases, () => now), cases);
const run = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const flush = (s: GameState, ms = 60000) => {
  for (let t = 0; t < ms; t += 2000) {
    now += 2000;
    s = reducer(s, { type: 'tick' });
  }
  return s;
};
const set = (s: GameState, patch: Partial<Settings>) => run(s, { type: 'settings/update', patch });
const send = (s: GameState, id: string) => {
  expect(availableReplies(def, s, 't-noemie').map((r) => r.id)).toContain(id);
  return flush(run(s, { type: 'reply/send', caseId: ID, replyId: id }));
};
const found = (s: GameState, ...ids: string[]) => run(s, ...ids.map((observationId) => ({ type: 'observation/found' as const, caseId: ID, observationId })));
/** Ce que capte la radio sur une fréquence. */
const capte = (s: GameState, freq: number) =>
  def.radio!.stations.find((st) => Math.abs(st.freq - freq) < 0.05 && (!st.when || evaluate(st.when, s, ID)))?.mediaId;
const p = (s: GameState) => s.cases[ID];
const got = (s: GameState, id: string) => Object.values(p(s).threads).flat().some((e) => e.messageId === id);

let s0: GameState;
beforeEach(() => {
  now = Date.parse('2026-11-23T10:00:00');
  s0 = flush(run(initialState(cases), { type: 'intro/complete' }, { type: 'case/accept', caseId: ID }), 10000);
});

describe('87.6 FM', () => {
  it('ajoute l’app Radio ; 87.6 ne diffuse rien en journée, Radio Horizon toujours', () => {
    expect(s0.overrides.extraApp?.value).toBe('radio');
    expect(capte(s0, 87.6)).toBeUndefined();
    expect(capte(s0, 99.3)).toBe('horizon');
  });

  it('à 3 h : Théo ; le 14/03/1987 à 3 h : la dernière nuit', () => {
    let s = set(s0, { clockAuto: false, manualTime: '03:00' });
    expect(capte(s, 87.6)).toBe('emission');
    s = set(s, { manualTime: '03:47' });
    expect(capte(s, 87.6)).toBe('emission');
    s = set(s, { manualDate: '1987-03-14', manualTime: '03:00' });
    expect(capte(s, 87.6)).toBe('nuit');
    s = set(s, { manualTime: '04:00' });
    expect(capte(s, 87.6)).toBeUndefined();
  });

  it('enregistrer une émission la range dans « Radio »', () => {
    const s = run(s0, { type: 'media/grant', caseId: ID, mediaId: 'emission' });
    expect(p(s).grantedMedia).toContain('emission');
    expect(def.media.find((m) => m.id === 'emission')?.album).toBe('Radio');
  });

  it('le spectre cache RADIO VALLÉE ; Noémie envoie l’article', () => {
    const spec = def.media.find((m) => m.id === 'enregistrement')!.variants.v.spectrogram!;
    expect(spec.hotspots?.[0].observationId).toBe('vallee');
    let s = found(s0, 'vallee');
    s = send(s, 'r-vallee');
    expect(got(s, 'n-carton2')).toBe(true);
  });

  it('parcours complet : la phrase, l’adieu, l’antenne s’éteint', () => {
    let s = found(s0, 'n-freq', 'n-heure', 'n-date');
    s = send(s, 'r-nombres');
    s = set(s, { clockAuto: false, manualTime: '03:00' });
    s = run(s, { type: 'media/view', caseId: ID, mediaId: 'emission' });
    s = found(s, 'attend', 'vallee');
    s = send(s, 'r-vallee');
    s = run(s, { type: 'media/view', caseId: ID, mediaId: 'article' });
    s = found(s, 'incendie', 'rituel');
    s = send(s, 'r-date');
    s = set(s, { manualDate: '1987-03-14' });
    expect(capte(s, 87.6)).toBe('nuit');
    s = found(s, 'reste');
    s = send(s, 'r-nuit');
    s = send(s, 'r-theo');
    expect(got(s, 'n-henri2')).toBe(true);
    expect(capte(s, 87.6)).toBe('adieu'); // Henri prêt : l'adieu passe avant la dernière nuit
    s = flush(found(s, 'bonne-nuit'), 20000);
    expect(capte(s, 87.6)).toBeUndefined(); // plus que du souffle
    expect(p(s).status).toBe('solved');
    expect(def.endings!.find((e) => evaluate(e.when, s, ID))?.text[1]).toContain('Noémie sait');
  });
});
