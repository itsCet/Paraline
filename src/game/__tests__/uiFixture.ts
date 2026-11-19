/**
 * Enquête de test pour les vérifications d'interface (build `VITE_FIXTURE=1`).
 * Jamais incluse dans le build de production : Vite élimine cette branche.
 */
import type { CaseDefinition } from '../types';
import { testCase } from './fixtures';

const A = '/media/tutorial/bureau.jpg';
const B = '/media/system/wallpaper.jpg';

export const CASES: CaseDefinition[] = [
  {
    ...testCase,
    media: [
      {
        ...testCase.media[0],
        sizeLabel: '2 Mo',
        variants: {
          v1: { src: A, width: 1086, height: 1448, hotspots: [{ id: 'h1', x: 0.065, y: 0.54, w: 0.855, h: 0.265, observationId: 'o1' }] },
          v2: { src: B, width: 852, height: 1846 },
        },
      },
    ],
    rules: testCase.rules.map((r) => ({
      ...r,
      effects: r.effects.map((e) => (e.type === 'phoneOverride' ? { ...e, value: A } : e)),
    })),
    messages: testCase.messages.map((m) => (m.id === 'm-final' ? { ...m, attachments: ['img'] } : m)),
  },
];
