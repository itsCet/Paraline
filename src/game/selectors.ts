/** Lectures dérivées de l'état, partagées par les applications. */
import { TUTORIAL_MAIL } from '../content/tutorial';
import { currentVariant, findMail, type CaseIndex, newReplies } from './engine';
import type { CaseDefinition, Character, GameState, Id, MailDef, MediaDef, MediaVariant } from './types';

export interface InboxItem {
  id: Id;
  caseId: Id | null;
  /** E-mail initial d'une affaire (sinon suivi ou exercice). */
  initial: boolean;
  tutorial: boolean;
  draft: boolean;
  fromName: string;
  initials: string;
  color?: string;
  subject: string;
  preview: string;
  timeLabel: string;
  body: string[];
  attachments: Id[];
  read: boolean;
  /** Durée et ton annoncés (e-mail initial d'une affaire). */
  about?: string;
  /** Enquête réservée, code d'accès non saisi. */
  locked?: boolean;
}

/** Code d'accès des enquêtes réservées. */
export const ACCESS_CODE = '1234';

/** Une enquête réservée reste fermée tant que le code n'est pas saisi (sauf si elle est déjà commencée). */
export function isLocked(def: CaseDefinition, state: GameState): boolean {
  const st = state.cases[def.id]?.status ?? 'new';
  return !!def.locked && !state.unlocked && (st === 'new' || st === 'postponed');
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
    draft: Boolean(m.draft),
    fromName: m.draft ? 'Brouillon' : who.name,
    initials: m.draft ? '✎' : who.initials,
    color: m.draft ? '#3a3b42' : who.color,
    subject: m.subject,
    preview: m.preview ?? m.body[0] ?? '',
    timeLabel: m.timeLabel,
    about: initial && def.about ? `${def.about.duration} · ${def.about.tone}` : undefined,
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
    const item = mailItem(def, def.initialMail, true, state);
    items.push(isLocked(def, state) ? { ...item, locked: true, read: true } : item);
  }
  if (state.tutorial.status === 'active') {
    items.unshift({
      id: TUTORIAL_MAIL.id,
      caseId: null,
      initial: false,
      tutorial: true,
      draft: false,
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

/** Fils où une nouvelle réponse est apparue depuis la dernière visite. */
export function pendingReplyThreads(state: GameState, cases: CaseIndex): number {
  let n = 0;
  for (const def of cases.list) for (const t of def.threads) if (newReplies(def, state, t.id).length) n++;
  return n;
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
