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
 * Aucune enquête n'est intégrée pour l'instant.
 */
import type { CaseDefinition } from '../../game/types';

export const CASES: CaseDefinition[] = [];
