import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ASSETS } from '../../content/assets';
import { CASES } from '../../content/cases';
import { TUTORIAL_MEDIA } from '../../content/tutorial';

const publicDir = fileURLToPath(new URL('../../../public', import.meta.url));

describe('manifeste des assets', () => {
  it('chaque asset déclaré existe dans public/', () => {
    const missing = ASSETS.filter((a) => !existsSync(publicDir + a.path)).map((a) => a.path);
    expect(missing).toEqual([]);
  });
  it('chaque média des enquêtes et de l’exercice est déclaré', () => {
    const declared = new Set(ASSETS.map((a) => a.path));
    const used = [TUTORIAL_MEDIA, ...CASES.flatMap((c) => c.media)].flatMap((m) =>
      Object.values(m.variants).flatMap((v) => [v.src, v.poster].filter((x): x is string => !!x)),
    );
    expect(used.filter((src) => !declared.has(src))).toEqual([]);
  });
});
