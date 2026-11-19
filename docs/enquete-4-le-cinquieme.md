# Enquête 4 — « Le cinquième » (à intégrer)

Statut : histoire validée par l'auteur, **assets en cours de génération** (10 images, 2 audios). Code non commencé.
Durée visée : 15–20 min, 4 actes. Identifiant prévu : `le-cinquieme`.

## Vérité interne
Il y a 12 ans (nuit du 14 au 15 février 2014), Sarah, Julien, Inès, Malik et **Théo** (20 ans, bonnet rouge) louent un chalet au bord du lac de Vaulx. Pari : Théo traverse le lac gelé, la glace cède. Les quatre paniquent, partent avant l'aube et ne disent jamais qu'ils étaient là. Officiellement, Théo s'est noyé seul. Il veut que la vérité soit dite à sa sœur **Léna**. Sarah a refoulé ce souvenir.

## Déroulé
- **Acte 1 — Quatre versions** : mail de Sarah (`groupe.jpg`, Théo de dos au fond). Conversation de **groupe** « Chalet 🌲 » (4 interlocuteurs). Versions contradictoires. Infos des photos : une photo à 23:12 alors que « tout le monde dormait ». Théo un peu plus proche sur chaque photo.
- **Acte 2 — Le chalet a une mémoire** : annonce du chalet (HTML, `chalet.jpg`), `livre-dor.jpg` (page arrachée ; empreinte en SVG : « Merci pour tout — S., J., I., M. et Théo — nuit du 14 au 15 février 2014 »). Conversations **privées** ; **confrontation par preuves** (réponses débloquées par observations). Malik avoue en premier, Inès donne le prénom, Julien nie et **bloque** le joueur un temps.
- **Acte 3 — Il se tourne** : toutes les photos passent en variante « face » (comparaison possible avec les copies conservées). Nouvelle app **Téléphone** : message vocal masqué « Reçu à deux heures quatorze » (`messagerie_0214.mp3`). GPS dans les Infos : milieu du lac. Énigme : téléphone réglé le 15/02/2014 à 02:14 (accepter aussi le 14) → `derniere-photo.jpg` (les quatre s'éloignent sur la rive). Sarah : « Je m'en souviens. Je ne voulais pas m'en souvenir. »
- **Acte 4 — Dire la vérité** : Inès retrouve Léna. Trois fins : les quatre parlent ensemble (fin complète, audio `lena.mp3`, puis `reflet.jpg` : 4 à la terrasse, 5 dans le reflet, Théo sourit) ; le joueur parle à leur place (« Pourquoi ce n'est pas eux ? ») ; personne (Théo reste sur les photos, affaire close sans apaisement).

## Nouvelles mécaniques à coder
Fil de groupe multi-interlocuteurs · fils privés parallèles · confrontation par preuves · contact qui bloque puis débloque · app Téléphone (messagerie vocale) · variantes appliquées à toutes les pièces reçues · GPS dans les Infos · trois fins (`endings`).

## Assets demandés (portrait 3:4, ≥ 1086 × 1448, photos réalistes de smartphone)
Personnages : Sarah (frange, pull crème), Julien (barbe, lunettes rondes, chemise à carreaux), Inès (cheveux noirs bouclés, pull bordeaux), Malik (grand, crâne rasé, sweat gris), Théo (20 ans, bonnet rouge, doudoune bleu marine, jamais effrayant).
1. `groupe.jpg` / 2. `groupe-face.jpg` — cheminée, Théo au fond de dos / de face (même image retouchée).
3. `cartes.jpg` / 4. `cartes-face.jpg` — partie de cartes, Théo dans l'embrasure.
5. `ponton.jpg` / 6. `ponton-face.jpg` — ponton, lac gelé, silhouette lointaine.
7. `livre-dor.jpg` — page arrachée + page vierge à lignes en lumière rasante.
8. `derniere-photo.jpg` — nuit 2014, depuis le lac vers la rive, 4 silhouettes avec lampes qui s'éloignent.
9. `chalet.jpg` — extérieur du chalet sous la neige (annonce).
10. `reflet.jpg` — terrasse vitrée, 4 amis ; reflet discret : 5, Théo sourit.

Audios (ElevenLabs) :
- `messagerie_0214.mp3` (~15 s) : robot « Vous avez un nouveau message. Reçu à deux heures quatorze. » ; vent, glace qui craque ; jeune homme : « Je vous vois… vous partez ? » … « Vous êtes partis. »
- `lena.mp3` (~25 s) : « C'est Léna. Je viens de lire votre message. Pendant douze ans, j'ai cru qu'il était sorti seul, cette nuit-là. … Je ne sais pas encore si je vous en veux. Mais merci de me l'avoir dit. Il aurait voulu ça. »

## Audios reçus et calés (reconnaissance vocale)
- `public/media/cases/le-cinquieme/messagerie-0214.mp3` (≈ 9 s) : 0,0–2,9 « Vous avez un nouveau message. Reçu à deux heures quatorze. » · 3,4–4,3 « Je vous vois… » · 5,5–7,1 « Vous partez ? » · 7,2–8,8 « Vous êtes partis. »
- `public/media/cases/le-cinquieme/lena.mp3` (≈ 17 s) : 0,0–4,0 « C'est Léna. Je viens de lire votre message. » · 5,5–9,1 « Pendant douze ans, j'ai cru qu'il était sorti seul, cette nuit-là. » · 10,6–12,4 « Je ne sais pas encore si je vous en veux. » · 14,1–17,0 « Mais merci de me l'avoir dit. Il aurait voulu ça. »
