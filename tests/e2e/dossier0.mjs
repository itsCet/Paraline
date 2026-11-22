/**
 * Parcours complet de « Dossier 0 » dans l'interface réelle, SANS indice, sursaut compris.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:dossier0   # ~4 min (dont 1 min d'immobilité)
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/d0-${n}.png` });

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

await page.goto(BASE);
await page.getByRole('button', { name: 'Passer l’introduction' }).click();
await page.getByRole('button', { name: 'Plus tard' }).click();

await check('Le dossier restauré : avertissement, notes de Victor datées de 2024', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Coordination Paraline' }).click();
  await page.getByText('Contient des images et des sons destinés à effrayer', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await openApp('Notes');
  await page.locator('.row', { hasText: '12 rue des Tilleuls' }).waitFor();
  await page.locator('.row', { hasText: 'C’est elle' }).waitFor();
});

await check('Agnès écrit encore à Victor ; ses anciens messages s’affichent comme les vôtres', async () => {
  await thread('Agnès Ferrand');
  await page.locator('.bubble.me', { hasText: 'Je ne peux plus continuer cette affaire. Pardon.' }).waitFor();
  await bubble('Votre téléphone vient de se reconnecter').waitFor({ timeout: 20000 });
  await reply('Je ne suis pas Victor. J’ai récupéré son téléphone.').click();
  await page.getByRole('button', { name: 'Ouvrir gazette_05-03-1998' }).waitFor({ timeout: 30000 });
  await shot('01-agnes');
});

await check('Le dictaphone, puis la chambre change : elle est là', async () => {
  await openMedia('IMG_7744.jpg');
  await tapRel(0.17, 0.835);
  await page.locator('.sheet h2', { hasText: 'dictaphone' }).waitFor();
  await page.getByRole('button', { name: 'Demander à Agnès' }).click();
  await reply('Il y avait un dictaphone dans la chambre. Victor a trouvé la cassette ?').click();
  await bubble('Sur votre téléphone, donc.').waitFor({ timeout: 30000 });
  await openMedia('IMG_7744.jpg');
  const src = await viewer().locator('.zoom-content img').getAttribute('src');
  assert(src.includes('chambre-elle'), src);
  await closeViewer();
  await thread('Inconnu');
  await bubble('Tu as son téléphone.').waitFor({ timeout: 20000 });
  const dim = await page.locator('.phone-dim').count();
  assert(dim === 1, 'pas d’assombrissement');
});

await check('Quitter le jeu : elle le remarque (note + photo prise par ce téléphone)', async () => {
  await setVisibility('hidden');
  await page.waitForTimeout(9500);
  await setVisibility('visible');
  await page.waitForTimeout(1500);
  await openApp('Notes');
  await page.locator('.row', { hasText: 'Je suis restée.' }).waitFor({ timeout: 10000 });
  const t = await page.locator('.row', { hasText: 'Je suis restée.' }).textContent();
  assert(/Tu es parti \d+ s/.test(t), t);
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await openMedia('IMG_0001.jpg');
  await viewer().getByRole('button', { name: 'Infos du fichier' }).click();
  await page.getByText(/Aujourd’hui · \d\d:\d\d/).waitFor();
  await shot('02-infos-photo');
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await closeViewer();
});

await check('Localiser : un contact inconnu se rapproche', async () => {
  await home();
  await page.getByRole('button', { name: /^Localiser(,|$)/ }).click({ timeout: 15000 });
  await page.getByText('Contact inconnu').waitFor();
  await shot('03-localiser');
});

await check('Récemment supprimés : la date dans les 30 jours fait réapparaître le témoignage', async () => {
  await settingsRoot();
  await page.getByRole('button', { name: /Date et heure/ }).click();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2024-11-20');
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await page.getByText('Récemment supprimés').waitFor({ timeout: 10000 });
  await openMedia('temoignage_clara.m4a');
  await viewer().getByText('Pour que quelqu’un m’entende.').click();
  await page.locator('.toast').getByRole('button', { name: 'L’envoyer à Agnès' }).click();
  await reply('J’ai retrouvé l’enregistrement de Clara. Je vous l’envoie.').click();
  await bubble('ils ne pourront pas l’ignorer').waitFor({ timeout: 30000 });
});

await check('« Ne bouge plus » : toucher l’écran déclenche le sursaut, puis « Recommence. »', async () => {
  await page.locator('.stillness').waitFor({ timeout: 30000 });
  await page.locator('.stillness-text', { hasText: 'Ne bouge plus.' }).waitFor();
  await page.waitForTimeout(3500);
  await page.mouse.click(200, 400);
  await page.locator('.stillness-scare img').waitFor({ timeout: 2000 });
  await shot('04-sursaut');
  await page.locator('.stillness-text.retry', { hasText: 'Recommence.' }).waitFor({ timeout: 5000 });
  const s = await save();
  assert(s.cases['dossier-0'].flags.sursauts === 1, 'sursaut non compté');
});

await check('Tenir une minute sans toucher : fin « Entendue »', async () => {
  await page.locator('.stillness-text', { hasText: 'Ne bouge plus.' }).waitFor({ timeout: 6000 });
  await shot('05-immobile');
  await page.locator('.stillness').waitFor({ state: 'detached', timeout: 75000 });
  await thread('Inconnu');
  await bubble('Tu peux éteindre.').waitFor({ timeout: 20000 });
  await page.waitForTimeout(18000);
  const s = await save();
  assert(s.cases['dossier-0'].status === 'solved', 'non résolue');
  assert(Object.keys(s.cases['dossier-0'].hintsRevealed).length === 0, 'indice utilisé');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
