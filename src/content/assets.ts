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
];

/** Fond d'écran par défaut (accueil et introduction). Remplacer par la photo définitive. */
export const WALLPAPER = '/media/system/wallpaper.jpg';
