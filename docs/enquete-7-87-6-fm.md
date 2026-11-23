# Enquête 7 — « 87.6 FM » (étrange, énigmes sonores)

Statut : écrite et codée le 23/11/2026 (`src/content/cases/quatre-vingt-sept/`), sons générés (voix ElevenLabs, mixage et images cachées par le jeu), images de l'auteur installées (zones recalées). Enquête réservée (code d'accès). Durée : ~20 min. Casque conseillé.

## Vérité
Radio Vallée (87.6 FM), petite station de la colline de Saint-Clair. Henri Vasseur en était le technicien de nuit. Chaque nuit à 3 h, il fermait l'antenne par : « Ici Radio Vallée. Fin des émissions. Bonne nuit. »
Le 14 mars 1987, il emmène son fils Théo, 8 ans, au studio, lui dit de lire les nombres d'essai au micro « jusqu'à ce que je dise fin des émissions », et part dix minutes au café d'en face. Le feu prend peu avant 3 h. Théo ne quitte pas le micro.
Henri n'en a jamais parlé, même à sa petite-fille Noémie, qui ignore avoir eu un oncle. Depuis qu'elle a récupéré le radio-réveil d'Henri, il s'allume chaque nuit à 3 h sur 87.6 : Théo lit encore les nombres.

## Déroulé
1. **Mail de Noémie** : le radio-réveil s'allume à 3 h, une voix d'enfant lit des nombres. Pièces jointes : son enregistrement et une photo du poste. L'app **Radio** apparaît sur l'accueil.
2. **Les nombres** (enregistrement) : « 8-7-6 » (la fréquence), « 0-3-0-0 » (l'heure), « 1-4-0-3-8-7 » (une date). Noémie confirme : 3 h pile, toujours 87.6, et rien en journée.
3. **Le spectre** : le sifflement de fin cache un dessin, un pylône et « RADIO VALLÉE » (image réellement inscrite dans le son, visible avec « Afficher le spectre »). Noémie : son grand-père y était technicien. Elle trouve l'article de 1987 : l'incendie, Théo, le technicien absent, la phrase de fermeture.
4. **3 h** : heure du téléphone à 03:00, Radio sur 87.6 → Théo : « Papa a dit : tu lis les nombres jusqu'à ce que je dise fin des émissions. » « Papa ? Tu reviens quand ? » On peut enregistrer l'émission.
5. **Facultatif, le 14/03/1987 à 3 h** : la dernière nuit. « Il y a de la fumée sous la porte. » « Tu m'as dit de pas quitter le micro. Alors je reste. » Le spectre cache « REVIENS ». Le dire à Noémie change la conclusion.
6. **La phrase** : dire à Noémie que Théo attend qu'Henri ferme l'antenne. Le lendemain, Henri est prêt.
7. **L'adieu** : à 3 h sur 87.6, Henri : « Ici Radio Vallée. Fin des émissions. Bonne nuit, mon grand. » Théo : « Bonne nuit, papa. » Puis plus que du souffle. Noémie envoie la dernière photo.

## Stations
| Fréquence | Quand | Émission |
|---|---|---|
| 87.6 | 03:xx, Henri prêt | L'adieu |
| 87.6 | 03:xx, le 14/03/1987 | La dernière nuit |
| 87.6 | 03:xx | Théo lit les nombres |
| 99.3 | Toujours | Radio Horizon (musique de nuit) |
| Autres, ou 87.6 après l'adieu | — | Souffle |

## Fins
- **Fin des émissions** (Noémie sait ce qui s'est passé cette nuit-là) : la dernière nuit écoutée et racontée.
- **Fin des émissions** : sans la dernière nuit.

## Images (fournies par l'auteur) et zones à toucher

1. `radio-reveil.jpg` (portrait 1086 × 1448) : vieux radio-réveil des années 80 en plastique imitation bois, sur une table de nuit, dans le noir. **Écran à gauche : « 3:00 » en chiffres rouges** (zone x 0,13–0,51 ; y 0,46–0,56). **Cadran à droite, aiguille sur 87.6** (x 0,53–0,89 ; y 0,47–0,56). Photo prise au téléphone, lueur rouge de l'écran.
2. `emetteur-1987.jpg` (paysage 1086 × 724) : petit bâtiment technique en béton noirci par un incendie, au pied d'un pylône d'antenne radio en treillis, sur une colline, 1987. Photo de presse argentique, noir et blanc.
3. `theo-1987.jpg` (portrait 600 × 800) : un garçon de 8 ans souriant, assis devant un gros micro de studio radio des années 80, casque trop grand sur les épaules. Photo de famille argentique, couleurs passées.
4. `fin.jpg` (portrait 1086 × 1448) : au petit matin, chambre de maison de retraite, les mains ridées d'un vieil homme endormi posées sur le vieux radio-réveil éteint, lumière douce. Pas de visage.

## Sons (générés)
`enregistrement.mp3` (29 s : nombres + sifflement caché « RADIO VALLÉE »), `emission.mp3` (30 s), `nuit.mp3` (22 s, « REVIENS » caché), `adieu.mp3` (13 s), `horizon.mp3` (16 s), `/media/system/radio-souffle.mp3`. Spectres calculés depuis les fichiers (`*-spectre.jpg`). Théo : voix « Clara (Paraline) » montée d'un ton ; Henri : « Nicolas Petit », baissée ; Radio Horizon : « Paul K ». Script de mixage : à reproduire avec numpy (synthèse inverse du spectre).
