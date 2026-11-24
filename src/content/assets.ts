/**
 * Manifeste des assets du jeu.
 *
 * Chaque fichier servi depuis `public/` est déclaré ici avec son usage et son
 * origine. Les tests vérifient que les fichiers existent et que chaque média
 * référencé par une enquête est déclaré. Aucun média n'est jamais stocké
 * dans la sauvegarde : seuls ces chemins y figurent.
 */
export interface AssetEntry {
  /** Chemin public (commence par `/`). */
  path: string;
  kind: 'image' | 'audio' | 'video' | 'document' | 'icon';
  usage: string;
  /** Origine / droits. */
  source: string;
  /** Provisoire : à remplacer par un visuel définitif. */
  placeholder?: boolean;
}

export const ASSETS: AssetEntry[] = [
  { path: '/favicon.svg', kind: 'icon', usage: 'Icône d’onglet (logo Paraline)', source: 'Vectorisé d’après le logo fourni' },
  { path: '/media/system/logo.svg', kind: 'icon', usage: 'Logo Paraline (porte)', source: 'Vectorisé d’après le logo fourni' },
  {
    path: '/media/system/wallpaper.jpg',
    kind: 'image',
    usage: 'Fond d’écran du téléphone et de l’introduction (toits de Paris au crépuscule)',
    source: 'Photo fournie par l’auteur du jeu',
  },
  {
    path: '/media/tutorial/bureau.jpg',
    kind: 'image',
    usage: 'Exercice de prise en main : bureau, lampe, carnet, tiroir entrouvert',
    source: 'Photo fournie par l’auteur du jeu',
  },
  // Enquête « La chambre condamnée »
  { path: '/media/cases/chambre-condamnee/couloir-depart.jpg', kind: 'image', usage: 'A — IMG_4821.jpg, puis capture finale (mur plein)', source: 'Photo fournie par l’auteur du jeu' },
  { path: '/media/cases/chambre-condamnee/couloir-porte-fermee.jpg', kind: 'image', usage: 'B — capture_0317.jpg (porte fermée)', source: 'Photo fournie par l’auteur du jeu' },
  { path: '/media/cases/chambre-condamnee/camera-carton.jpg', kind: 'image', usage: 'C — IMG_5093.jpg (caméra débranchée)', source: 'Photo fournie par l’auteur du jeu' },
  {
    path: '/media/cases/chambre-condamnee/couloir-porte-entrouverte.jpg',
    kind: 'image',
    usage: 'D — capture_0317.jpg (porte entrouverte, feuille vierge ; texte ajouté en SVG)',
    source: 'Photo fournie par l’auteur du jeu',
  },
  { path: '/media/cases/chambre-condamnee/couloir-resolution.jpg', kind: 'image', usage: 'E — capture_0317.jpg (pièce vide)', source: 'Photo fournie par l’auteur du jeu' },
  // Enquête « Cette photo a changé »
  { path: '/media/cases/photo-changee/parc.jpg', kind: 'image', usage: 'parc.jpg / IMG_7714.jpg synchronisée (Paul ajouté, sans ombre)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/photo-changee/parc-original.jpg', kind: 'image', usage: 'IMG_7714.jpg, copie locale hors ligne (sans Paul)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/photo-changee/anniversaire.jpg', kind: 'image', usage: 'anniversaire.jpg / IMG_7802.jpg (Paul sans reflet)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/photo-changee/paul-souvenir.jpg', kind: 'image', usage: 'saint-malo.jpg (photo d’origine de Paul)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/photo-changee/plage-2026.jpg', kind: 'image', usage: 'IMG_6630.jpg (photo inexpliquée)', source: 'Image fournie par l’auteur du jeu' },
  // Enquête « Elle écrit dans mes notes »
  { path: '/media/cases/elle-ecrit/telephone-marc.jpg', kind: 'image', usage: 'IMG_2290.jpg : téléphone et boîte (numéro de série ajouté en SVG)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/elle-ecrit/nora.jpg', kind: 'image', usage: 'Photo de l’avis de décès', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/elle-ecrit/fond-voiture.jpg', kind: 'image', usage: 'Fond d’écran imposé pendant la hantise', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/elle-ecrit/enregistrement-0412.mp3', kind: 'audio', usage: 'Enregistrement nocturne de Marc (13,8 s)', source: 'Audio fourni par l’auteur du jeu (ElevenLabs), extrait de sa vidéo' },
  { path: '/media/cases/elle-ecrit/ne-pas-effacer.mp3', kind: 'audio', usage: 'Dernier message vocal de Nora (12 s)', source: 'Audio fourni par l’auteur du jeu (ElevenLabs), extrait de sa vidéo' },
  // Enquête « Le cinquième »
  { path: '/media/cases/le-cinquieme/groupe.jpg', kind: 'image', usage: 'IMG_2041.jpg — selfie devant la cheminée, Théo de dos', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/groupe-face.jpg', kind: 'image', usage: 'IMG_2041.jpg après l’acte 3 — Théo de face', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/cartes.jpg', kind: 'image', usage: 'IMG_2043.jpg — partie de cartes, Théo de dos dans l’embrasure', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/cartes-face.jpg', kind: 'image', usage: 'IMG_2043.jpg après l’acte 3 — Théo de face', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/ponton.jpg', kind: 'image', usage: 'IMG_2037.jpg — ponton, Théo de dos sur la glace', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/ponton-face.jpg', kind: 'image', usage: 'IMG_2037.jpg après l’acte 3 — Théo de face', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/livre-dor.jpg', kind: 'image', usage: 'livre_dor.jpg — page arrachée, empreinte en SVG', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/derniere-photo.jpg', kind: 'image', usage: 'IMG_0214.jpg — les quatre lampes s’éloignent', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/chalet.jpg', kind: 'image', usage: 'Annonce du chalet des Pins', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/reflet.jpg', kind: 'image', usage: 'IMG_8812.jpg — fin complète, Théo dans le reflet', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/le-cinquieme/messagerie-0214.mp3', kind: 'audio', usage: 'Messagerie : numéro masqué, reçu à 02:14', source: 'Audio fourni par l’auteur du jeu (ElevenLabs)' },
  { path: '/media/cases/le-cinquieme/lena.mp3', kind: 'audio', usage: 'Message vocal de Léna (fin complète)', source: 'Audio fourni par l’auteur du jeu (ElevenLabs)' },
  // Enquête « Dossier 0 »
  { path: '/media/cases/dossier-0/maison.jpg', kind: 'image', usage: 'IMG_7731.jpg — la maison du 12 rue des Tilleuls', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/chambre.jpg', kind: 'image', usage: 'IMG_7744.jpg — la chambre de Clara', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/visite-chambre.jpg', kind: 'image', usage: 'Visite à 360° : la chambre de Clara', source: 'Image fournie par l’auteur du jeu (Skybox AI)' },
  { path: '/media/cases/dossier-0/visite-couloir.jpg', kind: 'image', usage: 'Visite à 360° : le couloir, la porte brûlée', source: 'Image fournie par l’auteur du jeu (Skybox AI)' },
  { path: '/media/cases/dossier-0/chambre-elle.jpg', kind: 'image', usage: 'IMG_7744.jpg — Clara dans le coin', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/bureau-derriere.jpg', kind: 'image', usage: 'IMG_0001.jpg — votre bureau photographié depuis la porte', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/bureau-porte.jpg', kind: 'image', usage: 'IMG_0002.jpg — fin sombre', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/bureau-matin.jpg', kind: 'image', usage: 'IMG_0003.jpg — fin complète', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/victor.jpg', kind: 'image', usage: 'Avis de disparition de Victor Hessel', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/clara-1998.jpg', kind: 'image', usage: 'Photo de classe de Clara (article 1998)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/jumpscare.jpg', kind: 'image', usage: 'Visage du sursaut (épreuve « Ne bouge plus »)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/dossier-0/temoignage-clara.mp3', kind: 'audio', usage: 'Témoignage de Clara + chuchotement à gauche', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/victor-messagerie.mp3', kind: 'audio', usage: 'Dernier message vocal de Victor', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/jumpscare.mp3', kind: 'audio', usage: 'Cri du sursaut', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/pas.mp3', kind: 'audio', usage: 'Pas qui approchent', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/piece.mp3', kind: 'audio', usage: 'Silence de la pièce', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/coeur.mp3', kind: 'audio', usage: 'Battements de cœur (épreuve)', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/dossier-0/ne-bouge-plus.mp3', kind: 'audio', usage: '« Ne bouge plus » chuchoté', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  // Enquête « 12 % »
  { path: '/media/cases/douze-pourcent/piece.jpg', kind: 'image', usage: 'IMG_2231.jpg — le local carrelé au flash (soupirail, B-14)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/douze-pourcent/porte.jpg', kind: 'image', usage: 'IMG_2232.jpg — la porte métallique, autocollant de la mairie', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/douze-pourcent/dehors.jpg', kind: 'image', usage: 'IMG_2233.jpg — vue du soupirail : toboggan et clocher', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/douze-pourcent/hopital.jpg', kind: 'image', usage: 'IMG_0412.jpg — épilogue, pouce levé à l’hôpital', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/douze-pourcent/lea-portrait.jpg', kind: 'image', usage: 'Avis de recherche de Léa (fin sombre)', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/douze-pourcent/lea-vocal.mp3', kind: 'audio', usage: 'Message vocal de Léa (cloches)', source: 'Généré avec ElevenLabs (compte de l’auteur)' },
  // Enquête « 87.6 FM »
  { path: '/media/cases/quatre-vingt-sept/radio-reveil.jpg', kind: 'image', usage: 'IMG_3001.jpg — le radio-réveil à 3:00, aiguille sur 87.6', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/quatre-vingt-sept/emetteur-1987.jpg', kind: 'image', usage: 'Article de 1987 — l’émetteur incendié', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/quatre-vingt-sept/theo-1987.jpg', kind: 'image', usage: 'Article de 1987 — portrait de Théo', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/quatre-vingt-sept/fin.jpg', kind: 'image', usage: 'IMG_3044.jpg — fin : les mains d’Henri sur le radio-réveil éteint', source: 'Image fournie par l’auteur du jeu' },
  { path: '/media/cases/quatre-vingt-sept/enregistrement.mp3', kind: 'audio', usage: 'Enregistrement de Noémie (nombres, sifflement caché)', source: 'Voix ElevenLabs (compte de l’auteur), mixage et image cachée générés par le jeu' },
  { path: '/media/cases/quatre-vingt-sept/enregistrement-spectre.jpg', kind: 'image', usage: 'Spectre de l’enregistrement (RADIO VALLÉE)', source: 'Calculé depuis l’audio' },
  { path: '/media/cases/quatre-vingt-sept/emission.mp3', kind: 'audio', usage: '87.6 à 3 h : Théo lit les nombres', source: 'Voix ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/quatre-vingt-sept/emission-spectre.jpg', kind: 'image', usage: 'Spectre de l’émission', source: 'Calculé depuis l’audio' },
  { path: '/media/cases/quatre-vingt-sept/nuit.mp3', kind: 'audio', usage: '87.6 le 14/03/1987 à 3 h : la dernière nuit', source: 'Voix ElevenLabs (compte de l’auteur), image cachée générée par le jeu' },
  { path: '/media/cases/quatre-vingt-sept/nuit-spectre.jpg', kind: 'image', usage: 'Spectre de la dernière nuit (REVIENS)', source: 'Calculé depuis l’audio' },
  { path: '/media/cases/quatre-vingt-sept/adieu.mp3', kind: 'audio', usage: 'Fin des émissions : Henri et Théo', source: 'Voix ElevenLabs (compte de l’auteur)' },
  { path: '/media/cases/quatre-vingt-sept/horizon.mp3', kind: 'audio', usage: 'Radio Horizon 99.3 (station ordinaire)', source: 'Voix et musique ElevenLabs (compte de l’auteur)' },
  { path: '/media/system/veille.mp4', kind: 'video', usage: 'Garde l’écran allumé pendant « Ne bouge plus » (sans Wake Lock)', source: 'Généré par le jeu' },
  { path: '/media/system/radio-souffle.mp3', kind: 'audio', usage: 'App Radio : souffle entre les stations', source: 'Généré par le jeu' },
];

/** Fond d'écran par défaut (accueil et introduction). Remplacer par la photo définitive. */
export const WALLPAPER = '/media/system/wallpaper.jpg';
