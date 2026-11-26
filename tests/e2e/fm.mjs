/**
 * Parcours de « 87.6 FM » dans l'interface réelle, sans indice : spectre, radio à 3 h, enregistrement, adieu.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:fm   # ~2 min
 */
import { createRequire } from 'node:module';
import { remplirRapport } from './rapport.mjs';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
let failed = 0;
let stop = false;
async function check(name, fn) {
  if (stop) return results.push(`– ${name} (non exécuté)`);
  try {
    await fn();
    results.push(`✔ ${name}`);
  } catch (e) {
    failed++;
    stop = true; // parcours séquentiel : on s'arrête à la première rupture
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/echec.png` }).catch(() => {});
    results.push(`✘ ${name}\n    ${String(e.message ?? e).split('\n').slice(0, 3).join(' | ')}`);
  }
  console.log(results[results.length - 1]);
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const { defaultBrowserType: _d, ...iphone } = devices['iPhone 13'];
const ctx = await browser.newContext({ ...iphone, locale: 'fr-FR' });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/fm-${n}.png` });

const home = async () => {
  // Ferme une éventuelle bannière qui recouvrirait l'écran.
  const b = page.getByRole('button', { name: 'Fermer la notification' });
  if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  const btn = page.getByRole('button', { name: 'Retour à l’accueil' });
  if (await btn.isVisible()) await btn.click();
};
const openApp = async (label) => {
  await home();
  await page.getByRole('button', { name: new RegExp(`^${label}(,|$)`) }).first().click();
};
const viewer = () => page.locator('.viewer');
const closeViewer = async () => {
  const b = page.getByRole('button', { name: 'Fermer la notification' });
  if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  await viewer().getByRole('button', { name: /^Retour/ }).first().click();
};
const settingsRoot = async () => {
  await openApp('Réglages');
  for (let i = 0; i < 3; i++) {
    const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
    if (await back.isVisible()) await back.click();
  }
};
const dateTime = async () => {
  await settingsRoot();
  await page.getByRole('button', { name: /Date et heure/ }).click();
};
const setTime = async (hh, mm) => {
  const hours = page.getByRole('spinbutton', { name: 'Heures' });
  const minutes = page.getByRole('spinbutton', { name: 'Minutes' });
  for (let i = 0; i < 48 && (await hours.getAttribute('aria-valuenow')) !== String(hh); i++) await hours.press('ArrowUp');
  for (let i = 0; i < 120 && (await minutes.getAttribute('aria-valuenow')) !== String(mm); i++) await minutes.press('ArrowUp');
};
const airplane = async (on) => {
  await settingsRoot();
  const sw = page.getByRole('switch', { name: 'Mode avion' });
  if ((await sw.isChecked()) !== on) await sw.click();
};

const bubble = (t) => page.locator('section.app-layer:not([hidden]) .bubble', { hasText: t });
const reply = (t) => page.getByRole('button', { name: t, exact: true });
const tapRel = async (x, y) => {
  const b = await viewer().locator('.zoom-content').boundingBox();
  await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
};
const save = async () => { await page.waitForTimeout(500); return page.evaluate(() => JSON.parse(localStorage.getItem('paraline.save') ?? '{}')); };
const dismissBanner = async () => { const b = page.getByRole('button', { name: 'Fermer la notification' }); if (await b.isVisible().catch(() => false)) await b.click().catch(() => {}); };
const thread = async (name) => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: name }).first().click({ timeout: 40000 });
};
const openMedia = async (name) => {
  await page.getByRole('button', { name: `Ouvrir ${name}` }).last().click({ timeout: 40000 });
  await page.waitForTimeout(400);
  await dismissBanner();
};
const setVisibility = (state) => page.evaluate((st) => { Object.defineProperty(document, 'visibilityState', { value: st, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, state);



// Enquête réservée : le code d'accès est déjà saisi dans la sauvegarde.
await page.addInitScript(() => {
  try {
    const raw = localStorage.getItem('paraline.save');
    if (raw) localStorage.setItem('paraline.save', JSON.stringify({ ...JSON.parse(raw), unlocked: true }));
  } catch {}
});
await page.goto(BASE);
await page.getByRole('button', { name: 'Prendre mon téléphone' }).click();
await page.waitForTimeout(800);
await page.reload();

const cueLine = (t) => viewer().locator('.transcript button', { hasText: t });
const radio = async (freq) => {
  await openApp('Radio');
  await page.getByRole('slider', { name: 'Fréquence' }).fill(String(freq));
};

await check('Le mail de Noémie : l’app Radio apparaît à l’accueil', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Noémie Vasseur' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await home();
  await page.getByRole('button', { name: /^Radio(,|$)/ }).waitFor({ timeout: 8000 });
});

await check('L’enregistrement : les nombres, puis RADIO VALLÉE dans le spectre', async () => {
  await thread('Noémie');
  await bubble('captent la FM').waitFor({ timeout: 20000 });
  await openApp('Mail');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'Noémie Vasseur' }).click();
  await openMedia('radio_3h00.m4a');
  for (const t of ['Huit… sept… six.', 'Zéro… trois… zéro… zéro.', 'Un… quatre…']) await cueLine(t).click();
  await viewer().getByRole('button', { name: 'Afficher le spectre' }).click();
  await viewer().locator('.spectro img').waitFor();
  await shot('01-spectre');
  await viewer().getByRole('button', { name: 'Examiner cette partie du spectre' }).click();
  await page.getByRole('button', { name: 'Demander à Noémie' }).waitFor();
  await closeViewer();
});

