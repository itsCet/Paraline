/**
 * Parcours de vérification de bout en bout (Playwright + Chromium).
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e                       # BASE_URL=http://localhost:4173 par défaut
 *   SHOTS=./shots npm run e2e         # captures d'écran facultatives
 *
 * Playwright n'est pas une dépendance du projet : le script utilise
 * l'installation disponible sur la machine (`require('playwright')`).
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
const log = (l) => { console.log(l); };
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    results.push(`✔ ${name}`); log(`✔ ${name}`);
  } catch (e) {
    failed++;
    results.push(`✘ ${name}\n    ${String(e.message ?? e).split('\n').slice(0, 3).join(' | ')}`);
    log(results[results.length - 1]);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

const browser = await chromium.launch();
const { defaultBrowserType: _ignored, ...iphone } = devices['iPhone 13'];
const ctx = await browser.newContext({ ...iphone, locale: 'fr-FR' });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const home = async () => {
  const btn = page.getByRole('button', { name: 'Retour à l’accueil' });
  if (await btn.isVisible()) await btn.click();
};
const homeVisible = () => page.locator('.home:not([hidden])').isVisible();
const settingsRoot = async () => {
  await openApp('Réglages');
  const back = page.getByRole('button', { name: 'Retour : Réglages' });
  if (await back.isVisible()) await back.click();
};
const coach = () => page.locator('.coach-text');
const openApp = (label) => page.getByRole('button', { name: new RegExp(`^${label}(,|$)`) }).first().click();

await page.goto(BASE);

await check('Première ouverture : écran 1/3', async () => {
  await page.getByText('Certaines histoires méritent qu’on les examine.').waitFor();
  assert(await page.getByText('1 / 3').isVisible(), 'indicateur 1/3 absent');
  await shot(page, '01-intro-1');
});

await check('Navigation intro : continuer, retour, 3/3', async () => {
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByText('Votre téléphone est votre outil de travail.').waitFor();
  assert(await page.getByText('2 / 3').isVisible(), '2/3 absent');
  await shot(page, '02-intro-2');
  await page.getByRole('button', { name: 'Écran précédent' }).click();
  await page.getByText('1 / 3').waitFor();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByText('Touchez tout. Les indices se cachent.').waitFor();
  assert(await page.getByText('3 / 3').isVisible(), '3/3 absent');
  assert(await page.getByText('Passer l’introduction').isVisible(), 'passer absent');
  await shot(page, '03-intro-3');
  await page.getByRole('button', { name: 'Prendre mon téléphone' }).click();
});

await check('Accueil : widget Mail (nouvelle demande) et proposition d’exercice', async () => {
  await page.locator('.widget', { hasText: 'Nouveau message' }).waitFor();
  await page.getByText('Une minute pour prendre vos marques').waitFor();
  await shot(page, '04-home');
});

await check('Introduction mémorisée après rechargement', async () => {
  await page.reload();
  await page.getByText('Une minute pour prendre vos marques').waitFor();
  assert(!(await page.getByText('Certaines histoires').isVisible()), 'intro réaffichée');
});

await check('États avant acceptation (Messages et Dossiers vides)', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).waitFor();
  await home();
  await openApp('Messages');
  await page.getByText('Vos échanges apparaîtront ici lorsque vous accepterez une enquête.').waitFor();
  await home();
  await openApp('Dossiers');
  await page.getByText('Vos enquêtes acceptées seront regroupées ici.').waitFor();
  await home();
});

await check('Exercice : lancement et ouverture du message', async () => {
  await page.getByRole('button', { name: 'Faire l’essai' }).click();
  assert((await coach().textContent()).includes('Ouvrez l’application Mail'), 'guide initial');
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Votre première observation' }).click();
  await page.locator('.mail-body', { hasText: 'Ouvrez-la et regardez le bureau' }).waitFor();
  await page.locator('.coach-text', { hasText: 'photo jointe' }).waitFor();
  await shot(page, '05-tuto-mail');
  await page.getByRole('button', { name: /Ouvrir Le bureau/ }).click();
  await page.locator('.zoom-content').waitFor();
});

await check('Rechargement en cours d’exercice', async () => {
  await page.reload();
  await page.locator('.coach-text', { hasText: 'Rouvrez la photo' }).waitFor();
});

await check('Abandon puis reprise de l’exercice', async () => {
  await page.getByRole('button', { name: /Quitter l’exercice/ }).click();
  assert((await coach().count()) === 0, 'guide toujours visible');
  await openApp('Réglages');
  await page.getByRole('button', { name: /Aide/ }).click();
  await page.getByRole('button', { name: /Reprendre l’exercice/ }).click();
  await coach().waitFor();
  assert(await homeVisible(), 'accueil non affiché');
});

await check('Zoom de l’image (bouton, retour à l’image entière, molette)', async () => {
  await openApp('Mail');
  const msg = page.locator('.mail-row', { hasText: 'Votre première observation' });
  if (await msg.isVisible()) await msg.click();
  await page.getByRole('button', { name: /Ouvrir Le bureau/ }).click();
  const content = page.locator('.zoom-content');
  await content.waitFor();
  await page.waitForTimeout(400); // fin de l'animation d'ouverture
  const w0 = (await content.boundingBox()).width;
  await page.getByRole('button', { name: 'Agrandir' }).click();
  const w1 = (await content.boundingBox()).width;
  assert(w1 > w0 * 1.3, `zoom bouton ${w0} → ${w1}`);
  await shot(page, '06-zoom');
  await page.getByRole('button', { name: 'Image entière' }).click();
  const w2 = (await content.boundingBox()).width;
  assert(Math.abs(w2 - w0) < 2, 'retour image entière');
});

await check('Toucher hors zone : aucune pénalité ni fiche', async () => {
  const b = await page.locator('.zoom-content').boundingBox();
  await page.mouse.click(b.x + b.width * 0.2, b.y + b.height * 0.2);
  await page.waitForTimeout(150);
  assert((await page.locator('.sheet').count()) === 0, 'fiche ouverte à tort');
});

await check('Observation du tiroir (après zoom) et ajout au dossier sans doublon', async () => {
  await page.getByRole('button', { name: 'Agrandir' }).click();
  const b = await page.locator('.zoom-content').boundingBox();
  // Coordonnées relatives : la zone reste alignée malgré le zoom.
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.68);
  await page.getByText('Le tiroir est entrouvert.').first().waitFor();
  await shot(page, '07-observation');
  await page.getByRole('button', { name: 'Ajouter au dossier' }).click();
  await page.getByText('Ajouté au dossier', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Image entière' }).click();
  const b2 = await page.locator('.zoom-content').boundingBox();
  await page.mouse.click(b2.x + b2.width * 0.5, b2.y + b2.height * 0.68);
  await page.getByRole('button', { name: 'Déjà dans le dossier' }).waitFor();
  await page.getByRole('button', { name: 'Fermer' }).click();
  assert((await page.locator('.obs-chip').count()) === 1, 'observation dupliquée');
});

await check('Exercice : dossier puis fin', async () => {
  await home();
  await openApp('Dossiers');
  await page.locator('.case-card', { hasText: 'Exercice de prise en main' }).click();
  assert((await page.locator('.row-title', { hasText: 'Le tiroir est entrouvert.' }).count()) === 1, 'observation absente ou en double');
  await page.getByText('Vous savez maintenant examiner une pièce jointe', { exact: false }).waitFor();
  await shot(page, '08-dossier-exercice');
  await page.getByRole('button', { name: 'Terminer l’exercice' }).click();
  assert(await homeVisible(), 'pas de retour accueil');
  assert((await coach().count()) === 0, 'guide encore visible');
  await openApp('Mail');
  assert((await page.locator('.mail-row', { hasText: 'Votre première observation' }).count()) === 0, 'mail d’exercice encore présent');
  await home();
});

await check('Retour à l’accueil depuis chaque application', async () => {
  for (const app of ['Mail', 'Messages', 'Photos', 'Dossiers', 'Notes', 'Réglages']) {
    await openApp(app);
    assert(!(await homeVisible()), `${app} non ouvert`);
    await home();
    assert(await homeVisible(), `retour depuis ${app}`);
  }
});

await check('Notes : création, sauvegarde, suppression annulable', async () => {
  await openApp('Notes');
  await page.getByRole('button', { name: 'Nouvelle note' }).first().click();
  await page.getByLabel('Titre de la note').fill('Piste du couloir');
  await page.getByLabel('Contenu de la note').fill('Vérifier le reflet.');
  await page.waitForTimeout(500);
  await page.reload();
  await openApp('Notes');
  await page.getByText('Piste du couloir').waitFor();
  await page.getByText('Piste du couloir').click();
  assert((await page.getByLabel('Contenu de la note').inputValue()) === 'Vérifier le reflet.', 'contenu perdu');
  await page.getByRole('button', { name: 'Supprimer la note' }).click();
  await page.getByText('Note supprimée').waitFor();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.getByText('Piste du couloir').waitFor();
  await home();
});

await check('Date et heure manuelles puis retour automatique', async () => {
  await settingsRoot();
  await page.getByRole('button', { name: /Date et heure/ }).click();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2014-11-18');
  // Règle l'heure sur 03:17 via le clavier.
  const hours = page.getByRole('spinbutton', { name: 'Heures' });
  const minutes = page.getByRole('spinbutton', { name: 'Minutes' });
  for (let i = 0; i < 48 && (await hours.getAttribute('aria-valuenow')) !== '3'; i++) await hours.press('ArrowUp');
  for (let i = 0; i < 120 && (await minutes.getAttribute('aria-valuenow')) !== '17'; i++) await minutes.press('ArrowUp');
  await shot(page, '09-date-heure');
  assert((await page.locator('.statusbar').textContent()).includes('03:17'), 'heure non appliquée');
  await page.reload();
  assert((await page.locator('.statusbar').textContent()).includes('03:17'), 'heure non conservée');
  await home();
  await page.getByText('Mardi 18 novembre').waitFor();
  await openApp('Réglages');
  await page.getByRole('button', { name: /Date et heure/ }).click();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const bar = await page.locator('.statusbar').textContent();
  assert(bar.includes(hhmm) || !bar.includes('03:17'), `heure auto : ${bar}`);
  await page.getByRole('button', { name: 'Retour : Réglages' }).click();
});

await check('Mode avion', async () => {
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await page.getByText('Échanges suspendus', { exact: false }).waitFor();
  assert((await page.locator('.statusbar .sr-only').textContent()).includes('Mode avion'), 'indicateur');
  await home();
  await openApp('Messages');
  await page.getByText('Vos échanges apparaîtront ici', { exact: false }).waitFor();
  await home();
  await openApp('Réglages');
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await home();
});

await check('Préférences d’accessibilité', async () => {
  await openApp('Réglages');
  await page.getByRole('button', { name: /Accessibilité/ }).click();
  await page.getByRole('switch', { name: 'Réduire les animations' }).click();
  await page.getByRole('switch', { name: 'Texte plus grand' }).click();
  assert(await page.locator('.phone.reduce-motion.large-text').count(), 'classes absentes');
  await page.reload();
  assert(await page.locator('.phone.reduce-motion.large-text').count(), 'préférences non conservées');
  await openApp('Réglages');
  await page.getByRole('button', { name: /Accessibilité/ }).click();
  await page.getByRole('switch', { name: 'Réduire les animations' }).click();
  await page.getByRole('switch', { name: 'Texte plus grand' }).click();
  await home();
});

await check('Petit écran (320×568) : pas de débordement horizontal', async () => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(200);
  await shot(page, '10-small-home');
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert(ok, 'débordement');
  const dock = await page.locator('.dock').boundingBox();
  assert(dock && dock.y + dock.height <= 568, 'dock hors écran');
  await openApp('Mail');
  await shot(page, '11-small-mail');
  await home();
});

await check('Clavier virtuel (hauteur réduite) : éditeur visible', async () => {
  await openApp('Notes');
  await page.getByText('Piste du couloir').click();
  await page.setViewportSize({ width: 320, height: 300 });
  await page.getByLabel('Contenu de la note').focus();
  await page.waitForTimeout(200);
  const box = await page.getByLabel('Contenu de la note').boundingBox();
  assert(box && box.y < 300 && box.height > 20, `zone de saisie ${JSON.stringify(box)}`);
  const bar = await page.locator('.homebar').boundingBox();
  assert(bar && bar.y + bar.height <= 301, 'barre d’accueil hors écran');
  await shot(page, '12-keyboard');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Retour : Notes/ }).click();
  await home();
});

await check('Réinitialisation avec confirmation', async () => {
  await openApp('Réglages');
  const back = page.getByRole('button', { name: 'Retour : Réglages' });
  if (await back.isVisible()) await back.click();
  await page.getByRole('button', { name: /Sauvegarde/ }).click();
  await page.getByText('La progression est enregistrée dans ce navigateur.', { exact: false }).waitFor();
  await page.getByRole('button', { name: /Réinitialiser la partie/ }).click();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.getByRole('button', { name: /Réinitialiser la partie/ }).click();
  await page.getByRole('button', { name: 'Tout effacer' }).click();
  await page.getByText('Certaines histoires méritent qu’on les examine.').waitFor();
  await page.reload();
  await page.getByText('Certaines histoires méritent qu’on les examine.').waitFor();
  await page.getByRole('button', { name: 'Passer l’introduction' }).click();
  await openApp('Notes');
  await page.getByText('Aucune note', { exact: false }).waitFor();
});

await check('Sauvegarde invalide : avertissement, pas d’écran blanc', async () => {
  const c = await browser.newContext({ ...iphone, locale: 'fr-FR' });
  // Donnée corrompue présente avant le démarrage de l'application.
  await c.addInitScript(() => {
    if (!sessionStorage.getItem('corrupted')) {
      sessionStorage.setItem('corrupted', '1');
      localStorage.setItem('paraline.save', '{corrompu');
    }
  });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(BASE);
  await p.locator('.warning-bar').filter({ hasText: 'sauvegarde' }).waitFor();
  await p.getByText('Certaines histoires', { exact: false }).waitFor();
  assert((await p.evaluate(() => localStorage.getItem('paraline.save.corrupt'))) === '{corrompu', 'copie de secours absente');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/14-corrupt.png` });
  await c.close();
});

await check('Ordinateur (1440×900) : téléphone centré et lisible', async () => {
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
  const p = await desk.newPage();
  await p.goto(BASE);
  await p.getByRole('button', { name: 'Passer l’introduction' }).click();
  const b = await p.locator('.phone').boundingBox();
  assert(Math.abs(b.x + b.width / 2 - 720) < 2 && b.width === 402, `cadre ${JSON.stringify(b)}`);
  await p.keyboard.press('Tab');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/13-desktop.png` });
  await desk.close();
});

await check('Aucune erreur JavaScript', async () => {
  assert(errors.length === 0, errors.join(' | '));
});

await browser.close();
console.log(`\n${results.length - failed}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
