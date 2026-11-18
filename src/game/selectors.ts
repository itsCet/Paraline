/** Lectures dérivées de l'état, partagées par les applications. */
import { TUTORIAL_MAIL } from '../content/tutorial';
import { currentVariant, findMail, type CaseIndex } from './engine';
import type { CaseDefinition, Character, GameState, Id, MailDef, MediaDef, MediaVariant } from './types';

export interface InboxItem {
  id: Id;
  caseId: Id | null;
  /** E-mail initial d'une affaire (sinon suivi ou exercice). */
  initial: boolean;
  tutorial: boolean;
  fromName: string;
  initials: string;
  color?: string;
  subject: string;
  preview: string;
  timeLabel: string;
  body: string[];
  attachments: Id[];
  read: boolean;
}

export function character(def: CaseDefinition, id: Id): Character {
  return def.characters.find((c) => c.id === id) ?? { id, name: id, initials: id.slice(0, 1).toUpperCase() };
}

function mailItem(def: CaseDefinition, m: MailDef, initial: boolean, state: GameState): InboxItem {
  const who = character(def, m.from);
  return {
    id: m.id,
    caseId: def.id,
    initial,
    tutorial: false,
    fromName: who.name,
    initials: who.initials,
    color: who.color,
    subject: m.subject,
    preview: m.preview ?? m.body[0] ?? '',
    timeLabel: m.timeLabel,
    body: m.body,
    attachments: m.attachments ?? [],
    read: state.readMails.includes(m.id),
  };
}

/** Boîte de réception, du plus récent au plus ancien. */
export function inbox(state: GameState, cases: CaseIndex): InboxItem[] {
  const items: InboxItem[] = [];
  for (const def of [...cases.list].reverse()) {
    const p = state.cases[def.id];
    if (!p) continue;
    for (const id of [...p.deliveredMails].reverse()) {
      const m = findMail(def, id);
      if (m) items.push(mailItem(def, m, false, state));
    }
    items.push(mailItem(def, def.initialMail, true, state));
  }
  if (state.tutorial.status === 'active') {
    items.unshift({
      id: TUTORIAL_MAIL.id,
      caseId: null,
      initial: false,
      tutorial: true,
      fromName: TUTORIAL_MAIL.from,
      initials: TUTORIAL_MAIL.initials,
      subject: TUTORIAL_MAIL.subject,
      preview: TUTORIAL_MAIL.body[0],
      timeLabel: TUTORIAL_MAIL.timeLabel,
      body: TUTORIAL_MAIL.body,
      attachments: ['tutorial-desk'],
      read: state.readMails.includes(TUTORIAL_MAIL.id),
    });
  }
  return items;
}

export function media(def: CaseDefinition, id: Id): MediaDef | undefined {
  return def.media.find((m) => m.id === id);
}

export interface ResolvedMedia {
  def: MediaDef;
  variantId: Id;
  variant: MediaVariant;
}

export function resolveMedia(def: CaseDefinition, state: GameState, mediaId: Id): ResolvedMedia | undefined {
  const m = media(def, mediaId);
  if (!m) return undefined;
  const variantId = currentVariant(def, state.cases[def.id], mediaId) ?? m.defaultVariant;
  const variant = m.variants[variantId] ?? m.variants[m.defaultVariant];
  return { def: m, variantId, variant };
}

export function thumbOf(v: MediaVariant, kind: MediaDef['kind']): string | undefined {
  if (kind === 'image') return v.poster ?? v.src;
  if (kind === 'video') return v.poster;
  return undefined;
}

export function unreadMessages(state: GameState): number {
  let n = 0;
  for (const p of Object.values(state.cases)) {
    for (const [tid, entries] of Object.entries(p.threads)) {
      n += Math.max(0, entries.length - (p.threadRead[tid] ?? 0));
    }
  }
  return n;
}

export const caseStatusLabel: Record<string, string> = {
  new: 'Nouvelle demande',
  postponed: 'Pour plus tard',
  active: 'En cours',
  solved: 'Résolue',
};
