/**
 * Parcours de « 12 % » dans l'interface réelle, sans indice : batterie, lieu, « Hugo » démasqué, fin « Retrouvée ».
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:douze   # ~3 min (temps réel)
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/dp-${n}.png` });

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
await page.getByRole('button', { name: 'Passer l’introduction' }).click();
await page.getByRole('button', { name: 'Plus tard' }).click();
await page.waitForTimeout(800);
await page.reload();

const header = () => page.locator('section.app-layer:not([hidden]) .battery-level');
const level = async () => Number((await header().textContent()).replace(/\D/g, ''));

await check('Permanence acceptée : Léa écrit, batterie à 12 % dans l’en-tête', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Permanence de nuit' }).click();
  await page.getByText('Enquête en temps réel', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await thread('Léa');
  await bubble('J’ai presque plus de batterie').waitFor({ timeout: 20000 });
  assert((await level()) === 12, `batterie : ${await header().textContent()}`);
  await shot('01-lea');
});

await check('Elle n’a que sa sœur ; prévenir les gendarmes coûte 1 %', async () => {
  await reply('Je ne suis pas Camille. Vous vous êtes trompée de numéro.').click();
  await bubble('C’est la seule famille qui me reste.').waitFor({ timeout: 20000 });
  await reply('Je préviens les gendarmes. Que voyez-vous autour de vous ?').click();
  await bubble('Ça sent le chlore').waitFor({ timeout: 20000 });
  assert((await level()) <= 10, `batterie : ${await level()}`);
});

await check('Photo au flash : soupirail et B-14 ; vue du soupirail : clocher', async () => {
  await reply('Prenez une photo de la pièce, avec le flash.').click();
  await openMedia('IMG_2231.jpg');
  await viewer().getByText('3 détails à relever').waitFor();
  await tapRel(0.81, 0.13);
  await page.locator('.sheet h2', { hasText: 'soupirail' }).waitFor();
  await page.getByRole('button', { name: 'Demander à Léa' }).click();
  await reply('Le soupirail en haut : montez et photographiez dehors.').click();
  await openMedia('IMG_2231.jpg');
  await tapRel(0.41, 0.47);
  await page.locator('.sheet h2', { hasText: 'B-14' }).waitFor();
  await closeViewer().catch(() => {});
  await thread('Léa');
  await openMedia('IMG_2233.jpg');
  await tapRel(0.72, 0.26);
  await page.locator('.sheet h2', { hasText: 'clocher' }).waitFor();
  await shot('02-clocher');
});

await check('« Hugo » se dit son frère ; il est démasqué et signalé', async () => {
  await thread('Hugo');
  await bubble('Elle vous a dit où elle était ?').waitFor({ timeout: 60000 });
  await reply('Léa n’a pas de frère. Qui êtes-vous ?').click();
  await bubble('Vous auriez dû rester en dehors de ça.').waitFor({ timeout: 20000 });
  await page.getByText('Numéro non attribué').first().waitFor();
  await thread('Gendarmerie');
  await reply('Un homme se fait passer pour son frère et me demande où elle est. Voici son numéro.').click();
  await bubble('On cherche à localiser ce numéro.').waitFor({ timeout: 20000 });
});

await check('Jean-Bouin et B-14 aux gendarmes : Léa est retrouvée, épilogue de Camille', async () => {
  await reply('La piscine Jean-Bouin, rue de l’Église.').click();
  await bubble('Une équipe part.').waitFor({ timeout: 20000 });
  await reply('Au sous-sol : le local technique B-14.').click();
  await bubble('On l’a trouvée').waitFor({ timeout: 60000 });
  await shot('03-trouvee');
  await thread('Camille');
  await bubble('Elle va bien.').waitFor({ timeout: 60000 });
  await page.waitForTimeout(4000);
  const s = await save();
  assert(s.cases['douze-pourcent'].status === 'solved', 'affaire non résolue');
  await openApp('Dossiers');
  await page.locator('.row, .mail-row, button', { hasText: '12 %' }).first().click();
  await page.getByText('interpellé', { exact: false }).waitFor();
  await shot('04-conclusion');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
await browser.close();
process.exit(failed ? 1 : 0);
