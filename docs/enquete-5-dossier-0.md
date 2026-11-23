# Enquête 5 — « Dossier 0 » (horreur)

Statut : histoire validée par l'auteur (22/11/2026), images en cours de génération, audios générés par ElevenLabs. Identifiant prévu : `dossier-0`. Durée visée : 20–25 min. Avertissement de contenu dans le mail.

## Vérité interne
Le téléphone pro du joueur appartenait à **Victor Hessel**, enquêteur du réseau Paraline, disparu le 17 novembre 2024.
Sa dernière affaire : une maison du 12 rue des Tilleuls, à Saint-Aubin. **Clara Morand**, 16 ans, y vivait en 1998. Un incendie a tué sa mère ; Clara a disparu la même nuit, « fugue » selon son beau-père, **Bernard Morand**, aujourd'hui notable local.
Avant de disparaître, Clara avait enregistré un témoignage sur un mini-dictaphone : l'incendie n'était pas un accident. Victor a retrouvé et numérisé la cassette. Morand lui a proposé 5 000 € ; Victor a **supprimé l'enregistrement** le 16 novembre 2024. Le lendemain, il a disparu.
Clara est restée dans le téléphone. Elle veut que son témoignage soit entendu. Le joueur tient maintenant ce téléphone.

## Déroulé
- **Acte 1 — Le dossier restauré.** Mail de la *Coordination Paraline* : « Le téléphone que vous utilisez appartenait à Victor Hessel… une sauvegarde a restauré un dossier non résolu. » Dossier 0 apparaît. Les anciennes notes de Victor (2024) apparaissent dans Notes ; son fil avec sa cliente **Agnès Ferrand** (voisine de la maison) est lisible. Album « Victor » dans Photos : la maison, la chambre de Clara.
- **Acte 2 — Ce que Victor a fait.** Article de 1998 (incendie, Clara « en fugue ») ; avis de disparition de Victor (2024) ; notes de Victor de plus en plus courtes : « Morand m'a proposé 5 000 € », « J'ai supprimé l'enregistrement », « Elle est en colère ». Agnès répond encore (elle croit écrire à Victor). La chambre de Clara change : une silhouette pâle dans le coin, derrière la porte.
- **Bascule — Elle est ici.** Une photo apparaît dans la pellicule : **le bureau du joueur, la nuit, photographié depuis la porte** (le bureau de l'exercice de prise en main), lampe allumée, chaise tirée. Infos : « Appareil : ce téléphone », prise à l'heure réelle où le joueur était absent. À partir de là, quitter l'app est remarqué : au retour, une note « Tu es parti 3 min 12. Je suis restée. » (durée réelle).
- **Acte 3 — Elle se rapproche.** App **Localiser** : un contact sans nom, un point qui avance sur un plan fictif du quartier du joueur à chaque découverte. L'écran s'assombrit très lentement. Album **Récemment supprimés** : vide… sauf si la date du téléphone est réglée **avant le 16/11/2024** (l'élément supprimé « réapparaît », comme sur un vrai iPhone avant 30 jours). Le joueur récupère `temoignage_clara.m4a` : la voix de Clara, avec un chuchotement qui vient de l'oreille gauche au casque.
- **Acte 4 — Ne bouge plus.** Le joueur envoie le témoignage à Agnès (qui le transmettra). Clara écrit : « Ils vont m'entendre. Je peux partir, maintenant. Mais si quelqu'un me retient, je reste. Pose le téléphone. » puis « Ne bouge plus. » Un écran « Laisse-la partir » explique la règle (son bouton demande l'accès au mouvement sur iPhone). Compte de **30 secondes** : le point Localiser arrive, l'écran s'assombrit, des pas.
  - **Toucher l'écran ou bouger le téléphone** (gyroscope / accéléromètre) → **jumpscare** : visage plein écran + cri + vibration + flash, puis « Recommence. » et le compte repart à zéro.
  - **Tenir 30 s** → fin complète : le témoignage part, Clara écrit « Merci. Tu peux éteindre. », photo du bureau au matin, chaise vide, porte fermée. Le point disparaît de Localiser.
  - **Fermer l'app pendant le compte** → fin sombre : au retour, dernière photo, prise depuis le bureau vers la porte grande ouverte. Une silhouette dans l'embrasure. Affaire close sans apaisement.

## Mécaniques à coder
Dossier sans mail client (mail de la coordination) · notes « anciennes » datées · détection du départ du joueur (Page Visibility) · photo « prise par ce téléphone » horodatée à l'absence réelle · app Localiser (plan SVG fictif, point qui avance) · assombrissement progressif de l'écran · album Récemment supprimés conditionné à la date · audio spatialisé gauche · compte « ne bouge plus » avec détection de toucher · **jumpscare** (image, cri, vibration, flash) · trois fins.

## Garde-fous
- Avertissement dans le mail : « Contient des images et des sons destinés à effrayer. »
- Jamais la vraie caméra, la vraie position ni de vraies notifications système.
- « Réduire les effets brusques » : jumpscare sans flash ni vibration, image en fondu rapide, cri à volume réduit. « Sons du jeu » coupés : jumpscare silencieux mais visible.
- Le compte « ne bouge plus » se recommence à volonté ; l'aide (ampoule) donne la solution au niveau 3 (« Posez le téléphone et ne touchez à rien pendant 30 secondes »).

## Images (portrait 3:4, 1086 × 1448, photo réaliste de smartphone)
1. `maison.jpg` — la maison au crépuscule (photo de Victor, 2024).
2. `chambre.jpg` — la chambre de Clara restée en 1998.
3. `chambre-elle.jpg` — la même, avec la silhouette pâle dans le coin.
4. `bureau-derriere.jpg` — la nuit, le bureau du joueur photographié depuis l'embrasure de la porte, lampe allumée, chaise tirée : comme si quelqu'un se tenait derrière le joueur.
5. `bureau-porte.jpg` — fin sombre : photo prise depuis le bureau vers la porte grande ouverte, couloir noir, silhouette.
6. `bureau-matin.jpg` — fin complète : même cadrage que le n° 4, au matin, lampe éteinte, chaise vide.
7. `victor.jpg` — portrait de Victor (avis de disparition).
8. `clara-1998.jpg` — photo de classe de Clara, 1998.
9. `jumpscare.jpg` — le visage.

## Audios (générés par Claude via ElevenLabs)
Témoignage de Clara (voix de jeune fille, chuchoté par moments) · chuchotement spatialisé · cri du jumpscare · pas qui approchent · nappe de silence (souffle de pièce) · message vocal de Victor (dernier enregistrement).
