# Paraline

*Enquêtes paranormales.* Jeu web mobile : le joueur, enquêteur paranormal indépendant, mène ses affaires depuis son téléphone professionnel fictif (Mail, Messages, Photos, Dossiers, Notes, Réglages).

Cette version pose la base complète : téléphone, applications, introduction, exercice de prise en main, moteur d'enquête et sauvegarde. **Aucune enquête n'est encore intégrée.** Les applications affichent donc leurs états vides.

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
```

`build:fixture` remplace le registre des enquêtes par une enquête de test, grâce à un alias Vite. Le build normal n'en contient aucune trace.

**Vercel** : préréglage « Vite », commande `npm run build`, dossier de sortie `dist`. Aucune variable d'environnement.

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

Conditions disponibles : `all`, `any`, `not`, `caseAccepted`, `mailRead`, `mediaViewed`, `observationFound`, `observationFiled`, `replySent`, `messageDelivered`, `stepIs`, `flag`, `manualTime`, `manualDate`, `airplane`, `ruleFired`.

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

Dernière exécution le 18/11/2026.

- `npm run build` : OK (types + build de production).
- `npm test` : **18/18**. Ils couvrent :
  - un événement unique, même après un changement de réglage ou un rechargement ;
  - des conditions remplies dans deux ordres différents ;
  - une règle répétable ;
  - le mode avion et la reconnexion sans doublon ;
  - le double envoi d'une réponse ;
  - l'aller-retour de sauvegarde ;
  - les copies figées ;
  - les données invalides ;
  - la migration v0 et l'ajout d'une enquête ;
  - la résolution d'une affaire ;
  - la validation du contenu et du manifeste.
- `npm run e2e` (Chromium, iPhone 13 émulé) : **23/23**. Le parcours couvre :
  - l'introduction : ses trois écrans, le retour en arrière, le passage, la mémorisation ;
  - les états vides des applications ;
  - l'exercice complet, y compris son rechargement, son abandon et sa reprise ;
  - le zoom, le retour à l'image entière et le toucher hors zone ;
  - l'observation, sans doublon ;
  - le retour à l'accueil depuis chacune des six applications ;
  - les notes : création, sauvegarde, suppression puis annulation ;
  - la date et l'heure manuelles, leur conservation et le retour en automatique ;
  - le mode avion ;
  - l'accessibilité ;
  - un petit écran de 320×568 ;
  - une hauteur réduite par le clavier ;
  - la réinitialisation ;
  - une sauvegarde corrompue ;
  - l'affichage sur ordinateur (1440×900) ;
  - l'absence d'erreur JavaScript.
- `npm run e2e:fixture` (enquête de test) : **10/10**. Le parcours couvre :
  - la pièce jointe avant acceptation, avec proposition d'accepter ;
  - garder pour plus tard, les filtres et la recherche ;
  - l'acceptation unique ;
  - l'aide en trois niveaux ;
  - le double appui sur une réponse ;
  - l'indicateur de saisie ;
  - la question débloquée par une observation ;
  - le mode avion : réponse préparée, reprise sans doublon, message reçu hors réseau ;
  - la copie figée, la variante changée par la date et l'heure, la comparaison ;
  - la persistance après rechargement.

## Limites connues

- Le fond d'écran est une illustration vectorielle provisoire (marquée `placeholder` dans le manifeste). Une photographie est à prévoir.
- Les lecteurs audio et vidéo (lecture, progression, transcription, sous-titres, zones actives dans le temps) sont implémentés mais n'ont été vérifiés que par le typage. Aucun fichier audio ou vidéo n'existe encore pour les tester en conditions réelles.
- Tests faits sous Chromium uniquement, avec émulation mobile. Safari iOS et le vrai clavier virtuel restent à vérifier sur appareil.
- Le contenu HTML des documents d'enquête est inséré tel quel : il doit rester du contenu local de confiance.
- `npm audit` signale des vulnérabilités dans les dépendances de test (Vitest). Elles ne sont pas incluses dans l'application livrée : `npm audit --omit=dev` n'en trouve aucune.
