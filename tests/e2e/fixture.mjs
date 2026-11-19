/**
 * Vérifie les écrans d'enquête (Mail, Messages, Dossiers, Photos, mode avion,
 * réglage de l'heure) avec l'enquête de TEST, jamais livrée au joueur.
 *
 *   npm run build:fixture && npx vite preview --outDir dist-fixture --port 4174 &
 *   npm run e2e:fixture        # BASE_URL=http://localhost:4174 par défaut
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE_URL ?? 'http://localhost:4174';
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
    results.push(`✘ ${name}\n    ${String(e.message ?? e).split('\n')[0]}`);
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const { defaultBrowserType: _d, ...iphone } = devices['iPhone 13'];
const page = await (await browser.newContext({ ...iphone, locale: 'fr-FR' })).newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/fx-${n}.png` });
const home = async () => {
  const btn = page.getByRole('button', { name: 'Retour à l’accueil' });
  if (await btn.isVisible()) await btn.click();
};
const openApp = (l) => page.getByRole('button', { name: new RegExp(`^${l}(,|$)`) }).first().click();
const bubbles = (t) => page.locator('.bubble', { hasText: t }).count();

await page.goto(BASE);
await page.getByRole('button', { name: 'Passer l’introduction' }).click();

await check('Widget Mail : dernière demande non lue', async () => {
  await page.locator('.widget', { hasText: 'Client Test' }).waitFor();
  assert(await page.locator('.badge').first().isVisible(), 'badge absent');
});

await check('Pièce jointe consultable avant acceptation ; action proposant d’accepter', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Client Test' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).waitFor();
  await page.getByRole('button', { name: 'Garder pour plus tard' }).waitFor();
  await shot('mail');
  await page.getByRole('button', { name: /Ouvrir img\.jpg/ }).click();
  await page.waitForTimeout(400);
  const b = await page.locator('.zoom-content').boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.68);
  await page.locator('.sheet h2', { hasText: 'Détail' }).waitFor();
  await page.getByRole('button', { name: 'Ajouter au dossier' }).click();
  await page.getByText('Accepter l’enquête ?').waitFor();
  await page.getByRole('button', { name: 'Plus tard', exact: true }).click();
  await page.locator('.viewer').getByRole('button', { name: 'Retour : Retour' }).click();
});

await check('Garder pour plus tard puis accepter', async () => {
  await page.getByRole('button', { name: 'Garder pour plus tard' }).click();
  await page.locator('.mail-row', { hasText: 'Pour plus tard' }).waitFor();
  await page.getByRole('button', { name: 'Reportées', exact: true }).click();
  assert((await page.locator('.mail-row').count()) === 1, 'filtre Reportées');
  await page.getByRole('button', { name: 'À examiner', exact: true }).click();
  assert((await page.locator('.mail-row').count()) === 0, 'filtre À examiner');
  await page.getByRole('button', { name: 'Tous', exact: true }).click();
  await page.getByPlaceholder('Rechercher').fill('introuvable');
  await page.getByText('Aucun résultat.').waitFor();
  await page.getByPlaceholder('Rechercher').fill('');
  await page.locator('.mail-row', { hasText: 'Client Test' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).waitFor();
  // Double acceptation impossible : le bouton a disparu.
  assert((await page.getByRole('button', { name: 'Accepter l’enquête' }).count()) === 0, 'bouton encore là');
});

await check('Dossier : objectif, aide en trois niveaux', async () => {
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).click();
  await page.getByText('Objectif actuel').waitFor();
  await page.getByText('Observer', { exact: true }).waitFor();
  for (const l of ['Demander un indice', 'Indice suivant', 'Afficher la solution']) await page.getByText(l).click();
  assert((await page.locator('.hint').count()) === 3, 'niveaux');
  assert((await page.getByText('Afficher la solution').count()) === 0, 'bouton restant');
  await shot('dossier');
});

await check('Messages : réponse unique malgré le double appui, indicateur de saisie', async () => {
  await home();
  await openApp('Messages');
  await page.locator('.mail-row', { hasText: 'Client Test' }).click();
  await page.locator('.bubble', { hasText: 'Bonsoir' }).waitFor();
  const reply = page.getByRole('button', { name: 'Question 1' });
  await reply.dblclick();
  await page.locator('.typing').waitFor();
  await shot('typing');
  await page.locator('.bubble', { hasText: 'Réponse' }).waitFor();
  assert((await bubbles('Question 1')) === 1, 'réponse envoyée deux fois');
});

await check('Question débloquée par une observation', async () => {
  assert((await page.getByRole('button', { name: 'Question débloquée' }).count()) === 1, 'question absente');
  await page.locator('.bubble', { hasText: 'Final' }).waitFor({ timeout: 6000 });
  await shot('thread');
});

await check('Mode avion : historique lisible, réponse préparée, reprise sans doublon', async () => {
  await home();
  await openApp('Réglages');
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await home();
  await openApp('Messages');
  await page.locator('.callout', { hasText: 'Mode avion activé' }).waitFor();
  assert((await bubbles('Bonsoir')) === 1, 'historique');
  await page.getByRole('button', { name: 'Question débloquée' }).click();
  await page.getByText('En attente').waitFor();
  assert((await bubbles('Question débloquée')) === 0, 'envoyé en mode avion');
  await shot('airplane');
  await page.getByRole('button', { name: 'Réglages', exact: true }).click();
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await page.getByRole('switch', { name: 'Mode avion' }).click();
  await home();
  await openApp('Messages');
  await page.getByRole('button', { name: 'Envoyer la réponse préparée' }).click();
  await page.locator('.bubble', { hasText: 'Question débloquée' }).waitFor();
  assert((await bubbles('Question débloquée')) === 1, 'doublon');
  await page.getByRole('button', { name: 'Retour : Messages' }).click();
  // Le message « hors réseau » du contact inconnu est arrivé une seule fois.
  await page.locator('.mail-row', { hasText: 'Inconnu' }).click();
  assert((await page.locator('.bubble').count()) === 1, 'message répété');
  await page.getByRole('button', { name: 'Retour : Messages' }).click();
});

await check('Copie conservée puis variante modifiée par la date et l’heure manuelles', async () => {
  await home();
  await openApp('Photos');
  await page.locator('.photo-cell').first().click();
  await page.getByRole('button', { name: 'Conserver une copie' }).click();
  await page.getByRole('button', { name: 'Copie conservée' }).waitFor();
  await page.locator('.viewer').getByRole('button', { name: 'Retour : Retour' }).click();
  await home();
  await openApp('Réglages');
  await page.getByRole('button', { name: /Date et heure/ }).click();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2014-11-18');
  const hours = page.getByRole('spinbutton', { name: 'Heures' });
  const minutes = page.getByRole('spinbutton', { name: 'Minutes' });
  for (let i = 0; i < 48 && (await hours.getAttribute('aria-valuenow')) !== '3'; i++) await hours.press('ArrowUp');
  for (let i = 0; i < 120 && (await minutes.getAttribute('aria-valuenow')) !== '17'; i++) await minutes.press('ArrowUp');
  await home();
  const bg = await page.locator('.phone').evaluate((e) => e.style.backgroundImage);
  assert(bg.includes('bureau.jpg'), `fond d’écran ${bg}`);
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Copies conservées' }).click();
  const copySrc = await page.locator('.photo-cell img').first().getAttribute('src');
  assert(copySrc.includes('bureau'), 'la copie a changé');
  await page.locator('.photo-cell').first().click();
  await page.getByRole('button', { name: 'Comparer' }).click();
  assert((await page.locator('.compare-side').count()) === 2, 'comparaison');
  await shot('compare');
  await page.locator('.viewer').getByRole('button', { name: 'Retour : Retour' }).click();
  await page.locator('.viewer').getByRole('button', { name: 'Retour : Retour' }).click();
});

await check('Persistance complète après rechargement', async () => {
  await page.reload();
  await openApp('Messages');
  await page.locator('.mail-row', { hasText: 'Client Test' }).click();
  assert((await bubbles('Question 1')) === 1 && (await bubbles('Final')) === 1, 'historique perdu ou dupliqué');
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
