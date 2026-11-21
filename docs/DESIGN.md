# Paraline : système de design et plan d'interface

Source de vérité pour toute nouvelle interface ou enquête. Rédigé le 21/11/2026 par `/plan-design-review`, à partir du jeu tel qu'il est codé (`src/styles/global.css`, `src/apps/`, `src/phone/`). Une ligne marquée **À FAIRE** est une décision prise, pas encore codée (voir `TODOS.md`).

---

## 1. Direction artistique

**Contrat d'immersion :** « c'est mon téléphone ». Le joueur tient un vrai smartphone. L'interface reprend les codes d'iOS (Mail, Messages, Photos, Notes, Réglages) parce que ce réalisme fait peur : quand le fond d'écran change ou qu'une note s'écrit toute seule, c'est *son* téléphone qui est touché.

**Signatures Paraline** (ce qui distingue le jeu de Simulacra ou Sara Is Missing) :
1. **Ambre sur nuit.** Un seul accent, l'ambre (`--amber`), réservé à ce qui fait avancer l'enquête : observation, réponse, indice, bouton principal. Tout le reste est neutre.
2. **La porte.** Le logo (porte entrouverte, lumière qui filtre) est le motif du jeu : écran d'accueil du bureau, fin des vidéos. **À FAIRE :** il apparaît aussi dans les états vides et les chargements.
3. **Le dossier d'enquêteur.** Dossiers est l'app « à soi » du joueur, pas une app d'iPhone. **À FAIRE :** elle prend l'allure d'un dossier papier (onglet, tampon « Résolu », trombone sur les pièces), tout en restant sur fond sombre.
4. **Le téléphone hanté.** Les enquêtes surnaturelles modifient le téléphone lui-même (fond d'écran, notes, app qui apparaît, réglage inconnu). C'est la marque du jeu : l'interface *est* un personnage.

**Anti-références :** pas d'interface de « jeu d'horreur » (sang, typographie gothique, effets de glitch gratuits) ; pas de bulles de tutoriel par-dessus l'écran ; pas d'aide qui s'affiche sans qu'on la demande.

## 2. Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `--bg` | `#14151a` | Fond des apps |
| `--surface` / `-2` / `-3` | `#1e1f24` / `#2a2b31` / `#3a3b42` | Cartes, lignes, bulles reçues |
| `--text` | `#f4f1ea` | Texte principal (16,2:1 sur le fond) |
| `--text-2` | `#a8a8ae` | Texte secondaire (7,7:1) |
| `--text-3` | `#74757c` → **À FAIRE `#8e8f96`** | Légendes, messages système. Actuellement 3,6:1 sur `--surface`, sous le seuil AA de 4,5:1 pour du texte de 12–13 px. `#8e8f96` donne 5,1:1 |
| `--amber` | `#efb35c` | Accent unique (9,8:1 sur le fond). Bouton principal en dégradé `--amber-grad`, texte `--amber-ink` (9,8:1) |
| `--green` / `--red` / `--blue` | `#30d158` / `#ff453a` / `#0a84ff` | Uniquement pour les éléments système d'iOS (interrupteurs, badges, suppression). Jamais pour une information d'enquête |

Règle : aucune information n'est donnée par la couleur seule. Les étiquettes de statut ont toujours un texte (« En cours », « Résolu »), les pastilles ont une forme.

## 3. Typographie

| Niveau | Taille | Usage |
|---|---|---|
| Titre d'app | 36 px, très gras | « Messages », « Dossiers » (titre large iOS) |
| Titre de section / feuille | 20–22 px | Feuille d'observation, titre de dossier |
| Corps | 16–17 px | Bulles, e-mails, lignes |
| Légende | 13 px minimum | Méta, notes de bas de page. **À FAIRE :** remonter à 13 px les cinq styles à 11–12 px (sous-titre de l'en-tête de fil, horodatage et messages système, nom d'auteur dans un groupe, étiquette d'objectif, niveau d'indice) |

Police : celle du système (San Francisco sur iPhone, Roboto sur Android), pour le réalisme. Écriture manuscrite des pièces : police manuscrite du système, ou Caveat. Le réglage « Texte plus grand » agrandit l'ensemble.

## 4. Composants

| Composant | Rôle | Règle |
|---|---|---|
| Bouton principal | Dégradé ambre, 44 px de haut minimum | Une seule action principale par écran (Accepter l'enquête, Envoyer la réponse préparée) |
| Bouton secondaire | Surface, texte clair | Conserver une copie, Comparer, Rejouer l'enquête |
| Réponse proposée | Ligne bordée, chevron | Panneau « Votre réponse » en bas du fil |
| Feuille (sheet) | Panneau qui monte du bas | Observation, Infos du fichier, Indices, Accepter |
| Bannière | Notification en haut | Bouton fermer : **À FAIRE 44 px** (actuellement 32 px) |
| Toast | Confirmation en bas, avec action facultative | « Passage relevé · Demander à Sarah ». Bouton d'action : **À FAIRE 44 px** (actuellement 32 px) |
| Pastille de fil | Point ambre plein | Message non lu |
| Marqueur de réponse | **À FAIRE :** petite bulle ambre au contour seul | Nouvelle réponse possible (distinct du non-lu) |
| Anneau d'observation | Ellipse ambre | Zone relevée sur une photo |

## 5. Mouvement

Courbe `--ease` `cubic-bezier(0.2, 0.8, 0.2, 1)`, durée `--dur` 220 ms. Les apps s'ouvrent par fondu et légère montée. L'écriture instable des pièces se recompose lentement (1,6 s), sans clignotement. « Réduire les animations » coupe les déplacements ; « Réduire les effets brusques » remplace l'écriture instable par une texture fixe.

---

## 6. Écrans et hiérarchie

```
Intro (3 écrans) ─▶ Accueil ─┬─▶ Mail ─▶ e-mail ─▶ pièce jointe (visionneuse) ─▶ feuille d'observation
                             │            └─▶ Accepter l'enquête ─▶ Messages
                             ├─▶ Messages ─▶ fil ─▶ réponses / pièce jointe
                             ├─▶ Photos (pièces reçues, copies, albums)
                             ├─▶ Dossiers ─▶ dossier d'une affaire (objectif, observations, aide, rejouer)
                             ├─▶ Notes · Réglages (avion, heure, audio, accessibilité, aide, sauvegarde)
                             ├─▶ [Dictaphone] [Téléphone]  (ajoutées par une enquête)
                             └─▶ ampoule (barre du bas) ─▶ feuille Indices
   Partout : barre du bas = retour à l'accueil · bannière = raccourci vers le fil ou l'e-mail concerné
```

| Écran | 1er | 2e | 3e |
|---|---|---|---|
| Accueil | Heure (atmosphère, modifiable par l'enquête) | Widget Mail : dernière demande non lue | Grille d'apps et dock (Mail, Messages, Dossiers) |
| Fil de messages | Dernière bulle reçue | Panneau « Votre réponse » | En-tête : contact et sa joignabilité (« Julien vous a bloqué ») |
| Visionneuse | L'image (zoom, zones invisibles) | « Un détail vous intrigue ? » et observations relevées | Infos du fichier, Conserver, Comparer |
| Dossier | Objectif ou conclusion | Observations | Aide, historique, échanges |

Test du coup d'œil (1 seconde) : sur l'accueil, le joueur voit l'heure et la demande en cours ; dans un fil, la dernière phrase reçue. C'est voulu : ce sont les deux leviers de tension du jeu.

## 7. États d'interaction

Légende : ✅ conçu et codé · **À FAIRE** décidé · — sans objet.

| Fonction | Vide | Chargement | Erreur / réseau | Verrouillé | Hors ligne (mode avion du jeu) | Résolu |
|---|---|---|---|---|---|---|
| Mail | ✅ « Aucune nouvelle demande… » (**À FAIRE** : voix du jeu + porte) | — | — | ✅ « Une enquête est déjà en cours » | ✅ e-mails retenus | ✅ étiquette Résolu |
| Messages | ✅ texte (**À FAIRE** voix du jeu) | ✅ « en train d'écrire » si imminent | — | ✅ contact indisponible ou bloqué | ✅ réponse préparée, envoyée au retour | ✅ épilogue (`whenSolved`) |
| Visionneuse image | — | **À FAIRE** squelette ambre | **À FAIRE** « Photo indisponible, pas de réseau » + Réessayer | — | — | ✅ |
| Audio / vidéo | ✅ « Enregistrement vide » | — | ✅ « Fichier audio indisponible. La transcription reste disponible. » | — | — | — |
| Document | — | ✅ « Chargement… » | ✅ « Document indisponible » | — | — | — |
| Dossiers | ✅ texte (**À FAIRE** voix du jeu) | — | — | ✅ « Pour rejouer, terminez d'abord… » | — | ✅ conclusion + Rejouer |
| Aide | — | — | — | — | — | ✅ ampoule masquée |
| Sauvegarde | — | — | ✅ sauvegarde illisible copiée + bandeau | — | — | — |
| Jeu entier, réseau réel coupé | — | — | **À FAIRE** jouable hors ligne après la 1re visite (mise en cache du jeu et des médias) | — | — | — |

Couverture des cases concernées : 21 sur 28 conçues (75 %). Avec les **À FAIRE** : 28 sur 28.

## 8. Parcours et émotions

| Moment | Le joueur fait | Doit ressentir | Ce qui le porte |
|---|---|---|---|
| 0–15 s | Intro, accueil | Curieux | Photo de Paris au crépuscule ; objet de mail étrange lisible sur le widget |
| 1re minute | Ouvre une demande | Concerné | Pièces jointes consultables avant d'accepter ; « Accepter / Plus tard » |
| 2–5 min | Touche une photo | Déclic : « je peux fouiller » | Rond au toucher, feuille d'observation, toast « Ajouté au dossier » |
| Blocage | Ne trouve plus | Pas abandonné | Ampoule : rappel, puis piste, puis solution ; jamais d'office |
| Bascule surnaturelle | Le téléphone change | Inquiet, ravi | Fond d'écran, note, app nouvelle, notification d'un contact « masqué » |
| Fin d'affaire | Choisit, conclut | Fier, ému | Conclusion selon la fin ; rappel de l'heure ; « Rejouer l'enquête » |
| Retour J+1 | Rouvre le jeu | Retrouve ses repères | Sauvegarde locale, autres demandes en attente dans Mail |

Non conçu, et assumé : rétention long terme (jeu narratif fini) et notifications hors du jeu.

## 9. Saisie et accessibilité

- **Tactile d'abord** : cibles de 44 px minimum (boutons, icônes, lignes), à l'exception des **À FAIRE** de la section 4. Tolérance de 22 px autour des zones de photo. Pincer et double-toucher pour zoomer.
- **Ordinateur** : téléphone encadré au centre ; molette et boutons + / − pour zoomer, Échap pour fermer.
- **Paysage** : écran « Tournez votre téléphone » sur mobile.
- **Accessibilité** : chaque audio a sa transcription (le son n'est jamais obligatoire, sauf l'énigme qui demande au contraire de le couper) ; chaque variante d'image a une description (`alt`) ; réglages Réduire les animations, Réduire les effets brusques, Texte plus grand. Contraste : **À FAIRE** `--text-3`.

## 10. Décisions

| Décision | Choix |
|---|---|
| Identité | Réalisme iOS + 3 signatures (dossier, porte, voix du jeu) |
| Réseau réel | Jeu jouable hors ligne après la première visite |
| Pastilles | Deux marqueurs : non lu (point) et réponse possible (bulle) |
| Langue | Français uniquement (différé) |
| Sauvegarde | Locale à l'appareil, pas de synchronisation (différé) |
| Gabarit d'enquête | Toute nouvelle enquête suit les sections 6–7 : écrans utilisés, états propres (contact bloqué, téléphone modifié…), et au moins une « signature » de téléphone hanté si elle est surnaturelle |

## Design Review Status

| Review | Date | Score | Status |
|--------|------|-------|--------|
| /plan-design-review | 2026-11-21 | 3,5/10 → 8,5/10 | DONE_WITH_CONCERNS (décisions prises, code à faire : `TODOS.md`) |
