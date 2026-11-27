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
  const noteIds = uniq('note', (c.notes ?? []).map((x) => x.id));

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
      for (const h of v.spectrogram?.hotspots ?? []) {
        if (!obs.has(h.observationId)) err(`zone ${h.id} : observation inconnue`);
        if ([h.x, h.y, h.w, h.h].some((n) => n < 0 || n > 1) || h.x + h.w > 1.0001 || h.y + h.h > 1.0001) err(`zone ${h.id} hors du spectre`);
      }
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
    if ('mediaViewed' in cond) {
      // `id@variante` : média consulté dans une version précise.
      const [mid, vid] = cond.mediaViewed.split('@');
      if (!media.has(mid) || (vid && !c.media.find((m) => m.id === mid)?.variants[vid])) err(`condition : média inconnu ${cond.mediaViewed}`);
    }
    if ('observationFound' in cond && !obs.has(cond.observationFound)) err(`condition : observation inconnue ${cond.observationFound}`);
    if ('observationFiled' in cond && !obs.has(cond.observationFiled)) err(`condition : observation inconnue ${cond.observationFiled}`);
    if ('replySent' in cond && !replies.has(cond.replySent)) err(`condition : réponse inconnue ${cond.replySent}`);
    if ('messageDelivered' in cond && !msgs.has(cond.messageDelivered)) err(`condition : message inconnu ${cond.messageDelivered}`);
    if ('stepIs' in cond && !steps.has(cond.stepIs)) err(`condition : étape inconnue ${cond.stepIs}`);
    if ('ruleFired' in cond && !rules.has(cond.ruleFired)) err(`condition : règle inconnue ${cond.ruleFired}`);
    if ('manualTime' in cond && !/^\d{2}:\d{2}$/.test(cond.manualTime)) err(`heure invalide ${cond.manualTime}`);
    if ('noteExists' in cond && !noteIds.has(cond.noteExists)) err(`condition : note inconnue ${cond.noteExists}`);
    if ('noteWritten' in cond && !noteIds.has(cond.noteWritten)) err(`condition : note inconnue ${cond.noteWritten}`);
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
    if ((e.type === 'writeNote' || e.type === 'removeNote') && !noteIds.has(e.noteId)) err(`effet : note inconnue ${e.noteId}`);
    if (e.type === 'incomingCall' && !(c.calls ?? []).some((x) => x.id === e.callId)) err(`effet : appel inconnu ${e.callId}`);
  };
  for (const o of c.obstacles ?? []) checkCond(o.solved);
  for (const e of c.endings ?? []) checkCond(e.when);
  uniq('cible de boussole', (c.compass?.targets ?? []).map((t) => t.id));
  for (const t of c.compass?.targets ?? []) {
    if (t.bearing < 0 || t.bearing >= 360) err(`cible ${t.id} : cap hors de [0, 360[`);
    if (t.when) checkCond(t.when);
  }
  for (const m of c.media)
    for (const v of Object.values(m.variants))
      for (const e of v.panorama?.exits ?? []) if (!media.has(e.to)) err(`passage vers un média inconnu : ${e.to}`);
  for (const st of c.radio?.stations ?? []) {
    if (!media.has(st.mediaId)) err(`station ${st.freq} : média inconnu ${st.mediaId}`);
    if (st.when) checkCond(st.when);
  }
  for (const m of c.media) {
    for (const v of Object.values(m.variants)) {
      for (const row of v.info ?? []) if (row.observationId && !obs.has(row.observationId)) err(`infos ${m.id} : observation inconnue ${row.observationId}`);
    }
  }
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
  for (const call of c.calls ?? []) {
    if (!c.characters.some((x) => x.id === call.from)) err(`appel ${call.id} : personnage inconnu ${call.from}`);
    if (!call.nodes[call.start]) err(`appel ${call.id} : réplique de départ inconnue`);
    for (const [nid, n] of Object.entries(call.nodes)) {
      for (const ch of n.choices ?? []) {
        if (ch.next && !call.nodes[ch.next]) err(`appel ${call.id}/${nid} : réplique ${ch.next} inconnue`);
        (ch.effects ?? []).forEach(checkEffect);
      }
      (n.end ?? []).forEach(checkEffect);
    }
    (call.onMissed ?? []).forEach(checkEffect);
  }
  for (const pl of c.map?.places ?? []) {
    if (pl.when) checkCond(pl.when);
    if (pl.observationId && !c.observations.some((o) => o.id === pl.observationId)) err(`plan : observation inconnue ${pl.observationId}`);
    if (pl.mediaId && !c.media.some((m) => m.id === pl.mediaId)) err(`plan : média inconnu ${pl.mediaId}`);
  }
  for (const l of c.callLog ?? []) if (l.when) checkCond(l.when);
  if (c.faceId) checkCond(c.faceId.when);
  if (c.report) {
    const used = new Set([...c.report.text.map((t) => (typeof t === 'string' ? t : t.text)).join(' ').matchAll(/\{([\w-]+)\}/g)].map((m) => m[1]));
    for (const t of c.report.text) if (typeof t !== 'string') checkCond(t.when);
    for (const id of used) if (!c.report.blanks[id]) err(`rapport : trou inconnu {${id}}`);
    for (const [id, b] of Object.entries(c.report.blanks)) {
      if (!used.has(id)) err(`rapport : trou ${id} absent du texte`);
      if (!b.options.some((o) => o.text === b.answer)) err(`rapport : la réponse de ${id} n’est pas parmi les choix`);
      if (b.options.length < 3) err(`rapport : ${id} doit proposer au moins 3 choix`);
      b.options.forEach((o) => o.requires && checkCond(o.requires));
    }
    if (!c.rules.some((r) => r.effects.some((e) => e.type === 'solveCase'))) err('rapport sans règle solveCase');
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
