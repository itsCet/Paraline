# Mécaniques : lampe torche, photo à 360°, boussole

Ajoutées le 24/11/2026. À essayer sur téléphone : **`/?labo`** (rien n'est sauvegardé). Aucune enquête ne les utilise encore.

## Lampe torche (`variants.v.flashlight`)
Une image plongée dans le noir, qu'on éclaire en glissant le doigt ou en inclinant le téléphone (bouton « Éclairer en inclinant »). Les zones (`hotspots`) ne se touchent que dans le faisceau. `reveal` : une image PNG transparente (même taille que la photo) visible seulement dans la lumière : écriture « UV », trace, visage.

```ts
variants: { v: { src: `${DIR}/cave.jpg`, width: 1086, height: 1448, flashlight: { radius: 0.26, reveal: `${DIR}/cave-uv.png` }, hotspots: [...] } }
```
Image à fournir : une photo **bien exposée** (le jeu la plonge lui-même dans le noir) + éventuellement le calque UV (je peux le fabriquer à partir d'un texte).

La **vraie** lampe du téléphone n'est pas pilotable depuis un navigateur : elle viendra avec la version app (Capacitor).

## Photo à 360° (`variants.v.panorama`)
On regarde autour de soi en glissant, en pinçant, ou en bougeant le téléphone (« Regarder avec le téléphone »). Les zones utilisent les coordonnées de l'image à plat (x = tour complet de gauche à droite, y = du plafond au sol). `exits` : passages vers une autre photo à 360° de l'enquête (on « se balade » de pièce en pièce).

```ts
variants: { v: { src: `${DIR}/salon-360.jpg`, panorama: { startYaw: 0.5, exits: [{ x: 0.75, y: 0.53, to: 'couloir-360', label: 'Couloir' }] }, hotspots: [...] } }
```
Image à fournir : **panorama équirectangulaire 2:1**, idéalement **4096 × 2048** (au moins 3000 × 1500), pris depuis le centre de la pièce, à hauteur d'yeux. Outils : Skybox AI (Blockade Labs) ou tout générateur qui propose « 360° equirectangular panorama ». Les bords gauche et droit doivent se raccorder. Indiquez-moi où sont les indices et les portes : je règle les zones.

## Boussole (app `boussole`, `compass.targets`)
L'enquête ajoute l'app (`phoneOverride extraApp: 'boussole'`). Viser une direction réelle (cap en degrés, 0 = nord) pendant `hold` secondes pose le drapeau `boussole:<id>` ; le téléphone vibre de plus en plus vite en approchant. Sans capteur (ordinateur, permission refusée), la rose se tourne au doigt.

```ts
compass: { targets: [{ id: 'signal', bearing: 45, tolerance: 15, hold: 3, label: 'Signal AIDE_MOI', when: { flag: 'wifi' } }] },
rules: [{ id: 'trouve', when: { flag: 'boussole:signal' }, effects: [...] }]
```

## Remplacer une image
Toujours lui donner **un nouveau nom de fichier** (ex. `couloir-etage.jpg`, `chambre-v2.jpg`) : le jeu garde les médias en cache sur le téléphone (jeu hors ligne), et une image remplacée sous le même nom peut rester affichée dans son ancienne version.

## Garde-fous
- iPhone : l'accès aux capteurs se demande au toucher d'un bouton (jamais d'office).
- Toujours une alternative tactile : la lampe suit le doigt, le 360° se glisse, la rose se tourne.
- « Réduire les effets brusques » coupe le vacillement de la lampe.

## Rapport d'enquête (`report`) — ajouté le 25/11/2026
Quand l'histoire se termine (effet `solveCase`), une affaire qui a un `report` n'est pas encore résolue : elle attend le rapport (drapeau `rapport = 'pret'`, notification « Rapport à remettre »). Pendant ce temps, les règles de l'enquête ne tournent plus (seuls les messages déjà prévus arrivent) et le téléphone redevient normal. Dans Dossiers, le joueur complète des phrases à trous ; une erreur dit seulement « 3 réponses sur 5 sont justes ». Le bon rapport résout l'affaire (conclusion, Le Fil, épilogue).
```ts
report: {
  text: ['Les images viennent de {qui}…', { when: { messageDelivered: 'h-1' }, text: 'Celui qui se faisait appeler « Hugo » {hugo}.' }],
  blanks: { qui: { answer: 'Gabriel Vannier', options: [{ text: 'Gabriel Vannier', requires: { mediaViewed: 'article' } }, { text: 'Hugo Mercier' }, …] } },
}
```
- Un choix n'apparaît qu'une fois découvert (`requires`). Préférer « a ouvert le document / reçu le message » à « a touché la phrase exacte », et vérifier que chaque bonne réponse est atteignable **dans toutes les fins** (les tests de parcours le vérifient : `src/game/__tests__/rapport-auto.ts`).
- Un paragraphe `{ when, text }` n'est demandé que si le joueur a vécu ce dont il parle.
- Au moins 3 choix par trou, des fausses pistes crédibles (dates du document, autres personnages).

## Fichier protégé par un code (`media.lock`)
`lock: { code: '1403', title: 'Enregistrement protégé', prompt: 'Saisissez le code à quatre chiffres.' }` : la visionneuse affiche un clavier ; le bon code pose le drapeau `verrou:<mediaId>`. Le code ne doit jamais être écrit tel quel : il se déduit en recoupant deux indices (« Elle écrit » : « le jour où je ne suis pas rentrée » + l'avis de décès → 1403 ; l'heure 23:48 des notes est une fausse piste).

## Vidéo image par image (`fps`, `filmstrip`)
Toutes les vidéos se regardent image par image (flèches, frise à glisser, comme dans Photos sur iPhone). Un indice peut n'exister que sur quelques images : zone avec `from`/`to` en secondes. Frise : `ffmpeg -i v.mp4 -vf "select='not(mod(n\,14))',scale=72:96,tile=10x1" -frames:v 1 frise.jpg`. À essayer dans le labo (onglet « Vidéo image par image »).
