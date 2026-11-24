/**
 * Labo (/?labo) : lampe torche, photo à 360° (WebGL), boussole, dans un vrai navigateur.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:labo
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    failed++;
    results.push(`✘ ${name}\n    ${String(e.message ?? e).split('\n').slice(0, 3).join(' | ')}`);
  }
  console.log(results[results.length - 1]);
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const { defaultBrowserType: _d, ...iphone } = devices['iPhone 13'];
const ctx = await browser.newContext({ ...iphone, locale: 'fr-FR' });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/labo-${n}.png` });
const msg = () => page.locator('.labo-msg').textContent();

await page.goto(`${BASE}/?labo`);

await check('Lampe : l’écriture UV ne se trouve qu’éclairée', async () => {
  await page.locator('.flashlight-stage img').first().waitFor();
  const b = await page.locator('.flashlight-stage').boundingBox();
  const at = (x, y) => ({ x: b.x + b.width * x, y: b.y + b.height * y });
  // Faisceau ailleurs : toucher l'écriture (sans déplacer la lumière) ne donne rien.
  const far = at(0.8, 0.2);
  await page.mouse.move(far.x, far.y);
  const t = at(0.3, 0.66);
  await page.evaluate(({ x, y }) => document.querySelector('.flashlight').dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true })), t);
  await page.waitForTimeout(200);
  assert(!(await msg()).includes('ELLE'), 'trouvé dans le noir');
  // Éclairer puis toucher.
  await page.mouse.move(t.x, t.y);
  await page.mouse.click(t.x, t.y);
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('ELLE EST LÀ'));
  await shot('01-lampe');
});

await check('360° : la chambre de Clara s’affiche, on trouve le dictaphone, on passe la porte', async () => {
  await page.getByRole('tab', { name: 'Photo à 360°' }).click();
  await page.waitForFunction(() => !document.querySelector('.panorama .img-state'), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  await shot('02-chambre');
  // Le dictaphone est à 99° (longitude) et 29° sous l'horizon : deux quarts de tour à droite (90°).
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Tourner à droite' }).click();
  await page.waitForTimeout(200);
  await shot('03-table-de-nuit');
  const b = await page.locator('.panorama').boundingBox();
  const t = Math.tan((37.5 * Math.PI) / 180);
  const proj = (dlon, lat) => {
    const r = Math.PI / 180;
    const X = Math.cos(lat * r) * Math.sin(dlon * r);
    const Y = Math.sin(lat * r);
    const Z = -Math.cos(lat * r) * Math.cos(dlon * r);
    return { x: b.x + ((X / -Z / (t * (b.width / b.height)) + 1) / 2) * b.width, y: b.y + ((1 - Y / -Z / t) / 2) * b.height };
  };
  const d = proj(99.4 - 90, -28.8);
  await page.mouse.click(d.x, d.y);
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('dictaphone'));
  // La porte du couloir est à 162° : deux quarts de tour de plus.
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Tourner à droite' }).click();
  await shot('04-porte');
  await page.getByRole('button', { name: 'Couloir' }).click();
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('Couloir'));
  await page.waitForFunction(() => !document.querySelector('.panorama .img-state'), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  await shot('05-couloir');
  // Dans le couloir : la clé dans la serrure de la porte brûlée (116°, 21° sous l'horizon).
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Tourner à droite' }).click();
  await shot('06-porte-brulee');
  const k = proj(116 - 90, -20.7);
  await page.mouse.click(k.x, k.y);
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('clé'));
  // Retour vers la chambre (porte ouverte à −65°).
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Tourner à gauche' }).click();
  await page.getByRole('button', { name: 'Chambre de Clara' }).click();
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('Chambre de Clara'));
});

await check('Boussole : viser le nord-est 3 secondes trouve le signal', async () => {
  await page.getByRole('tab', { name: 'Boussole' }).click();
  await page.getByRole('button', { name: 'Activer la boussole' }).click();
  await page.getByRole('button', { name: 'Activer la boussole' }).waitFor({ state: 'detached' });
  // Cap simulé : 300° (rien), puis 45° (nord-est), tenu.
  const send = (alpha) =>
    page.evaluate((a) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', { alpha: a, beta: 0, gamma: 0, absolute: true })), alpha);
  await send(60); // cap 300°
  await page.waitForTimeout(300);
  const lu = await page.locator('.compass-deg').textContent();
  assert(lu === '300°', `cap non lu : ${lu}`);
  for (let i = 0; i < 18; i++) {
    await send(315); // cap 45°
    await page.waitForTimeout(200);
  }
  await page.waitForFunction(() => document.querySelector('.labo-msg')?.textContent?.includes('nord-est'));
  await shot('05-boussole');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
await browser.close();
process.exit(failed ? 1 : 0);
