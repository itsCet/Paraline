# Paraline

*Enquêtes paranormales.* Jeu web mobile : le joueur, enquêteur paranormal indépendant, mène ses affaires depuis son téléphone professionnel fictif (Mail, Messages, Photos, Dossiers, Notes, Réglages).

Contenu : téléphone, applications, introduction, exercice de prise en main, moteur d'enquête, sauvegarde, et quatre enquêtes complètes, disponibles dès le lancement : **« La chambre condamnée »** (surnaturelle, `src/content/cases/chambre-condamnee/`), **« Cette photo a changé »** (rationnelle, avec une fin à choix, `src/content/cases/photo-changee/`), **« Elle écrit dans mes notes »** (hantise du téléphone du joueur, `src/content/cases/elle-ecrit/`) et **« Le cinquième »** (longue, 15–20 min, conversation de groupe et trois fins, `src/content/cases/le-cinquieme/`).

React 19, TypeScript et Vite. Pas de backend, pas de compte, pas d'IA, pas de clé secrète.

## Commandes

```bash
npm install
npm run dev          # développement : http://localhost:5173
npm run build        # vérification des types + build de production dans dist/
npm run preview      # sert dist/
npm test             # tests du moteur, de la sauvegarde et du contenu (Vitest)
```

Vérifications de bout en bout avec Playwright. Elles utilisent le Playwright installé sur la machine, qui n'est pas une dépendance du projet :

```bash
npm run build && npx vite preview --port 4173 &
npm run e2e                                   # parcours joueur réel

npm run build:fixture && npx vite preview --outDir dist-fixture --port 4174 &
npm run e2e:fixture                           # écrans d'enquête avec l'enquête de TEST
npm run e2e:chambre                           # parcours complet de « La chambre condamnée » (sur le port 4173), sans indice
npm run e2e:photo                             # parcours complet de « Cette photo a changé », sans indice
npm run e2e:elle                              # parcours complet de « Elle écrit dans mes notes », sans indice (~2 min)
npm run e2e:cinquieme                         # parcours complet de « Le cinquième » jusqu'à la fin complète, sans indice (~3 min)
```

`build:fixture` remplace le registre des enquêtes par une enquête de test, grâce à un alias Vite. Le build normal n'en contient aucune trace.

**Vercel** : préréglage « Vite », commande `npm run build`, dossier de sortie `dist`. Aucune variable d'environnement.

## Revue de game design

