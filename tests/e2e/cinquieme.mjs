/**
 * Parcours complet de « Le cinquième » dans l'interface réelle, SANS indice, jusqu'à la fin complète.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:cinquieme   # BASE_URL=http://localhost:4173 par défaut (~3 min)
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/lc-${n}.png` });

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
const save = async () => {
  await page.waitForTimeout(500);
  return page.evaluate(() => JSON.parse(localStorage.getItem('paraline.save') ?? '{}'));
};
const thread = async (name) => {
  await openApp('Messages');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).click({ timeout: 40000 });
};
const say = async (who, text, waitFor) => {
  await thread(who);
  await reply(text).click({ timeout: 40000 });
  if (waitFor) await bubble(waitFor).waitFor({ timeout: 40000 });
};
const dismissBanner = async () => {
  const b = page.getByRole('button', { name: 'Fermer la notification' });
  if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
};
const openMedia = async (name) => {
  await page.getByRole('button', { name: `Ouvrir ${name}` }).last().click({ timeout: 30000 });
  await page.waitForTimeout(400);
  await dismissBanner();
};
const observe = async (x, y, title) => {
  await tapRel(x, y);
  await page.locator('.sheet h2', { hasText: title }).waitFor();
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

await check('Acceptation : groupe à quatre voix, Sarah en privé', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Sarah Morel' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await thread('Chalet 🌲');
  await bubble('Les deux autres photos du week-end.').waitFor({ timeout: 30000 });
  for (const n of ['Sarah Morel', 'Julien', 'Inès', 'Malik']) await page.locator('.bubble-sender', { hasText: n }).first().waitFor();
  await shot('01-groupe');
});

await check('Infos de la photo des cartes : 23:12', async () => {
  await openMedia('IMG_2043.jpg');
  await viewer().getByRole('button', { name: 'Infos du fichier' }).click();
  await page.getByRole('button', { name: /23:12/ }).click();
  await shot('02-infos');
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await closeViewer();
  await reply('La partie de cartes a été photographiée à 23:12. Vous jouiez encore ?').click();
  await bubble('Non, Inès.').waitFor({ timeout: 30000 });
});

await check('Ponton : la silhouette sur la glace ; Malik quitte le groupe', async () => {
  await openMedia('IMG_2037.jpg');
  await observe(0.795, 0.28, 'bonnet rouge marche');
  await page.getByRole('button', { name: 'En parler au groupe' }).click();
  await reply('Sur la photo du ponton, quelqu’un marche sur la glace. Le même bonnet rouge.').click();
  await page.locator('section.app-layer:not([hidden]) .stamp', { hasText: 'Malik a quitté la conversation.' }).waitFor({ timeout: 30000 });
  await shot('03-malik-parti');
});

await check('Annonce du chalet, puis livre d’or et empreinte', async () => {
  await reply('Parlez-moi du chalet.').click();
  await openMedia('annonce_chalet_des_pins');
  await viewer().getByText('notre livre d’or, tenu depuis 2009').click();
  await page.waitForTimeout(400);
  await closeViewer();
  await thread('Sarah Morel');
  await reply('La propriétaire pourrait-elle photographier la page de février 2014 du livre d’or ?').click();
  await openMedia('livre_dor.jpg');
  assert((await viewer().locator('.sheet-writing').textContent()).includes('et Théo'), 'empreinte absente');
  await observe(0.65, 0.37, 's’est imprimée');
  await shot('04-livre');
  await page.getByRole('button', { name: 'Demander à Sarah' }).click();
  await reply('Sur la page suivante, l’écriture s’est imprimée : « S., J., I., M. et Théo ». Qui est Théo ?').click();
  await bubble('ce prénom me serre le ventre').waitFor({ timeout: 30000 });
});

await check('Malik avoue, Inès nomme Théo', async () => {
  await say('Malik', 'Le livre d’or est signé par cinq personnes. Vous étiez cinq.', 'Inès va vous écrire.');
  await say('Inès', 'Qui était Théo ?', 'Même pas Léna.');
  await say('Inès', 'Que faisait-il sur la glace, en pleine nuit ?', 'Demandez à Julien.');
});

await check('Julien bloque le joueur', async () => {
  await say('Julien', 'Inès m’a parlé de Théo. Que s’est-il passé sur la glace ?', 'Laissez-nous tranquilles.');
  await page.getByText('Julien vous a bloqué.').first().waitFor();
  await shot('05-bloque');
});

await check('Il se tourne : photos de face, GPS au milieu du lac, app Téléphone', async () => {
  await home();
  await page.getByRole('button', { name: /^Téléphone, 1 non lu/ }).waitFor({ timeout: 40000 });
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await openMedia('IMG_2041.jpg');
  const src = await viewer().locator('img').first().getAttribute('src');
  assert(src.includes('groupe-face'), `variante : ${src}`);
  await dismissBanner();
  await viewer().getByRole('button', { name: 'Infos du fichier' }).click({ timeout: 20000 });
  await page.getByRole('button', { name: /lac de Vaulx, à 400 m/ }).click();
  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await closeViewer();
  await openApp('Téléphone');
  await page.getByRole('button', { name: /Ouvrir Numéro masqué/ }).click();
  await viewer().getByText('Vous êtes partis.').waitFor();
  await shot('06-messagerie');
  await closeViewer();
});

await check('Julien débloque et raconte le pari', async () => {
  await say('Julien', 'Que s’est-il passé cette nuit-là ?', 'rejoint l’autre rive');
});

await check('15/02/2014 02:14 : la dernière photo', async () => {
  await settingsRoot();
  await page.getByRole('button', { name: /Date et heure/ }).click();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2014-02-15');
  await setTime(2, 14);
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Pièces reçues' }).click();
  await openMedia('IMG_0214.jpg');
  await observe(0.5, 0.55, 'quatre lampes');
  await shot('07-derniere');
  await page.getByRole('button', { name: 'Le montrer au groupe' }).click();
  await reply('J’ai retrouvé la dernière photo du téléphone de Théo. 02:14, prise depuis la glace. On y voit vos quatre lampes.').click();
  await bubble('Je ne voulais pas m’en souvenir.').waitFor({ timeout: 30000 });
  await bubble('Mais qui le lui dit ?').waitFor({ timeout: 40000 });
});

await check('Fin complète : ensemble, Léna, le reflet', async () => {
  await reply('Vous quatre, ensemble. Chacun avec ses mots.').click({ timeout: 30000 });
  await page.getByRole('button', { name: 'Ouvrir Léna — message vocal' }).waitFor({ timeout: 60000 });
  await openMedia('Léna — message vocal');
  await viewer().getByText('Il aurait voulu ça.').waitFor();
  await closeViewer();
  await openMedia('IMG_8812.jpg');
  await observe(0.82, 0.5, 'ils sont cinq');
  await shot('08-reflet');
  await page.keyboard.press('Escape');
  const s = await save();
  assert(s.cases['le-cinquieme'].status === 'solved', 'non résolue');
  assert(Object.keys(s.cases['le-cinquieme'].hintsRevealed).length === 0, 'indice utilisé');
  await home();
  assert((await page.getByRole('button', { name: /^Téléphone/ }).count()) === 0, 'Téléphone encore là');
});

await check('Dossier : conclusion de la fin complète', async () => {
  await openApp('Dossiers');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.getByText('Le cinquième').first().click();
  await page.getByText('La vérité, de leur bouche').waitFor();
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