await check('Noémie : 87.6 à 3 h, Radio Vallée, puis l’article de 1987', async () => {
  await thread('Noémie');
  await reply('8-7-6, puis 0-3-0-0 : 87.6 à 3 h. C’est là que votre radio s’allume ?').click();
  await bubble('il n’y a que du souffle').waitFor({ timeout: 20000 });
  await reply('Dans le sifflement, il y a un nom : « Radio Vallée ». Ça vous dit quelque chose ?').click();
  await page.getByRole('button', { name: 'Ouvrir echo_vallee_16-03-1987' }).waitFor({ timeout: 40000 });
  await page.getByRole('button', { name: 'Ouvrir echo_vallee_16-03-1987' }).click();
  for (const t of ['Le feu a pris peu avant 3 heures', 'chaque nuit à 3 heures']) await viewer().locator('[data-obs]', { hasText: t }).click();
  await closeViewer();
});

await check('Radio : souffle en journée, Théo à 3 h ; l’émission s’enregistre', async () => {
  await radio(87.6);
  await page.getByRole('button', { name: 'Allumer' }).click();
  await page.locator('.radio-station', { hasText: 'Souffle' }).waitFor();
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await setTime(3, 0);
  await openApp('Radio');
  await page.locator('.radio-station', { hasText: 'Radio Vallée' }).waitFor();
  await page.getByRole('button', { name: 'Enregistrer l’émission' }).click();
  await shot('02-radio');
  await page.getByRole('button', { name: 'Ouvrir 87.6 · 03:00' }).click();
  await cueLine('Papa a dit').click();
  await closeViewer();
});

await check('La phrase pour Henri, puis l’adieu à 3 h : l’antenne s’éteint', async () => {
  await thread('Noémie');
  await reply('Théo attend que son père ferme l’antenne. Il faut qu’Henri dise : « Fin des émissions ».').click();
  await bubble('Il dit qu’il sera prêt.').waitFor({ timeout: 60000 });
  await openApp('Radio');
  const on = page.getByRole('button', { name: 'Allumer' });
  if (await on.isVisible()) await on.click();
  await page.locator('.radio-live', { hasText: 'Bonne nuit, papa.' }).waitFor({ timeout: 30000 });
  await shot('03-adieu');
  await page.locator('.radio-station', { hasText: 'Souffle' }).waitFor({ timeout: 10000 });
  await thread('Noémie');
  await bubble('Il souriait.').waitFor({ timeout: 30000 });
  await page.waitForTimeout(4000);
  await remplirRapport(page, '87.6 FM', ['Théo Vasseur', '14 mars 1987', 'Henri', '« Fin des émissions. »']);
  const s = await save();
  assert(s.cases['quatre-vingt-sept'].status === 'solved', 'non résolue');
  assert(Object.keys(s.cases['quatre-vingt-sept'].hintsRevealed).length === 0, 'indice utilisé');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
await browser.close();
process.exit(failed ? 1 : 0);
