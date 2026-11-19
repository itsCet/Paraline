/**
 * Vérification statique d'une enquête : identifiants uniques, références
 * existantes, trois niveaux d'aide, coordonnées des zones dans [0, 1].
 * Exécutée par les tests sur toutes les enquêtes enregistrées.
 */
import type { CaseDefinition, Condition, Effect } from './types';

export function validateCase(c: CaseDefinition): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`[${c.id}] ${m}`);
  const uniq = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) err(`${label} en double : ${id}`);
      seen.add(id);
    }
    return seen;
  };
  const chars = uniq('personnage', c.characters.map((x) => x.id));
  const media = uniq('média', c.media.map((x) => x.id));
  const mails = uniq('e-mail', [c.initialMail, ...(c.followUpMails ?? [])].map((x) => x.id));
  const threads = uniq('fil', c.threads.map((x) => x.id));
  const msgs = uniq('message', c.messages.map((x) => x.id));
  const replies = uniq('réponse', c.replies.map((x) => x.id));
  const obs = uniq('observation', c.observations.map((x) => x.id));
  const steps = uniq('étape', c.steps.map((x) => x.id));
  const rules = uniq('règle', c.rules.map((x) => x.id));

  if (!chars.has(c.client)) err(`client inconnu : ${c.client}`);
  for (const m of [c.initialMail, ...(c.followUpMails ?? [])]) {
    if (!chars.has(m.from)) err(`expéditeur inconnu : ${m.from}`);
    for (const a of m.attachments ?? []) if (!media.has(a)) err(`pièce jointe inconnue : ${a}`);
  }
  for (const t of c.threads) if (!chars.has(t.contact)) err(`contact inconnu : ${t.contact}`);
  for (const m of c.messages) {
    if (!threads.has(m.threadId)) err(`fil inconnu pour ${m.id}`);
    if (m.from !== 'player' && !chars.has(m.from)) err(`auteur inconnu pour ${m.id}`);
    for (const a of m.attachments ?? []) if (!media.has(a)) err(`pièce jointe inconnue : ${a}`);
  }
  for (const id of c.openingMessages ?? []) if (!msgs.has(id)) err(`message d'ouverture inconnu : ${id}`);
  for (const m of c.media) {
    if (!m.variants[m.defaultVariant]) err(`variante par défaut absente : ${m.id}`);
    if (m.compareWith && !media.has(m.compareWith)) err(`comparaison inconnue : ${m.compareWith}`);
    for (const [vid, v] of Object.entries(m.variants)) {
      if (v.src.startsWith('data:')) err(`média encodé en base64 interdit : ${m.id}/${vid}`);
      for (const h of v.hotspots ?? []) {
        if (!obs.has(h.observationId)) err(`zone ${h.id} : observation inconnue`);
        if ([h.x, h.y, h.w, h.h].some((n) => n < 0 || n > 1) || h.x + h.w > 1.0001 || h.y + h.h > 1.0001)
          err(`zone ${h.id} hors de l'image`);
      }
    }
  }
  for (const o of c.observations) {
    if (o.mediaId && !media.has(o.mediaId)) err(`média inconnu pour l'observation ${o.id}`);
    for (const a of o.actions) {
      if (a.type === 'ask' && !replies.has(a.replyId)) err(`réponse inconnue pour ${o.id}`);
      if (a.type === 'examine' && a.mediaId && !media.has(a.mediaId)) err(`média inconnu pour ${o.id}`);
    }
  }
  for (const s of c.steps) {
    if (!c.obstacles?.length && s.hints?.length !== 3) err(`l'étape ${s.id} doit avoir trois niveaux d'aide`);
  }
  uniq('obstacle', (c.obstacles ?? []).map((o) => o.id));
  for (const o of c.obstacles ?? []) if (o.hints.length !== 3) err(`l'obstacle ${o.id} doit avoir trois niveaux d'aide`);

  const checkCond = (cond: Condition): void => {
    if ('all' in cond) return cond.all.forEach(checkCond);
    if ('any' in cond) return cond.any.forEach(checkCond);
    if ('not' in cond) return checkCond(cond.not);
    if ('mailRead' in cond && !mails.has(cond.mailRead)) err(`condition : e-mail inconnu ${cond.mailRead}`);
    if ('mediaViewed' in cond && !media.has(cond.mediaViewed)) err(`condition : média inconnu ${cond.mediaViewed}`);
    if ('observationFound' in cond && !obs.has(cond.observationFound)) err(`condition : observation inconnue ${cond.observationFound}`);
    if ('observationFiled' in cond && !obs.has(cond.observationFiled)) err(`condition : observation inconnue ${cond.observationFiled}`);
    if ('replySent' in cond && !replies.has(cond.replySent)) err(`condition : réponse inconnue ${cond.replySent}`);
    if ('messageDelivered' in cond && !msgs.has(cond.messageDelivered)) err(`condition : message inconnu ${cond.messageDelivered}`);
    if ('stepIs' in cond && !steps.has(cond.stepIs)) err(`condition : étape inconnue ${cond.stepIs}`);
    if ('ruleFired' in cond && !rules.has(cond.ruleFired)) err(`condition : règle inconnue ${cond.ruleFired}`);
    if ('manualTime' in cond && !/^\d{2}:\d{2}$/.test(cond.manualTime)) err(`heure invalide ${cond.manualTime}`);
    if ('mediaVariant' in cond && !c.media.find((m) => m.id === cond.mediaVariant)?.variants[cond.is])
      err(`condition : variante inconnue ${cond.mediaVariant}/${cond.is}`);
    if ('manualDate' in cond && !/^\d{4}-\d{2}-\d{2}$/.test(cond.manualDate)) err(`date invalide ${cond.manualDate}`);
  };
  const checkEffect = (e: Effect) => {
    if (e.type === 'deliverMessage' && !msgs.has(e.messageId)) err(`effet : message inconnu ${e.messageId}`);
    if (e.type === 'deliverMail' && !mails.has(e.mailId)) err(`effet : e-mail inconnu ${e.mailId}`);
    if (e.type === 'unlockReply' && !replies.has(e.replyId)) err(`effet : réponse inconnue ${e.replyId}`);
    if (e.type === 'grantMedia' && !media.has(e.mediaId)) err(`effet : média inconnu ${e.mediaId}`);
    if (e.type === 'setStep' && !steps.has(e.stepId)) err(`effet : étape inconnue ${e.stepId}`);
    if (e.type === 'setMediaVariant') {
      const m = c.media.find((x) => x.id === e.mediaId);
      if (!m?.variants[e.variantId]) err(`effet : variante inconnue ${e.mediaId}/${e.variantId}`);
    }
    if (e.type === 'phoneOverride' && e.until) checkCond(e.until);
    if (e.type === 'alterCopies') {
      const m = c.media.find((x) => x.id === e.mediaId);
      if (!m?.variants[e.fromVariant] || !m.variants[e.toVariant]) err(`effet : variantes inconnues ${e.mediaId}`);
    }
    if ((e.type === 'deliverMessage' || e.type === 'deliverMail') && e.holdUntil) checkCond(e.holdUntil);
  };
  for (const o of c.obstacles ?? []) checkCond(o.solved);
  for (const t of c.threads) {
    if (t.presence) {
      checkCond(t.presence.online);
      if (t.presence.endedWhen) checkCond(t.presence.endedWhen);
    }
    if (t.archivedWhen) checkCond(t.archivedWhen);
  }
  // Les passages relevables d'un document doivent correspondre à des observations.
  for (const m of c.media) {
    for (const v of Object.values(m.variants)) {
      for (const match of (v.html ?? '').matchAll(/data-obs="([^"]+)"/g)) {
        if (!obs.has(match[1])) err(`document ${m.id} : observation inconnue ${match[1]}`);
      }
    }
  }
  for (const r of c.rules) {
    checkCond(r.when);
    r.effects.forEach(checkEffect);
  }
  for (const r of c.replies) {
    if (!threads.has(r.threadId)) err(`fil inconnu pour la réponse ${r.id}`);
    if (r.available) checkCond(r.available);
    (r.effects ?? []).forEach(checkEffect);
  }
  return errors;
}

/** Les identifiants d'e-mails et de médias doivent aussi être uniques entre enquêtes. */
export function validateRegistry(cases: CaseDefinition[]): string[] {
  const errors = cases.flatMap(validateCase);
  const caseIds = new Set<string>();
  const mailIds = new Set<string>();
  for (const c of cases) {
    if (caseIds.has(c.id)) errors.push(`enquête en double : ${c.id}`);
    caseIds.add(c.id);
    for (const m of [c.initialMail, ...(c.followUpMails ?? [])]) {
      if (mailIds.has(m.id)) errors.push(`e-mail partagé entre enquêtes : ${m.id}`);
      mailIds.add(m.id);
    }
  }
  return errors;
}