`.claude/skills/` contient une sélection des compétences [gstack-game](https://github.com/fagemx/gstack-game) (MIT) utilisables dans Claude Code : `/player-experience`, `/playtest`, `/game-ux-review`, `/feel-pass`, `/build-playability-review`, `/game-qa`, `/pitch-review`, `/plan-design-review`. Voir `.claude/skills/gstack-game/README.md`. Première revue : `docs/revue-joueur-le-cinquieme.md`.

## Structure

```
src/
  game/                 logique pure, sans interface
    types.ts            format des enquêtes, conditions, effets, état sauvegardé
    engine.ts           évaluation des conditions, effets, règles, file de livraison
    reducer.ts          actions du joueur → nouvel état
    save.ts             sauvegarde versionnée, migrations, données invalides
    validate.ts         vérification statique d'une enquête
    selectors.ts        lectures dérivées (boîte de réception, médias…)
    store.tsx           liaison React (sauvegarde différée, horloge de livraison)
    clock.ts / sound.ts heure fictive, sons synthétisés
    __tests__/          tests et enquête de test (jamais livrée au joueur)
  content/
    cases/index.ts      registre des enquêtes (vide pour l'instant)
    tutorial/           exercice de prise en main (données isolées)
    assets.ts           manifeste des assets
  phone/                coque : barre d'état, accueil, intro, guide, visionneuse, navigation
  apps/                 Mail, Messages, Photos, Dossiers, Notes, Réglages
  components/           icônes, image zoomable, lecteurs audio/vidéo/document, UI
public/media/           assets (system/, tutorial/, cases/<id>/)
tests/e2e/              parcours Playwright
```

## Ajouter une enquête

1. Créer `src/content/cases/<id>/index.ts` qui exporte une `CaseDefinition` (voir `src/game/types.ts`).
2. Déposer les médias dans `public/media/cases/<id>/` et les déclarer dans `src/content/assets.ts`.
3. Ajouter l'enquête au tableau `CASES` de `src/content/cases/index.ts`.
4. Lancer `npm test` : `validateCase` vérifie les identifiants, les références, les trois niveaux d'aide, les coordonnées des zones et le manifeste.

Les parties existantes reçoivent la nouvelle enquête au prochain chargement. L'introduction, les préférences et les notes sont conservées.

Une enquête définit :

| Élément | Rôle |
|---|---|
| `initialMail` | e-mail qui crée l'affaire (accepter / garder pour plus tard) |
| `followUpMails` | e-mails de suivi rattachés à l'affaire, livrés par effet |
| `characters`, `threads`, `messages`, `openingMessages` | conversations scénarisées |
| `replies` | réponses proposées, avec condition `available` ou déblocage par `unlockReply` |
| `media` | images, audio, vidéo, documents, avec **variantes** et **zones d'intérêt** relatives |
| `observations` | fiches ouvertes par une zone, actions `addToFile`, `ask`, `examine` |
| `steps` | objectifs, avec trois niveaux d'aide (rappel, piste, solution) |
| `rules` | `when` (condition) → `effects` ; à usage unique par défaut |
| `conclusion` | texte affiché dans le dossier une fois l'affaire résolue |

Conditions disponibles : `all`, `any`, `not`, `caseAccepted`, `mailRead`, `mediaViewed`, `observationFound`, `observationFiled`, `replySent`, `messageDelivered`, `stepIs`, `flag`, `manualTime`, `manualDate`, `airplane`, `clockAuto`, `mediaVariant`, `ruleFired`.

Autres possibilités utilisées par la première enquête :
- `obstacles` : aide en trois niveaux, sur demande, qui suit le premier obstacle non résolu (ampoule de la barre du bas, ou section « Aide » du dossier) ;
- `overlay` sur une variante d'image : écriture vectorielle posée sur la photo, stable ou instable, nette au zoom ;
- `maxZoom`, et `alt` pour une description accessible propre à chaque variante ;
- `presence` sur un fil : contact joignable seulement sous condition (« Contact indisponible ») ;
- `holdUntil` sur une livraison : un message attend que la condition soit vraie ;
- `whenSolved` sur une réponse : épilogue après résolution ;
- `draft` sur un e-mail : brouillon sans destinataire ;
- `data-obs` dans un document HTML : passage que le joueur peut relever ;
- `autoFile` sur une observation : rangée directement dans le dossier ;
- `info` sur une variante : panneau « Infos » (métadonnées) dont les lignes peuvent être relevées ;
- `album` sur un média : regroupé dans Photos sous « Album partagé » ;
- `endings` : conclusion qui dépend de la fin choisie ;
- `alterCopies` : altère une copie conservée (dénouement surnaturel) ;
- `notes` + effets `writeNote` / `removeNote`, conditions `noteExists` / `noteWritten` : notes qui apparaissent dans l'app Notes du joueur ;
- condition `sound` : sons du jeu activés ou coupés ;
- `mediaViewed: 'id@variante'` : média consulté dans une version précise ;
- overrides `extraApp` (app Dictaphone sur l'accueil) et `ghostSetting` (réglage inconnu dans Réglages) ;
- `observationId` sur une ligne de transcription audio ;
- `members` sur un fil : conversation de groupe (nom de l'auteur au-dessus des bulles, notification « Groupe — Auteur : … ») ;
- `system` sur un message : ligne centrée sans bulle (« Malik a quitté la conversation. ») ;
- override `extraApp: 'telephone'` : app Téléphone (messagerie vocale, médias de l'album « Messagerie ») ;
- `tone: 'imprint'` sur un `overlay` : écriture en creux, presque invisible sans zoom ;
- `about` sur une enquête : durée et ton affichés dans Mail (« ~20 min · Enquête longue, trois fins »).

Côté joueur, le moteur gère aussi :
- **Rejouer une affaire résolue** depuis son dossier (action `case/replay`) : elle repart de zéro, les autres sont conservées ;
- **pastille « nouvelle réponse possible »** sur une conversation dès qu'une réponse s'y débloque (`newReplies`) ;
- un **passage relevé** dans un document propose directement la question associée, comme une zone de photo ;
- à la résolution, un **rappel** de réactiver l'heure automatique si une énigme l'a modifiée.

Effets disponibles : `deliverMessage`, `deliverMail` (suspendus en mode avion, sauf `ignoreAirplane`), `setMediaVariant`, `unlockReply`, `grantMedia`, `setStep`, `setFlag`, `phoneOverride` (temporaire, avec condition de fin `until`), `clearPhoneOverride`, `notify`, `log`, `solveCase`.

Exemple minimal d'une règle :

```ts
{
  id: 'reflet-revele',
  when: { all: [{ observationFound: 'reflet' }, { manualTime: '03:17' }] },
  effects: [
    { type: 'setMediaVariant', mediaId: 'couloir', variantId: 'porte' },
    { type: 'deliverMessage', messageId: 'client-panique', delayMs: 1500 },
    { type: 'setStep', stepId: 'comprendre-porte' },
  ],
}
```

Garanties du moteur, couvertes par les tests :

- une règle se déclenche dès que sa dernière condition devient vraie, quel que soit l'ordre des actions ;
- une règle à usage unique ne se répète jamais, ni après un changement d'application, ni après un rechargement, ni après une reconnexion ;
- un message ou un e-mail n'est jamais livré deux fois, même après plusieurs bascules du mode avion ;
- une seule enquête est active à la fois ; les modifications temporaires du téléphone sont annulées à la résolution.

## Sauvegarde

Tout est stocké dans `localStorage` (clé `paraline.save`, format versionné `SAVE_VERSION`). Seuls des chemins d'assets y figurent, jamais de média. Une sauvegarde illisible est copiée dans `paraline.save.corrupt`, puis une nouvelle partie démarre avec un avertissement, sans écran blanc. Pour faire évoluer le format, incrémenter `SAVE_VERSION` et ajouter une étape dans `MIGRATIONS` (`src/game/save.ts`).

## Vérifications réalisées

Dernière exécution le 19/11/2026.

- `npm run build` : OK.
- `npm test` : **47/47** (dont 7 pour « Elle écrit dans mes notes »). Détail précédent : **40/40** (dont 6 pour « Cette photo a changé » : enquêtes simultanées au lancement, une seule active, synchronisation de l'album, ordre libre, les deux fins, sauvegarde).
- `npm run e2e:elle` : **11/11**, parcours complet sans indice : bascule, notes qui reviennent, mode avion, son coupé, numéro de série, avis de décès, 14/03/2025 23:48, transmission, réglage « Nora ».
- `npm run e2e:photo` : **10/10**, parcours complet sans indice jusqu'à la fin douce, puis acceptation de la première affaire.
- `npm test` (détail précédent) : **34/34**. Dont 16 tests ciblés sur « La chambre condamnée » :
  - report puis acceptation ;
  - l'heure réglée avant la lecture du document ;
  - le mode avion activé trop tôt ;
  - le retour à la porte fermée sans perte de progression ;
  - une copie lisible immuable après reconnexion ;
  - les envois hors ligne préparés, sans doublon ;
  - Gabriel qui arrive avant l'article, et l'aide qui s'adapte ;
  - l'interruption puis le rétablissement du contact ;
  - une mauvaise réponse suivie d'une correction ;
  - une fin qui n'arrive qu'au retour en automatique ;
  - aucune anomalie rejouée après résolution ;
  - un rechargement à chaque étape ;
  - la migration d'une sauvegarde antérieure ;
  - des indices affichés uniquement sur demande.
- `npm run e2e:chambre` (Chromium, iPhone 13 émulé) : **20/20**. Parcours complet dans l'interface, sans indice, avec le son coupé :
  - les pièces jointes consultées avant acceptation, puis report et acceptation ;
  - le document comparatif ;
  - 03:17 : écriture illisible qui se recompose ;
  - un petit écran 320×568 avec zoom ×10 sur la feuille ;
  - un rechargement ;
  - le mode avion : écriture lisible et description accessible mise à jour ;
  - la copie conservée ;
  - une question préparée hors ligne puis envoyée une seule fois ;
  - l'article relevé ;
  - la copie restée lisible ;
  - Gabriel, puis l'interruption et le rétablissement du contact ;
  - une mauvaise réponse suivie d'une correction ;
  - la porte ouverte ;
  - le retour en automatique, la résolution et le brouillon ;
  - aucune anomalie rejouée après résolution ;
  - aucune erreur JavaScript.
- `npm run e2e` : **23/23** (base du téléphone et exercice).
- `npm run e2e:fixture` : **10/10**.

## Limites connues

- Fond d’écran et photo de l’exercice : photos fournies (`public/media/system/wallpaper.jpg`, `public/media/tutorial/bureau.jpg`).
- L'écriture de la feuille utilise une police manuscrite du système (Bradley Hand, Segoe Print…). À défaut, Chromium sous Linux affiche une police à chasse fixe.
- Les lecteurs audio et vidéo (lecture, progression, transcription, sous-titres, zones actives dans le temps) sont implémentés mais n'ont été vérifiés que par le typage. Aucun fichier audio ou vidéo n'existe encore pour les tester en conditions réelles.
- Tests faits sous Chromium uniquement, avec émulation mobile. Safari iOS et le vrai clavier virtuel restent à vérifier sur appareil.
- Le contenu HTML des documents d'enquête est inséré tel quel : il doit rester du contenu local de confiance.
- `npm audit` signale des vulnérabilités dans les dépendances de test (Vitest). Elles ne sont pas incluses dans l'application livrée : `npm audit --omit=dev` n'en trouve aucune.
