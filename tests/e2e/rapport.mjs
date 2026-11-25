/**
 * Remplit et remet le rapport d'une affaire dans l'interface, comme un joueur :
 * Dossiers › l'affaire › chaque trou › le bon choix › « Remettre le rapport ».
 * `reponses` : les bonnes réponses possibles ; pour chaque trou, on choisit celle qui est proposée.
 */
export async function remplirRapport(page, titre, reponses, { faux, shot } = {}) {
  const fermerBanniere = async () => {
    const b = page.getByRole('button', { name: 'Fermer la notification' });
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  };
  await fermerBanniere();
  const accueil = page.getByRole('button', { name: 'Retour à l’accueil' });
  if (await accueil.isVisible()) await accueil.click();
  await page.getByRole('button', { name: /^Dossiers(,|$)/ }).first().click();
  const back = page.locator('section.app-layer:not([hidden]) .navbar-back');
  if (await back.isVisible()) await back.click();
  await page.locator('section.app-layer:not([hidden]) .row, section.app-layer:not([hidden]) button', { hasText: titre }).first().click();
  const rapport = page.locator('section.report');
  await rapport.waitFor({ timeout: 15000 });
  await rapport.scrollIntoViewIfNeeded();
  if (shot) await shot('rapport-1-vide');

  const choisir = async (liste) => {
    const trous = rapport.locator('.report-blank');
    const n = await trous.count();
    for (let i = 0; i < n; i++) {
      await trous.nth(i).click();
      const feuille = page.getByRole('dialog', { name: 'Choisir une réponse' });
      await feuille.waitFor();
      if (shot && i === 0) {
        await page.waitForTimeout(400);
        await shot(faux ? 'rapport-2-choix' : 'rapport-2b-choix');
      }
      const options = await feuille.locator('.reply').allTextContents();
      const choix = options.find((o) => liste.includes(o.trim()));
      if (!choix) throw new Error(`rapport « ${titre} », trou ${i + 1} : aucune bonne réponse proposée parmi ${JSON.stringify(options)}`);
      await feuille.locator('.reply', { hasText: choix.trim() }).first().click();
      await feuille.waitFor({ state: 'detached' });
    }
    await rapport.getByRole('button', { name: 'Remettre le rapport' }).click();
  };

  if (faux) {
    // Un rapport faux d'abord : seul le nombre de bonnes réponses est donné.
    await choisir(faux);
    await rapport.getByText(/sur \d+ (sont justes|est juste)|Aucune réponse juste/).waitFor();
    if (shot) await shot('rapport-3-erreur');
  }
  await choisir(reponses);
  await rapport.locator('.tag.ok', { hasText: 'Remis' }).waitFor({ timeout: 10000 });
  if (shot) {
    await page.waitForTimeout(600);
    await shot('rapport-4-remis');
  }
  await fermerBanniere();
}
