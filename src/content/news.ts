/**
 * « Le Fil » : l'app d'actualités du téléphone, toujours sur l'accueil.
 *
 * Un article paraît à une date fixe (`date`) ou quand une condition d'enquête devient vraie
 * (`when`, évaluée dans l'enquête `caseId`) : il est alors daté du moment où l'enquête a été résolue.
 * `open` : bouton qui ouvre le mail de l'enquête (teaser).
 *
 * Règle d'écriture : villes et personnes fictives uniquement (un article ne doit jamais pouvoir
 * passer pour une vraie information une fois copié hors du jeu).
 */
import { evaluate, type CaseIndex } from '../game/engine';
import { isLocked } from '../game/selectors';
import type { Condition, GameState, Id } from '../game/types';

export interface NewsArticle {
  id: Id;
  source: string;
  kicker: string;
  title: string;
  /** Chapô, en gras sous le titre. */
  lead: string;
  body: string[];
  image?: { src: string; alt: string; caption?: string; position?: string };
  /** Date de parution fixe (ISO). Sinon : date de résolution de l'enquête `caseId`. */
  date?: string;
  caseId?: Id;
  /** Condition (dans l'enquête `caseId`) pour que l'article paraisse. */
  when?: Condition;
  /** Bouton « Ouvrir le dossier » : ouvre le premier mail de l'enquête. */
  open?: boolean;
}

const D0 = '/media/cases/dossier-0';

export const NEWS: NewsArticle[] = [
  {
    id: 'd0-hessel-un-an',
    source: 'La Gazette de Saint-Aubin',
    kicker: 'Saint-Aubin · Disparition',
    title: 'Un an après, l’enquêteur Victor Hessel reste introuvable',
    lead: 'Dans la nuit du 16 au 17 novembre 2024, il quittait la rue des Tilleuls à pied. Personne ne l’a revu depuis.',
    body: [
      'Victor Hessel, 46 ans, enquêteur indépendant, travaillait depuis l’été sur une affaire ancienne : l’incendie qui a coûté la vie à Sylvie Morand, en mars 1998, au 12 de la même rue. Sa fille Clara, 16 ans à l’époque, n’a jamais été retrouvée.',
      'Les recherches n’ont rien donné. Son téléphone professionnel, lui, aurait été confié à un réseau d’enquêteurs bénévoles. Contacté, ce réseau n’a pas souhaité s’exprimer.',
      '« Le soir où il est parti, il y avait de la lumière à l’étage, chez les Morand », se souvient une voisine. « Ça fait des années que personne n’habite plus là. »',
    ],
    image: { src: `${D0}/victor.jpg`, alt: 'Portrait de Victor Hessel, barbe grisonnante, manteau sombre.', caption: 'Victor Hessel, sur l’avis de recherche diffusé en 2024.', position: '50% 30%' },
    date: '2025-11-17T07:12:00',
    caseId: 'dossier-0',
    open: true,
  },
  {
    id: 'd0-affaire-rouverte',
    source: 'La Gazette de Saint-Aubin',
    kicker: 'Saint-Aubin · Justice',
    title: 'Incendie de 1998 : l’affaire Morand est rouverte',
    lead: 'Un enregistrement transmis cette nuit relance l’enquête sur la mort de Sylvie Morand, rue des Tilleuls.',
    body: [
      'Le parquet a annoncé la réouverture de l’enquête sur l’incendie du 12 rue des Tilleuls, qui avait coûté la vie à Sylvie Morand dans la nuit du 3 au 4 mars 1998.',
      'À l’origine de cette décision : un enregistrement audio transmis de façon anonyme. On y entend une adolescente, présentée comme Clara Morand, alors âgée de 16 ans, décrire la soirée du drame.',
      'En 1998, un détail était resté sans explication : la porte de la chambre de la victime était fermée à clé, de l’extérieur. Bernard Morand, son mari, devrait être entendu dans les prochains jours. Il n’a pas répondu à nos sollicitations.',
      'L’enregistrement aurait été retrouvé grâce aux notes de Victor Hessel, l’enquêteur disparu en novembre 2024. Le réseau qui l’a transmis n’a pas été identifié.',
      'Agnès Ferrand, voisine de la maison depuis trente ans, a d’abord accueilli la nouvelle en silence. Puis : « Cette nuit, pour la première fois, il n’y avait pas de lumière à l’étage. »',
    ],
    image: { src: `${D0}/clara-1998.jpg`, alt: 'Photo de classe de Clara Morand, 16 ans, en 1998.', caption: 'Clara Morand en 1998. Elle n’a jamais été retrouvée.', position: '50% 25%' },
    caseId: 'dossier-0',
    when: { flag: 'immobile', equals: 'held' },
  },
];

export interface NewsItem extends NewsArticle {
  /** Horodatage de parution (ms). */
  at: number;
  read: boolean;
  /** L'enquête liée est verrouillée par le code d'accès. */
  locked: boolean;
}

/** Articles parus, du plus récent au plus ancien. */
export function availableNews(state: GameState, cases: CaseIndex, list: NewsArticle[] = NEWS): NewsItem[] {
  const out: NewsItem[] = [];
  for (const a of list) {
    const def = a.caseId ? cases.byId.get(a.caseId) : undefined;
    if (a.caseId && !def) continue;
    let at: number | undefined = a.date ? new Date(a.date).getTime() : undefined;
    if (a.when) {
      if (!def || !evaluate(a.when, state, def.id)) continue;
      const p = state.cases[def.id];
      if (p?.status !== 'solved') continue;
      at = p.solvedAt ?? at;
    }
    if (at === undefined) continue;
    out.push({ ...a, at, read: !!state.readNews?.includes(a.id), locked: def ? isLocked(def, state) : false });
  }
  return out.sort((x, y) => y.at - x.at);
}

export function unreadNews(state: GameState, cases: CaseIndex): number {
  return availableNews(state, cases).filter((n) => !n.read).length;
}
