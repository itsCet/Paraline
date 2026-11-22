/**
 * Parcours complet de « Elle écrit dans mes notes » dans l'interface réelle, SANS indice.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:elle        # BASE_URL=http://localhost:4173 par défaut
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/ee-${n}.png` });

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

const thread = async (name) => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).click();
};
const openRecording = async () => {
  await openApp('Mail');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.mail-row', { hasText: 'Marc Dubois' }).click();
  await page.getByRole('button', { name: /Ouvrir enregistrement_0412/ }).click();
};

// Les enquêtes réservées s'ouvrent avec le code d'accès (parcours testé dans smoke) :
// la sauvegarde porte le code saisi avant chaque chargement.
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

await check('Acceptation, puis écoute : transcription avec passage inaudible', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Marc Dubois' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await page.getByRole('button', { name: /Ouvrir enregistrement_0412/ }).click();
  await viewer().getByText('[inaudible]').waitFor();
  await shot('01-enregistrement');
  await closeViewer();
});

await check('Bascule : une note apparaît, le fond d’écran change, « Moi » écrit', async () => {
  await openApp('Notes');
  await page.locator('.row', { hasText: 'C’est toi qui as mon message ?' }).waitFor({ timeout: 25000 });
  await home();
  const bg = await page.locator('.phone').evaluate((e) => e.style.backgroundImage);
  assert(bg.includes('fond-voiture'), `fond : ${bg}`);
  await shot('02-accueil-hante');
  await openApp('Messages');
  await page.getByRole('button', { name: /^Moi(,|$)/ }).waitFor({ timeout: 30000 });
});

await check('Effacer la note : elle revient avec une phrase de plus', async () => {
  await openApp('Notes');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.row', { hasText: 'C’est toi qui as mon message ?' }).click();
  await page.getByRole('button', { name: 'Supprimer la note' }).click();
  await page.locator('.row', { hasText: 'Ne m’efface pas.' }).waitFor({ timeout: 35000 });
  await shot('03-note-revenue');
});

await check('Dictaphone apparaît sur l’accueil ; fichier vide', async () => {
  await home();
  await page.getByRole('button', { name: /^Dictaphone(,|$)/ }).waitFor({ timeout: 40000 });
  await openApp('Dictaphone');
  await page.getByRole('button', { name: 'Ouvrir ne_pas_effacer.m4a' }).click();
  await viewer().getByText('Enregistrement vide', { exact: false }).waitFor();
  await closeViewer();
});

await check('Mode avion : « Moi » écrit quand même', async () => {
  await airplane(true);
  await thread('Moi');
  await bubble('Je suis toujours là.').waitFor({ timeout: 15000 });
  await airplane(false);
});

await check('Son coupé : le chuchotement se lit et se relève', async () => {
  await settingsRoot();
  await page.getByRole('button', { name: /Audio/ }).click();
  await page.getByRole('switch', { name: 'Sons du jeu' }).click();
  await openRecording();
  await viewer().getByText('Maman… le 14… la route des Étangs.').click();
  await shot('04-chuchotement');
  await closeViewer();
  await settingsRoot();
  await page.getByRole('button', { name: /Audio/ }).click();
  await page.getByRole('switch', { name: 'Sons du jeu' }).click();
});

await check('Numéro de série, vendeur, avis de décès', async () => {
  await thread('Marc Dubois');
  await reply('D’où vient ce téléphone ?').click();
  await page.getByRole('button', { name: 'Ouvrir IMG_2290.jpg' }).click({ timeout: 15000 });
  await page.waitForTimeout(400);
  assert((await sheetText()).includes('F2LXK4Q1P7'), 'numéro absent');
  await tapRel(0.3, 0.68);
  await page.locator('.sheet h2', { hasText: 'F2LXK4Q1P7' }).waitFor();
  await page.getByRole('button', { name: 'Questionner Marc' }).click();
  await reply('Le vendeur pourrait-il retrouver l’ancien propriétaire avec ce numéro de série ?').click();
  await page.getByRole('button', { name: 'Ouvrir avis_lemaire' }).click({ timeout: 25000 });
  await viewer().getByText('Nora Lemaire').waitFor();
  await shot('05-avis');
  await closeViewer();
});

await check('14 mars 2025, 23:48 : le message de Nora revient', async () => {
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2025-03-14');
  await setTime(23, 48);
  await openApp('Dictaphone');
  await page.getByRole('button', { name: 'Ouvrir ne_pas_effacer.m4a' }).click();
  await viewer().getByText('Maman, c’est moi.').waitFor();
  await shot('06-message');
  await closeViewer();
});

await check('Transmettre à sa mère : tout s’apaise, affaire résolue', async () => {
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await thread('Marc Dubois');
  await reply('J’ai retrouvé son dernier message. Pouvez-vous le faire parvenir à sa mère ?').click();
  await bubble('Elle dit merci.').waitFor({ timeout: 25000 });
  await home();
  const bg = await page.locator('.phone').evaluate((e) => e.style.backgroundImage);
  assert(!bg.includes('fond-voiture'), 'fond toujours hanté');
  assert((await page.getByRole('button', { name: /^Dictaphone(,|$)/ }).count()) === 0, 'Dictaphone encore là');
  await openApp('Notes');
  await page.locator('.row', { hasText: 'Merci. Tu peux fermer.' }).waitFor();
  assert((await page.locator('.row', { hasText: 'Ne m’efface pas.' }).count()) === 0, 'notes de Nora restantes');
  const s = await save();
  assert(s.cases['elle-ecrit'].status === 'solved', 'non résolue');
  assert(Object.keys(s.cases['elle-ecrit'].hintsRevealed).length === 0, 'indice utilisé');
});

await check('Dernier frisson : le réglage « Nora »', async () => {
  await settingsRoot();
  await page.getByRole('switch', { name: 'Nora' }).click();
  assert((await page.getByRole('switch', { name: 'Nora' }).count()) === 0, 'réglage toujours présent');
  await openApp('Notes');
  await page.locator('.row', { hasText: 'Je voulais juste rentrer.' }).waitFor();
  await shot('07-fin');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
