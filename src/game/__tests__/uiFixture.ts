/**
 * Enquête de test pour les vérifications d'interface (build `VITE_FIXTURE=1`).
 * Jamais incluse dans le build de production : Vite élimine cette branche.
 */
import type { CaseDefinition } from '../types';
import { testCase } from './fixtures';

const A = '/media/tutorial/bureau.svg';
const B = '/media/system/wallpaper-night.svg';

export const CASES: CaseDefinition[] = [
  {
    ...testCase,
    media: [
      {
        ...testCase.media[0],
        sizeLabel: '2 Mo',
        variants: {
          v1: { src: A, width: 800, height: 600, hotspots: [{ id: 'h1', x: 0.585, y: 0.715, w: 0.285, h: 0.17, observationId: 'o1' }] },
          v2: { src: B, width: 390, height: 844 },
        },
      },
    ],
    rules: testCase.rules.map((r) => ({
      ...r,
      effects: r.effects.map((e) => (e.type === 'phoneOverride' ? { ...e, value: B } : e)),
    })),
    messages: testCase.messages.map((m) => (m.id === 'm-final' ? { ...m, attachments: ['img'] } : m)),
  },
];
