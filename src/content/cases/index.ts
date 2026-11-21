/**
 * Registre des enquêtes.
 *
 * Pour ajouter une enquête :
 *   1. créer `src/content/cases/<id>/index.ts` qui exporte une `CaseDefinition` ;
 *   2. placer ses médias dans `public/media/cases/<id>/` et les déclarer dans
 *      `src/content/assets.ts` ;
 *   3. l'importer et l'ajouter au tableau ci-dessous.
 *
 * L'ordre du tableau est l'ordre d'arrivée dans la boîte de réception.
 */
import type { CaseDefinition } from '../../game/types';
import { chambreCondamnee } from './chambre-condamnee';
import { photoChangee } from './photo-changee';
import { elleEcrit } from './elle-ecrit';
import { leCinquieme } from './le-cinquieme';

// La dernière du tableau arrive en haut de la boîte : on place en premier une enquête courte et guidée par son histoire.
export const CASES: CaseDefinition[] = [leCinquieme, elleEcrit, photoChangee, chambreCondamnee];
