# TODOS

## Design Debt (from /plan-design-review — 2026-11-21)

Décisions prises dans `docs/DESIGN.md`. Toutes codées le 22/11/2026.

- [x] **Jouable hors ligne** : mettre en cache le jeu et les médias après la première visite (service worker), + état « Photo indisponible, pas de réseau » avec Réessayer dans la visionneuse. — Le public joue dans les transports ; aujourd'hui une coupure laisse les images vides sans message. Depends on: none. Added: 2026-11-21.
- [x] **Deux marqueurs dans Messages** : point plein = non lu ; petite bulle ambre au contour = nouvelle réponse possible. — Le même point signifie aujourd'hui deux choses. Depends on: none. Added: 2026-11-21.
- [x] **Contraste** : `--text-3` passe de `#74757c` (3,6:1) à `#8e8f96` (5,1:1). — Légendes et messages système sous le seuil AA. Depends on: none. Added: 2026-11-21.
- [x] **Cibles tactiles** : fermer la bannière, bouton d'action du toast, quitter le guide, flèches de la roue de l'heure → 44 px. — Actuellement 32 px. Depends on: none. Added: 2026-11-21.
- [x] **Légendes à 13 px minimum** : sous-titre de l'en-tête de fil, horodatage et messages système, nom d'auteur en groupe, étiquette d'objectif, niveau d'indice (aujourd'hui 11–12 px). Depends on: none. Added: 2026-11-21.
- [x] **États vides dans la voix du jeu**, avec le motif de la porte (Mail, Messages, Photos, Dossiers). Ex. Mail : « Personne n'a encore frappé à votre porte. » — Les textes actuels sont génériques. Depends on: none. Added: 2026-11-21.
- [x] **Dossiers façon dossier d'enquêteur** : onglet, tampon « Résolu », trombone sur les pièces, sur fond sombre. — Signature n°3 de l'identité. Depends on: états vides (même passe visuelle). Added: 2026-11-21.
- [x] **Chargement d'image** : squelette ambre discret pendant le chargement d'une photo lourde. Depends on: jouable hors ligne. Added: 2026-11-21.

## Différé

- [ ] Langue anglaise. Added: 2026-11-21.
- [ ] Synchronisation de la sauvegarde entre appareils. Added: 2026-11-21.
