/** Boussole (cibles, drapeau), lampe et photo à 360° (validation du contenu). */
import { describe, expect, it } from 'vitest';
import { indexCases } from '../engine';
import { createReducer } from '../reducer';
import { initialState } from '../save';
import { validateCase } from '../validate';
import { testCase } from './fixtures';
import type { CaseDefinition } from '../types';
import { angleDiff } from '../../components/sensors';

const def: CaseDefinition = {
  ...testCase,
  compass: { targets: [{ id: 'ne', bearing: 45, label: 'Signal' }, { id: 'plus-tard', bearing: 200, label: 'Autre', when: { flag: 'jamais' } }] },
};
const cases = indexCases([def]);
const reducer = createReducer(cases, () => 1e12);

describe('boussole', () => {
  it('une cible tenue pose le drapeau boussole:<id>, une seule fois', () => {
    let s = reducer(reducer(initialState(cases), { type: 'intro/complete' }), { type: 'case/accept', caseId: def.id });
    s = reducer(s, { type: 'compass/found', caseId: def.id, targetId: 'ne' });
    expect(s.cases[def.id].flags['boussole:ne']).toBe(true);
    expect(reducer(s, { type: 'compass/found', caseId: def.id, targetId: 'ne' })).toBe(s);
    expect(reducer(s, { type: 'compass/found', caseId: def.id, targetId: 'inconnue' })).toBe(s);
  });

  it('écart d’angle le plus court', () => {
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(350, 10)).toBe(-20);
    expect(Math.abs(angleDiff(45, 45))).toBe(0);
  });
});

describe('validation', () => {
  it('cap hors limites et passage vers un média inconnu', () => {
    const bad: CaseDefinition = {
      ...def,
      compass: { targets: [{ id: 'x', bearing: 400, label: 'x' }] },
      media: [...def.media, { id: 'pano', kind: 'image', name: 'p', defaultVariant: 'v', variants: { v: { src: '/p.jpg', panorama: { exits: [{ x: 0.5, y: 0.5, to: 'nulle-part', label: 'x' }] } } } }],
    };
    const errs = validateCase(bad).join(' | ');
    expect(errs).toContain('cap hors de');
    expect(errs).toContain('passage vers un média inconnu');
  });
});
