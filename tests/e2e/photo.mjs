/**
 * Parcours complet de « Cette photo a changé » dans l'interface réelle, SANS indice.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:photo        # BASE_URL=http://localhost:4173 par défaut
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/pc-${n}.png` });

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
const closeViewer = () => viewer().getByRole('button', { name: /^Retour/ }).first().click();
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
const eliseThread = async () => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).click();
};
const gabrielThread = async () => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'G. Vannier' }).click();
};
const bubble = (t) => page.locator('section.app-layer:not([hidden]) .bubble', { hasText: t });
const reply = (t) => page.getByRole('button', { name: t, exact: true });
const openCapture = async () => {
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await page.getByRole('button', { name: 'Ouvrir capture_0317.jpg' }).click();
  await page.waitForTimeout(400);
};
const tapRel = async (x, y) => {
  const b = await viewer().locator('.zoom-content').boundingBox();
  await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
};
const sheetText = () => viewer().locator('.sheet-writing').textContent();
const save = async () => {
  await page.waitForTimeout(500);
  return page.evaluate(() => JSON.parse(localStorage.getItem('paraline.save') ?? '{}'));
};

const annaThread = async () => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'Anna Rey' }).click();
};
const openAlbumParc = async () => {
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await page.getByRole('button', { name: 'Ouvrir IMG_7714.jpg' }).click();
  await page.waitForTimeout(400);
};

await page.goto(BASE);
await page.getByRole('button', { name: 'Passer l’introduction' }).click();
await page.getByRole('button', { name: 'Plus tard' }).click();

await check('E-mail d’Anna disponible au lancement, à côté de la première affaire', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Anna Rey' }).waitFor();
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).waitFor();
});

await check('Ombre manquante relevée avant acceptation, puis acceptation', async () => {
  await page.locator('.mail-row', { hasText: 'Anna Rey' }).click();
  await page.getByRole('button', { name: /Ouvrir parc\.jpg/ }).click();
  await page.waitForTimeout(400);
  await tapRel(0.83, 0.3);
  await page.locator('.sheet h2', { hasText: 'Paul n’a pas d’ombre' }).waitFor();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await shot('01-parc');
  await closeViewer();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).waitFor();
});

await check('Anna partage l’album « Famille »', async () => {
  await annaThread();
  await bubble('Je n’en ai parlé à personne').waitFor();
  await reply('Où sont rangées ces photos ?').click();
  await bubble('dans le métro').waitFor();
  await openApp('Photos');
  await page.getByText('Album partagé « Famille »').waitFor();
  await shot('02-album');
});

await check('Mode avion : la copie locale du parc est sans Paul', async () => {
  await airplane(true);
  await openAlbumParc();
  assert(await viewer().locator('.zoom-content img[src*="parc-original"]').count(), 'pas de copie locale');
  await tapRel(0.83, 0.3);
  await page.locator('.sheet h2', { hasText: 'copie locale' }).waitFor();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await closeViewer();
  await airplane(false);
  await openAlbumParc();
  assert(await viewer().locator('.zoom-content img[src$="/parc.jpg"]').count(), 'pas resynchronisée');
});

await check('Infos : modifiée avec Retouche+ sur l’iPad de Paul', async () => {
  await viewer().getByRole('button', { name: 'Infos du fichier' }).click();
  await page.locator('.sheet').getByText('Retouche+ · iPad de Paul').click();
  await page.locator('.sheet .row', { hasText: 'Retouche+' }).locator('svg').waitFor();
  await shot('03-infos');
  await page.locator('.sheet').getByRole('button', { name: 'Fermer' }).click();
  await closeViewer();
});

await check('Souvenir de Saint-Malo et question sur l’iPad', async () => {
  await annaThread();
  await reply('Avez-vous une photo de Paul prise avant ?').click();
  await page.getByRole('button', { name: 'Ouvrir saint-malo.jpg' }).waitFor();
  await reply('Qui utilise l’iPad de Paul ?').click();
  await bubble('Vous pensez que c’est elle ?').waitFor();
});

await check('Fin douce : Léa écrit, affaire résolue', async () => {
  await reply('C’est sûrement Léa. Parlez-lui avant de supprimer quoi que ce soit.').click();
  await bubble('Je vais lui parler ce soir.').waitFor();
  assert((await reply('Quelqu’un ajoute Paul sur les photos avec cet iPad. Ce n’est pas lui.').count()) === 0, 'les deux fins restent proposées');
  await page.locator('section.app-layer:not([hidden]) .navbar-back').click();
  await page.locator('.mail-row', { hasText: 'Léa Rey' }).waitFor({ timeout: 20000 });
  await page.locator('.mail-row', { hasText: 'Léa Rey' }).click();
  await bubble('Je voulais juste qu’il soit encore sur les photos.').waitFor();
  await reply('Comment tu as fait ?').click();
  await bubble('C’est la seule où il sourit vraiment.').waitFor();
  await shot('04-lea');
  await page.waitForTimeout(7000);
  const s = await save();
  assert(s.cases['photo-changee'].status === 'solved', 'non résolue');
  assert(Object.keys(s.cases['photo-changee'].hintsRevealed).length === 0, 'indice utilisé');
});

await check('Dossier : conclusion correspondant à la fin choisie', async () => {
  await openApp('Dossiers');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.case-card', { hasText: 'Cette photo a changé' }).click();
  await page.getByText('Anna et Léa ont décidé de les garder.', { exact: false }).waitFor();
  await shot('05-dossier');
});

await check('La première affaire peut maintenant être acceptée', async () => {
  await openApp('Mail');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).waitFor();
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
