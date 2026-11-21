# gstack-game (sélection pour Paraline)

Compétences de revue de game design tirées de https://github.com/fagemx/gstack-game (licence MIT, voir LICENSE), commit dans `VERSION-SOURCE`.

Seules celles qui s'appliquent à un jeu narratif mobile sans économie ni multijoueur ont été gardées :

| Commande | Usage |
|---|---|
| `/player-experience` | Simule un joueur (profils types) qui découvre le jeu moment par moment |
| `/playtest` | Prépare et analyse un test avec de vrais joueurs |
| `/game-ux-review` | Revue de l'interface du téléphone et des apps |
| `/feel-pass` | Ressenti : retours visuels et sonores des actions |
| `/build-playability-review` | Jouabilité d'une version avant publication |
| `/game-qa` | Recette d'une version |
| `/pitch-review` | Revue d'un pitch (éditeur, financement) |
| `/plan-design-review` | Revue d'un plan d'interface, dont la liste des interfaces « génériques » à éviter |

`bin/` contient les petits utilitaires appelés par les compétences. La télémétrie est locale (`~/.gstack/`) et désactivée par défaut ; rien n'est envoyé.
