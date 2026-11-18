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
    path: '/media/system/wallpaper-night.svg',
    kind: 'image',
    usage: 'Fond d’écran du téléphone (toits de nuit sous la pluie)',
    source: 'Illustration vectorielle originale',
    placeholder: true,
  },
  {
    path: '/media/tutorial/bureau.svg',
    kind: 'image',
    usage: 'Exercice de prise en main : bureau, lampe, carnet, tiroir entrouvert',
    source: 'Illustration vectorielle originale',
  },
  // Enquêtes : ajouter ici les médias de `public/media/cases/<id>/`.
];

/** Fond d'écran par défaut (accueil et introduction). Remplacer par la photo définitive. */
export const WALLPAPER = '/media/system/wallpaper-night.svg';
