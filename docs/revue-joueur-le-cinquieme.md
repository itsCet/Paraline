# Revue « expérience joueur » — Le cinquième

Méthode : compétence `player-experience` de [gstack-game](https://github.com/fagemx/gstack-game) (phases, vocabulaire d'émotions et barème de cette compétence). Revue faite le 21/11/2026 sur le code et le contenu actuels (`src/content/cases/le-cinquieme/`). Les constats s'appuient sur ce que le jeu affiche réellement : délais des messages, zones touchables, conditions des réponses.

La compétence prévoit de s'arrêter après chaque phase pour poser des questions. Ces arrêts ont été sautés à la demande de l'auteur ; les points à trancher sont regroupés à la fin.

Trois profils de joueur :

| Profil | Qui | Question qu'il se pose |
|---|---|---|
| **A. Joueur occasionnel** | Sur mobile dans les transports, 3 à 5 minutes d'attention, saute les textes de plus de 2 lignes | « Je comprends ? Ça vaut mon temps ? » |
| **B. Fan du genre** | A joué à Simulacra, Sara Is Missing, Her Story, Duskwood. Aime chercher, déteste qu'on le prenne par la main… et rater du contenu sans le savoir | « Qu'est-ce que ce jeu apporte de plus ? » |
| **C. Créateur de contenu** | TikTok / Twitch, cherche des moments à couper en clip de 15–30 s | « Est-ce que je couperais ce moment ? » |

---

## Phase 1 — Premier contact (0–30 s)

- **0:00** Trois écrans d'introduction sur la photo de Paris, avec « Passer l'introduction ». Le troisième dit maintenant de toucher les photos, d'ouvrir les infos et d'essayer les réglages.
- **~0:15** L'écran d'accueil propose « Faire l'essai / Plus tard ». Le widget Mail affiche **« Sarah Morel — Il y a quelqu'un sur nos photos »**, parce que la boîte de réception met la dernière enquête en haut.
- **Constat A/B** : la boîte contient **4 affaires à la fois**, sans durée ni difficulté. Le joueur prend celle du haut, c'est-à-dire « Le cinquième », la plus longue (15–20 min, 5 conversations, 4 actes). Pour quelqu'un qui découvre le jeu, c'est le cas le plus difficile en premier. *Niveau : à trancher (−1,5).*
- Ce qui marche, et pourquoi : l'objet du mail est une phrase étrange qui tient en une ligne. Le joueur occasionnel la lit en entier sur le widget sans rien ouvrir.

Émotions : A `Curious`, B `Curious`, C `Neutral → Curious`.

## Phase 2 — Prise en main (30 s – 5 min)

- **Accepter** fait arriver 5 messages en ~11 s dans le groupe « Chalet 🌲 », de 4 personnes différentes, avec 2 photos, plus un message privé de Sarah.
- **Nouveautés dans les 2 premières minutes** : conversation de groupe, 4 personnages, une conversation privée, des photos aux zones invisibles, le panneau Infos, les observations, le dossier. **Plus de 3 notions → risque de surcharge** pour le joueur occasionnel. *Signal automatique (−1).*
- **Premier « déclic »** : repérer la silhouette sur la glace dans `IMG_2037.jpg`. La zone dessinée fait environ 35 × 50 px, mais le jeu ajoute une tolérance de 22 px tout autour : la cible réelle fait environ 80 × 95 px. Le joueur occasionnel touche d'abord les quatre amis ; un rond confirme le toucher. *(Constat corrigé après vérification : pas de pénalité.)*
- Ce qui marche, et pourquoi : deux réponses sont proposées tout de suite (« Vous ne le reconnaissez vraiment pas ? », « Parlez-moi du chalet. »). Le joueur agit en moins d'une minute, et l'objectif est donné dès le mail : un garçon qui se rapproche d'une photo à l'autre.

Émotions : A `Curious → Overwhelmed → Engaged` s'il trouve la silhouette, sinon `Confused`. B `Curious → Focused`.

## Phase 3 — La session (5 – 20 min)

### 3.1 La chaîne du livre d'or (acte 2), point de friction n°1
Il faut : demander le chalet → ouvrir l'annonce → toucher « livre d'or » → **aller dans la conversation privée de Sarah** → demander la photo → zoomer sur la page de droite.
- Dans un document, les passages à toucher sont **invisibles** tant qu'on ne les a pas trouvés.
- Toucher un passage affiche seulement « Passage relevé dans le dossier ». **Aucun bouton « Demander à Sarah »**, alors que sur une photo le même type d'indice en propose un. L'interface n'est donc pas cohérente.
- La question à poser n'apparaît pas là où le joueur se trouve (le groupe), mais dans le fil privé de Sarah, que rien ne signale.

→ A reste bloqué : `Curious → Confused → Frustrated`, le schéma qui mène à l'abandon. *Bloquant pour A (−3).* B s'en sort, mais note l'incohérence. *(−1,5)*

### 3.2 Nouvelles réponses invisibles dans les autres conversations
Les confrontations (Malik avec le livre d'or, Malik avec 23:12) apparaissent **dans le fil de Malik**, mais ce fil ne reçoit aucun nouveau message, donc aucune pastille. Rien n'indique qu'une nouvelle réponse y est possible. *À trancher (−1,5) pour A et B.*

### 3.3 Julien bloque, puis les photos se retournent
- Le blocage est affiché (« Julien vous a bloqué. »). 15 s plus tard, Sarah écrit « Vous avez rouvert les photos ? ». Le temps mort reste court et il est mis en scène.
- **Moment fort** : les trois photos passent en version « de face », une notification « Téléphone » arrive et l'app apparaît. C : *clip évident*.
- « Comparer » avec une copie conservée ne fonctionne que si le joueur a pensé à conserver une copie avant. Peu le feront. C'est facultatif, ce n'est pas un défaut.

### 3.4 L'énigme de la date
02:14 vient de la messagerie (prononcé en lettres dans la transcription). La nuit du 14 au 15/02/2014 vient du livre d'or et de l'article. Il faut ensuite penser à régler la date du téléphone.
- Pour un joueur qui commence par cette enquête, c'est **sa première énigme de réglages**, d'où un grand saut. L'introduction le mentionne désormais. B : `Focused → Proud`. A : passe par l'ampoule. *(−1,5 pour A)*
- **Angle mort** : une fois l'affaire finie, le téléphone reste réglé en février 2014. Rien ne rappelle de remettre l'heure automatique avant l'enquête suivante. *(−1)*

### 3.5 Les fins
La fin complète (« ensemble ») n'est proposée que si Julien a raconté le pari dans son fil privé, après le déblocage. La notification « Julien : Je vous ai débloqué. » donne un signal. Mais un joueur qui va directement de la dernière photo au groupe ne voit que 2 choix et **ne sait pas qu'une meilleure fin existe**. B le découvre plus tard en ligne : `Proud → Cheated`. *À trancher (−1,5 pour B).*

Moments à couper en clip (C) : la carte qui se retourne sur toutes les photos, la messagerie « reçu à deux heures quatorze », la dernière photo prise depuis la glace, le reflet de la fin complète. Passage creux pour un live : la lecture des conversations entre deux découvertes, mais les messages restent courts.

## Phase 4 — Retour (session 2 et suivantes)
- Chaque affaire est indépendante, et Dossiers montre l'état de chacune. Le joueur qui revient retrouve sa partie là où il l'avait laissée (sauvegarde locale).
- **Angle mort, important pour B** : **impossible de rejouer une affaire terminée** pour voir une autre fin. La seule option est « Réinitialiser » dans Réglages, qui efface tout. Or « Le cinquième » a 3 fins et « Cette photo a changé » en a 2. *(−3 pour B)*

## Phase 5 — Long terme
Jeu narratif fini : 4 affaires, environ 1 h au total. Pas de boucle de long terme, et c'est assumé. La rejouabilité repose sur les fins alternatives, que le point précédent bloque.

---

## Notes

| Phase (poids) | A — occasionnel | B — fan du genre | C — créateur |
|---|---|---|---|
| Premier contact | 8,5 (30 %) | 8,5 (20 %) | 9 |
| Prise en main | 9 (35 %) | 10 (20 %) | 8,5 |
| Session | 3,0 (35 %) | 5,5 (25 %) | 8 |
| Retour | — | 7 (20 %) | — |
| Long terme | — | 6,5 (15 %) | — |
| **Total pondéré** | **6,8 / 10** | **7,5 / 10** | ~8,5 / 10 (non pondéré) |

Lecture : l'histoire et les moments forts tiennent pour le public visé (fans d'escape game) ; ce qui coûte des points, ce sont des signaux d'interface (réponses invisibles ailleurs, fin cachée, pas de rejouabilité). Le joueur occasionnel décroche à l'acte 2, à cause d'une chaîne d'action dont une étape se passe ailleurs que là où il regarde.

## Corrections proposées, par impact

1. **Livre d'or : relancer depuis le passage.** Quand un passage est relevé et qu'il ouvre une question, la bulle de confirmation propose l'action, par exemple « Passage relevé · **Demander à Sarah** ». Le composant de toast gère déjà un bouton d'action. Même règle pour tous les documents, par cohérence avec les photos. *Supprime le blocage n°1.*
2. **Pastille « nouvelle réponse possible »** sur une conversation quand une réponse vient de s'y débloquer (dans la liste Messages et sur l'icône). Ce n'est pas une aide : le joueur doit toujours trouver *quoi* dire et *pourquoi*.
3. **Rejouer une affaire terminée** depuis Dossiers (« Rejouer l'enquête »), sans toucher aux autres. Permet les fins alternatives.
4. **Durée et ambiance sur chaque affaire**, dans le mail d'acceptation : « ~10 min · surnaturel », « ~20 min · enquête longue ». Ou bien ordonner la boîte pour qu'un cas court arrive en haut à la première partie.
5. ~~Zones trop petites~~ : déjà couvert par la tolérance de 22 px.
6. **Fin de partie** : à la résolution, un message rappelle de remettre l'heure automatique si le téléphone est resté en 2014.
7. **Fin complète** : un indice dans l'histoire sans rien dévoiler, par exemple Inès dans le groupe : « Julien ne dit rien… Il vous a parlé ? ».

## Points à trancher par l'auteur
- Ordre des affaires à la première partie : garder « Le cinquième » en haut (accroche forte) ou mettre un cas plus court ?
- Les fins : faut-il que le joueur *sache* qu'il existe une meilleure fin (point 7), ou est-ce une découverte réservée aux plus curieux ?
- Rejouer une affaire (point 3) : souhaité ?

---

## Corrections appliquées (21/11/2026)

| # | Correction | Où |
|---|---|---|
| 1 | Passage relevé dans un document : la confirmation propose la question (« Passage relevé · Demander à Sarah »), comme sur une photo | `MediaViewer.tsx` |
| 2 | Pastille sur une conversation quand une nouvelle réponse y devient possible (liste Messages et icône), jusqu'à son ouverture | `engine.newReplies`, `MessagesApp`, `HomeScreen` |
| 3 | « Rejouer l'enquête » dans le dossier d'une affaire résolue : elle repart de zéro, les autres sont conservées | action `case/replay`, `FilesApp` |
| 4 | Durée et ton affichés sur chaque affaire dans Mail ; une enquête courte (« La chambre condamnée ») arrive en haut à la première partie | `about`, `CASES` |
| 5 | Déjà couvert (tolérance de toucher) | — |
| 6 | À la résolution, si l'heure est manuelle : notification « réactivez Réglage automatique » | `engine` (`solveCase`) |
| 7 | Sans l'aveu de Julien, Inès écrit « Julien ne dit rien… Il vous a parlé, à vous ? » avant le choix de fin | `le-cinquieme` |
