# État du projet Paraline (au 24/11/2026)

Fiche de reprise : tout ce qu'il faut savoir pour continuer le travail.

## Où est quoi
- **Jeu en ligne** : https://paralinev1.vercel.app (projet Vercel `paralinev1`, équipe `team_m91qpz9Iyg532N7QLpWw1Ayk`). Mise en ligne manuelle : déploiement Vercel depuis la branche GitHub (`gitSource` org `itsCet`, dépôt `Paraline`, ref = la branche, sha = le dernier commit).
- **Branche de travail** : `claude/dreamy-knuth-0oi25z` (dépôt `itsCet/Paraline`). Ne pousser que là.
- **Labo** (mécaniques sans enquête) : https://paralinev1.vercel.app/?labo — lampe torche, photo à 360° (chambre de Clara → couloir), boussole.
- **Code d'accès** des enquêtes verrouillées : `1234` (`ACCESS_CODE`, `src/game/selectors.ts`). Seul « Dossier 0 » est ouvert sans code.
- **Remise à zéro générale** : `RESET_EPOCH` dans `src/game/save.ts` (actuellement 2). L'augmenter efface la partie de tous les joueurs au prochain chargement (son et accessibilité gardés).

## Enquêtes (ordre dans `src/content/cases/index.ts`)
| Id | Titre | Accès | Fiche |
|---|---|---|---|
| `dossier-0` | Dossier 0 (horreur) | ouvert | `docs/enquete-5-dossier-0.md` |
| `douze-pourcent` | 12 % (thriller temps réel) | code | `docs/enquete-6-douze-pourcent.md` |
| `quatre-vingt-sept` | 87.6 FM (radio, spectre) | code | `docs/enquete-7-87-6-fm.md` |
| `le-cinquieme` | Le cinquième | code | — |
| `elle-ecrit` | Elle écrit | code | — |
| `photo-changee` | La photo a changé | code | — |
| `chambre-condamnee` | La chambre condamnée | code | — |

« Dossier 0 » : Agnès envoie **la visite à 360° de la maison** (plus de photo à plat). Dictaphone sur la table de nuit, clé côté couloir, tableaux décrits ; quand la chambre change, Clara apparaît dans l'embrasure (`visite-chambre-elle.jpg`). « Ne bouge plus » : 30 s, écran « Laisse-la partir », toucher OU bouger le téléphone = sursaut, « Touche l'écran, et tu le regretteras. », écran maintenu allumé (Wake Lock).

## Mécaniques du moteur (voir `docs/mecaniques-capteurs.md`)
Batterie en temps réel (`battery`), radio FM (`radio.stations`, app Radio), spectre audio (`spectrogram`), lampe torche (`flashlight`), photo à 360° avec passages (`panorama.exits`), boussole (`compass`, app Boussole), condition `manualHour`, `flagAtMost`, effet `addFlag`, verrou par code (`locked`).

## Règles de travail
- **Remplacer une image = nouveau nom de fichier** (cache hors ligne du téléphone).
- Toujours : `npx vitest run` (91 tests) + parcours e2e `tests/e2e/*.mjs` (smoke, dossier0, douze, fm, cinquieme, photo, chambre, elle, labo ; fixture sur build `build:fixture` port 4174) avant de pousser.
- Bible de l'univers : `docs/univers.md` (règles du surnaturel, Coordination, ton, Saison 1, check-list d'écriture).
- Design : `docs/DESIGN.md`.

## Voix ElevenLabs (compte de l'auteur, clé injectée par le proxy pour `api.elevenlabs.io`)
Paul K `ecxPjiGTvAfpGEams6ec` (voix off des pubs) · Clara (Paraline) `AV6u59B5c8NvBeikKElq` (Clara, Théo monté d'un ton) · Lucie `KmqhNPEmmOndTBOPk4mJ` (Léa) · Nicolas Petit `2AGrjHJgmTgUqzy68M9W` (Henri).

## Pubs vidéo (Remotion, dossier de travail temporaire `promo2/` dans le scratchpad de la session — NON sauvegardé dans le dépôt)
- `paraline-pub-saison1.mp4` (28 s, voix off Paul K, composition `V4`)
- `paraline-pub-braise.mp4` (18,6 s, style « SuperX », sans voix, `V5`, bande-son composée `score_v5.py`)
- `paraline-pub-gameplay.mp4` (19,5 s, style braise + vrai jeu dans le téléphone, `V6`, captures `capture6.mjs`, `score_v6.py`)
Les fichiers vidéo ont été envoyés à l'auteur. Le projet Remotion disparaîtra avec le conteneur : pour retoucher une pub plus tard, il faudra le recréer.

## Plan
- **Saison 1** (16 enquêtes, une par semaine après le lancement, fil rouge « la Coordination », finale « Dossier 1 ») : idées dans la conversation et dans `docs/univers.md`.
- **Stores** : Capacitor (iOS + Android), achats via RevenueCat (3 enquêtes gratuites + Pass Saison 1), sauvegarde liée aux sauvegardes du téléphone + synchronisation iCloud / Google, code de transfert en option. Pas encore commencé.
- Prochaines idées : intégrer lampe torche (« Lampe torche », sem. 6), boussole (« Wi-Fi : AIDE_MOI », sem. 3) ; écrire « Appel en absence » (sem. 1).
