/**
 * Parcours complet de « La chambre condamnée » dans l'interface réelle, SANS indice.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run e2e:chambre        # BASE_URL=http://localhost:4173 par défaut
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
const shot = (n) => SHOTS && page.screenshot({ path: `${SHOTS}/cc-${n}.png` });

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
  await page.waitForTimeout(500); // sauvegarde différée
  return page.evaluate(() => JSON.parse(localStorage.getItem('paraline.save') ?? '{}'));
};

await page.goto(BASE);
await page.getByRole('button', { name: 'Passer l’introduction' }).click();
await page.getByRole('button', { name: 'Plus tard' }).click();

await check('E-mail initial disponible, non ouvert automatiquement', async () => {
  await page.locator('.widget', { hasText: 'La caméra était débranchée' }).waitFor();
  const s = await save();
  assert(s.readMails.length === 0, 'e-mail lu automatiquement');
  assert(s.cases['chambre-condamnee'].status === 'new', 'affaire démarrée');
});

await check('Pièces jointes consultables avant acceptation ; action proposant d’accepter', async () => {
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).click();
  await page.getByText('Toujours à 03:17.', { exact: false }).waitFor();
  await shot('01-mail');
  await page.getByRole('button', { name: /Ouvrir IMG_4821\.jpg/ }).click();
  await page.waitForTimeout(400);
  await closeViewer();
  await page.getByRole('button', { name: /Ouvrir capture_0317\.jpg/ }).click();
  await page.waitForTimeout(400);
  await tapRel(0.485, 0.45); // porte du fond
  await page.locator('.sheet h2', { hasText: 'Une porte fermée occupe le fond du couloir.' }).waitFor();
  await page.getByRole('button', { name: 'Ajouter au dossier' }).click();
  await page.getByText('Accepter l’enquête ?').waitFor();
  await page.getByRole('button', { name: 'Plus tard', exact: true }).click();
  await closeViewer();
});

await check('Garder pour plus tard puis accepter', async () => {
  await page.getByRole('button', { name: 'Garder pour plus tard' }).click();
  await page.locator('.mail-row', { hasText: 'Pour plus tard' }).waitFor();
  await page.locator('.mail-row', { hasText: 'Élise Morel' }).click();
  await page.getByRole('button', { name: 'Accepter l’enquête' }).click();
  await page.getByRole('button', { name: 'Ouvrir le dossier' }).click();
  await page.getByText('D’où viennent les images reçues par Élise ?').waitFor();
  await page.screenshot({ path: '/tmp/claude-0/-home-user-Paraline/0bc6f646-c0cc-59d8-a03b-6e4e1b6cc41a/scratchpad/dbg-dossier.png' });
  assert((await page.getByText('Demander un indice').count()) === 1, `aide absente ${await page.getByText('Demander un indice').count()}`);
  assert((await page.locator('.hint').count()) === 0, 'indice affiché sans demande');
});

await check('Échanges avec Élise et document comparatif', async () => {
  await eliseThread();
  await bubble('Merci de regarder').waitFor();
  await reply('Vous êtes certaine qu’elle n’est plus alimentée ?').click();
  await bubble('La prise est là, à côté.').waitFor();
  await reply('Les images ont-elles déjà changé ?').click();
  await page.getByRole('button', { name: 'Ouvrir Comparaison des deux téléphones' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir Comparaison des deux téléphones' }).click();
  await viewer().getByText('Horloge restée à 03:17.', { exact: false }).waitFor();
  await shot('02-document');
  await closeViewer();
});

await check('Énigme 1 : heure manuelle 03:17 → fichier actualisé, écriture illisible', async () => {
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await setTime(3, 17);
  await page.locator('.banner', { hasText: 'capture_0317.jpg' }).waitFor();
  await openCapture();
  await viewer().locator('.sheet-writing.unstable').waitFor();
  const t1 = await sheetText();
  await page.waitForTimeout(1800);
  const t2 = await sheetText();
  assert(!/VANNIER|NOVEMBRE|SORTIS|03:17/.test(t1 + t2), `texte lisible : ${t1}`);
  assert(t1 !== t2, 'l’écriture ne se recompose pas');
  assert(await viewer().locator('.zoom-content img[src*="entrouverte"]').count(), 'la photo a disparu');
  await shot('03-instable');
});

await check('Petit écran : zoom ×10 et zone de la feuille', async () => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) await viewer().getByRole('button', { name: 'Agrandir' }).click();
  const w = (await viewer().locator('.sheet-writing').boundingBox()).width;
  assert(w > 60, `feuille trop petite après zoom : ${w}`);
  await viewer().getByRole('button', { name: 'Image entière' }).click();
  await tapRel(0.476, 0.386);
  await page.locator('.sheet h2', { hasText: 'Le texte change alors que le reste de l’image reste identique.' }).waitFor();
  await shot('04-observation');
  await page.getByRole('button', { name: 'Questionner Élise' }).click();
  await page.setViewportSize({ width: 390, height: 664 });
});

await check('Question naturelle après la feuille instable', async () => {
  await reply('Avez-vous réussi à garder l’image avec la porte ouverte ?').click();
  await bubble('Pendant son trajet en avion').waitFor();
});

await check('Rechargement à 03:17', async () => {
  await page.reload();
  await page.locator('.statusbar', { hasText: '03:17' }).waitFor();
  const s = await save();
  assert(s.cases['chambre-condamnee'].mediaVariants.capture === 'instable', 'variante perdue');
});

await check('Énigme 2 : mode avion → écriture lisible, copie conservée', async () => {
  await airplane(true);
  await openCapture();
  await viewer().locator('.sheet-writing:not(.unstable)').waitFor();
  const t = await sheetText();
  assert(t.includes('G. VANNIER') && t.includes('18 NOVEMBRE 2014') && t.includes('SORTIS ?'), `texte : ${t}`);
  const alt = await viewer().locator('.zoom-area').getAttribute('aria-label');
  assert(alt.includes('G. Vannier'), 'description accessible non mise à jour');
  for (let i = 0; i < 6; i++) await viewer().getByRole('button', { name: 'Agrandir' }).click();
  await shot('05-lisible-zoom');
  await viewer().getByRole('button', { name: 'Image entière' }).click();
  await viewer().getByRole('button', { name: 'Conserver une copie' }).click();
  await viewer().getByRole('button', { name: 'Copie conservée' }).waitFor();
  await tapRel(0.476, 0.386);
  await page.locator('.sheet h2', { hasText: 'L’écriture de la feuille est lisible.' }).waitFor();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await closeViewer();
});

await check('Hors ligne : la question sur G. Vannier reste préparée', async () => {
  await eliseThread();
  await reply('Le nom G. Vannier vous dit quelque chose ?').click();
  await page.getByText('En attente').waitFor();
  assert((await bubble('G. Vannier vous dit').count()) === 0, 'envoyé hors ligne');
});

await check('Reconnexion : envoi unique, article reçu et relevé', async () => {
  await airplane(false);
  await eliseThread();
  await page.getByRole('button', { name: 'Envoyer la réponse préparée' }).click();
  await bubble('Je vais demander à mon ancienne propriétaire.').waitFor();
  await page.getByRole('button', { name: 'Ouvrir article_2014' }).waitFor({ timeout: 15000 });
  assert((await bubble('G. Vannier vous dit').count()) === 1, 'doublon');
  await page.getByRole('button', { name: 'Ouvrir article_2014' }).click();
  await viewer().getByText('Le Courrier du Quartier').waitFor();
  await viewer().getByText('ont été pris en charge sains et saufs', { exact: false }).click();
  await viewer().locator('.passage-found').waitFor();
  await shot('06-article');
  await closeViewer();
});

await check('La copie reste lisible après reconnexion', async () => {
  await openApp('Photos');
  await page.getByRole('tab', { name: 'Copies conservées' }).click();
  await page.locator('.photo-cell').first().click();
  await page.waitForTimeout(300);
  assert((await sheetText()).includes('G. VANNIER'), 'copie altérée');
  await closeViewer();
});

await check('Énigme 3 : 18 novembre 2014, 03:17 → G. Vannier écrit', async () => {
  await dateTime();
  await page.locator('input[type=date]').fill('2014-11-18');
  await page.locator('.banner', { hasText: 'G. Vannier' }).waitFor({ timeout: 15000 });
  await gabrielThread();
  await bubble('Les deux sont sortis ?').waitFor({ timeout: 15000 });
  await page.getByText('18/11/2014, 03:17').waitFor();
  await shot('07-gabriel');
});

await check('Interruption puis rétablissement du contact sans doublon', async () => {
  await dateTime();
  await page.locator('input[type=date]').fill('2014-11-19');
  await gabrielThread();
  await page.locator('section.app-layer:not([hidden]) .callout', { hasText: 'Contact indisponible' }).waitFor();
  assert((await reply('Qui êtes-vous ?').count()) === 0, 'réponse possible hors contact');
  await dateTime();
  await page.locator('input[type=date]').fill('2014-11-18');
  await gabrielThread();
  await reply('Qui êtes-vous ?').click();
  await bubble('Je peux pas lâcher la porte.').waitFor();
  assert((await bubble('Ça passe encore ?').count()) === 1, 'messages en double');
});

await check('Mauvaise réponse puis correction', async () => {
  await reply('Aline et Hugo sont sortis. Ils sont en sécurité.').click();
  await bubble('Vous les avez vus ?').waitFor();
  await reply('Oui, je suis avec eux.').click();
  await bubble('Passez-les-moi.').waitFor();
  await reply('Je ne suis pas avec eux. J’ai leur témoignage. Ils sont sortis.').click();
  await bubble('Je peux lâcher maintenant.').waitFor();
  await page.getByText('Dernier message : 03:17').first().waitFor();
  await shot('08-fin-echange');
});

await check('Porte ouverte, affaire pas encore résolue', async () => {
  await openCapture();
  assert(await viewer().locator('.zoom-content img[src*="resolution"]').count(), 'pas de pièce vide');
  await closeViewer();
  const s = await save();
  assert(s.cases['chambre-condamnee'].status === 'active', 'résolue trop tôt');
});

await check('Retour au réglage automatique → affaire résolue, épilogue', async () => {
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await eliseThread();
  await bubble('Vous avez réussi à lui répondre ?').waitFor({ timeout: 15000 });
  await reply('Il sait qu’ils sont sortis.').click();
  await bubble('Merci.').waitFor();
  await openApp('Dossiers');
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('.case-card', { hasText: 'La chambre condamnée' }).click();
  await page.getByText('La réponse qui ne lui était jamais parvenue a enfin été transmise.', { exact: false }).waitFor();
  await shot('09-dossier-resolu');
  await page.locator('.banner', { hasText: 'Un brouillon a été récupéré.' }).waitFor({ timeout: 15000 });
  await openApp('Mail');
  await page.locator('.mail-row', { hasText: 'Brouillon' }).click();
  await page.locator('.mail-body', { hasText: 'Merci d’avoir répondu.' }).waitFor();
});

await check('Après résolution : mur plein, rien ne se rejoue, aucun indice utilisé', async () => {
  await dateTime();
  await page.getByRole('switch', { name: 'Réglage automatique' }).click();
  await page.locator('input[type=date]').fill('2014-11-18');
  await setTime(3, 17);
  await page.waitForTimeout(2500);
  await page.reload();
  const s = await save();
  const c = s.cases['chambre-condamnee'];
  assert(c.status === 'solved' && c.mediaVariants.capture === 'mur', 'anomalie rejouée');
  assert(Object.keys(c.hintsRevealed).length === 0, 'indice utilisé');
  const g = (c.threads['t-gabriel'] ?? []).map((e) => e.messageId);
  assert(g.filter((x) => x === 'g-1').length === 1, 'Gabriel a réécrit');
  await gabrielThread();
  await page.getByText('Dernier message : 03:17').first().waitFor();
});

await check('Aucune erreur JavaScript', async () => assert(errors.length === 0, errors.join(' | ')));

await browser.close();
console.log(`\n${results.filter((r) => r.startsWith('✔')).length}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
