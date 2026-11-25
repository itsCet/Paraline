/**
 * Enquête 3 — « Elle écrit dans mes notes » (surnaturelle, hantise du téléphone du joueur).
 *
 * Vérité interne : Marc Dubois a acheté un téléphone reconditionné. Il appartenait à
 * Nora Lemaire, morte le 14 mars 2025 à 23:48 sur la route des Étangs. Ce soir-là,
 * elle avait enregistré pour sa mère un message vocal jamais envoyé ; le
 * reconditionnement l'a effacé. Nora le cherche.
 *
 * Mécaniques :
 * - écouter l'enregistrement de Marc déclenche la bascule : Nora passe dans le
 *   téléphone du joueur (notes qui reviennent quand on les efface, fond d'écran,
 *   conversation « Moi » qui passe même en mode avion, Dictaphone qui apparaît) ;
 * - sons du jeu coupés → le passage « [inaudible] » de la transcription se lit ;
 * - numéro de série du carton → Marc retrouve Nora et son avis de décès ;
 * - le fichier du Dictaphone est protégé : Nora donne l'énigme (« Quatre chiffres. Le jour où je ne suis
 *   pas rentrée. »), la date vient de l'avis de décès → 1403. Les notes de 23:48 sont un faux indice (une heure) ;
 * - transmettre le message à sa mère → toutes les intrusions cessent.
 * Rien n'est bloquant : le joueur garde toujours l'accueil, les réglages et le son.
 */
import type { CaseDefinition, Condition } from '../../../game/types';

const DIR = '/media/cases/elle-ecrit';
const IMG = { width: 1086, height: 1448 };
const hante: Condition = { flag: 'hante' };
const messageEntendu: Condition = { mediaViewed: 'ne-pas-effacer@plein' };
const rendu: Condition = { messageDelivered: 'marc-mere' };

// Horaires calés sur l'enregistrement réel (13,8 s).
const CUES_DEBUT = [
  { start: 0, end: 1.6, text: 'Tu dors ?' },
  { start: 2.3, end: 4.8, text: 'Je cherche mon message.' },
];
const CUE_FIN = { start: 12.6, end: 13.8, text: 'Rends-le-moi.' };

const NOTES_MARC = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<h2 style="margin:0 0 4px;font-size:26px;letter-spacing:-.02em">Notes</h2>
<p style="margin:0 0 16px;color:#8a8478;font-size:13px">Capture envoyée par Marc · 4 notes</p>
${[
  ['Tu dors ?', '12 octobre'],
  ['Il fait froid ici.', '19 octobre'],
  ['Je cherche quelque chose.', '2 novembre'],
  ['Rends-le-moi.', 'Hier'],
]
  .map(
    ([t, d]) =>
      `<div style="border-bottom:1px solid #ddd6c9;padding:12px 0"><div style="font-weight:600;font-size:17px">${t}</div><div style="color:#8a8478;font-size:14px">${d}, <span data-obs="notes-2348">23:48</span></div></div>`,
  )
  .join('')}
</div>`;

const AVIS = `
<div style="font-family:Georgia,'Times New Roman',serif;text-align:center">
<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777;margin-bottom:14px">Avis de décès</div>
<img src="${DIR}/nora.jpg" alt="Photo de Nora Lemaire, souriante, dans un parc." style="width:150px;height:200px;object-fit:cover;border-radius:4px;filter:grayscale(.35);margin:0 auto 14px;display:block"/>
<h2 style="font-size:26px;margin:0 0 4px">Nora Lemaire</h2>
<div style="color:#666;margin-bottom:18px">2001 – 2025</div>
<p>Nous avons la tristesse de vous faire part du décès de Nora, survenu accidentellement <span data-obs="avis-date">le 14 mars 2025, sur la route des Étangs</span>, à l’âge de 23 ans.</p>
<p><span data-obs="avis-mere">Sa mère, Hélène Lemaire</span>, ses amis et ses proches vous remercient de vos marques de sympathie.</p>
<p style="font-style:italic;color:#555">« Elle rentrait toujours. »</p>
</div>`;

export const elleEcrit: CaseDefinition = {
  id: 'elle-ecrit',
  title: 'Elle écrit dans mes notes',
  client: 'marc',
  characters: [
    { id: 'marc', name: 'Marc Dubois', initials: 'M', color: '#4d5a4a', role: 'Client' },
    { id: 'moi', name: 'Moi', initials: '•', color: '#2a2b31', role: 'Ce téléphone' },
  ],

  media: [
    {
      id: 'notes-marc',
      kind: 'document',
      name: 'capture_notes',
      sizeLabel: 'Capture',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: NOTES_MARC } },
    },
    {
      id: 'enregistrement',
      kind: 'audio',
      name: 'enregistrement_0412.m4a',
      sizeLabel: '216 Ko',
      durationLabel: '00:14',
      defaultVariant: 'son',
      variants: {
        son: {
          src: `${DIR}/enregistrement-0412.mp3`,
          cues: [...CUES_DEBUT, { start: 5.8, end: 11.6, text: '[inaudible]' }, CUE_FIN],
        },
        // Sons du jeu coupés : le chuchotement se lit.
        silence: {
          src: `${DIR}/enregistrement-0412.mp3`,
          cues: [...CUES_DEBUT, { start: 5.8, end: 11.6, text: 'Maman… le 14… la route des Étangs.', observationId: 'chuchotement' }, CUE_FIN],
        },
      },
    },
    {
      id: 'telephone',
      kind: 'image',
      name: 'IMG_2290.jpg',
      sizeLabel: '2,6 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/telephone-marc.jpg`,
          ...IMG,
          maxZoom: 8,
          alt: 'Le téléphone reconditionné posé sur une table de chevet, à côté de sa boîte ouverte. L’étiquette de la boîte porte le numéro de série F2LXK4Q1P7.',
          overlay: {
            box: { x: 135 / 1086, y: 925 / 1448, w: 430 / 1086, h: 110 / 1448 },
            viewHeight: 26,
            mode: 'stable',
            lines: [
              { text: 'SN  F2LXK4Q1P7', y: 9, size: 7, width: 62 },
              { text: 'RECONDITIONNÉ · GRADE A', y: 16.5, size: 4.6, width: 60 },
              { text: 'LOT 1025-B', y: 23, size: 4.6, width: 26 },
            ],
          },
          hotspots: [
            { id: 't-etiquette', x: 0.11, y: 0.57, w: 0.43, h: 0.16, observationId: 'numero-serie' },
            { id: 't-tel', x: 0.62, y: 0.41, w: 0.36, h: 0.32, observationId: 'telephone-pose' },
          ],
        },
      },
    },
    {
      id: 'avis',
      kind: 'document',
      name: 'avis_lemaire',
      sizeLabel: 'Page web',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: AVIS } },
    },
    {
      // Apparaît dans le Dictaphone du joueur. Vide tant qu'on n'est pas revenu à cette nuit-là.
      id: 'ne-pas-effacer',
      kind: 'audio',
      name: 'ne_pas_effacer.m4a',
      durationLabel: '00:12',
      album: 'Dictaphone',
      lock: { code: '1403', title: 'Enregistrement protégé', prompt: 'Saisissez le code à quatre chiffres.' },
      defaultVariant: 'vide',
      variants: {
        vide: { src: '', transcript: '(aucun son)' },
        plein: {
          src: `${DIR}/ne-pas-effacer.mp3`,
          cues: [
            // Horaires calés sur le message réel (12 s).
            { start: 0, end: 1.7, text: 'Maman, c’est moi.' },
            { start: 1.9, end: 4.3, text: 'Je suis sur la route des Étangs, je rentre.' },
            { start: 4.4, end: 7.8, text: 'Pardon pour ce soir… j’ai dit des choses que je pensais pas.' },
            { start: 7.9, end: 12, text: 'Je t’aime. Je suis là dans vingt minutes.', observationId: 'message-nora' },
          ],
        },
      },
    },
  ],

  locked: true,
  initialMail: {
    id: 'ee-mail',
    from: 'marc',
    subject: 'Elle écrit dans mes notes',
    timeLabel: 'Hier',
    preview: 'J’ai acheté un téléphone reconditionné il y a un mois.',
    body: [
      'Bonjour,',
      'J’ai acheté un téléphone reconditionné il y a un mois.',
      'Depuis, des notes apparaissent dans mon application Notes. Je ne les écris pas.',
      'La première disait « Tu dors ? ». La dernière : « Rends-le-moi. »',
      'La nuit, le dictaphone s’enregistre tout seul. On entend chuchoter. Je vous envoie le dernier enregistrement.',
      'J’ai réinitialisé le téléphone deux fois. Les notes reviennent.',
      'Marc',
    ],
    attachments: ['notes-marc', 'enregistrement'],
  },

  threads: [
    { id: 't-marc', contact: 'marc' },
    { id: 't-moi', contact: 'moi' },
  ],

  messages: [
    { id: 'marc-1', threadId: 't-marc', from: 'marc', text: 'Merci de répondre. Je ne dors presque plus.' },
    { id: 'marc-heure', threadId: 't-marc', from: 'marc', text: 'Toujours la même. J’ai essayé de rester éveillé pour voir. Je finis par m’endormir, et elles sont là.' },
    { id: 'marc-origine1', threadId: 't-marc', from: 'marc', text: 'Un site de reconditionnés. Ils ne disent rien de l’ancien propriétaire. J’ai gardé le carton.' },
    { id: 'marc-origine2', threadId: 't-marc', from: 'marc', attachments: ['telephone'], notify: false },
    {
      id: 'marc-ecoute',
      threadId: 't-marc',
      from: 'marc',
      text: 'Non. Une fois, dans le bus, j’avais coupé le son pour ne déranger personne. J’ai cru lire quelque chose dans la transcription. Le temps de remettre le son, plus rien.',
    },
    { id: 'marc-serie1', threadId: 't-marc', from: 'marc', text: 'Je les appelle.' },
    { id: 'marc-serie2', threadId: 't-marc', from: 'marc', text: 'Ils ont fini par répondre. C’était le téléphone d’une certaine Nora Lemaire.' },
    { id: 'marc-serie3', threadId: 't-marc', from: 'marc', text: 'Elle est morte l’an dernier. J’ai trouvé ça.', notify: false },
    { id: 'marc-serie4', threadId: 't-marc', from: 'marc', attachments: ['avis'], notify: false },
    { id: 'marc-plusrien', threadId: 't-marc', from: 'marc', text: 'Depuis que je vous ai envoyé le fichier, plus rien chez moi. Pas une note. C’est normal ?' },
    { id: 'marc-desole', threadId: 't-marc', from: 'marc', text: 'Je suis désolé. Je ne voulais pas vous la passer.' },
    { id: 'marc-garder', threadId: 't-marc', from: 'marc', text: 'Comme vous voulez. Faites attention à vous.' },
    { id: 'marc-transmettre', threadId: 't-marc', from: 'marc', text: 'Le vendeur m’a donné l’adresse de sa mère. Je m’en occupe ce soir.' },
    { id: 'marc-mere', threadId: 't-marc', from: 'marc', text: 'Sa mère m’a écrit. Elle l’a écouté plusieurs fois. Elle dit merci.' },
    { id: 'moi-1', threadId: 't-moi', from: 'moi', text: 'Ne coupe pas.' },
    { id: 'moi-2', threadId: 't-moi', from: 'moi', text: 'Je suis toujours là.' },
    { id: 'moi-code', threadId: 't-moi', from: 'moi', text: 'Quatre chiffres. Le jour où je ne suis pas rentrée.' },
    { id: 'moi-ecoute', threadId: 't-moi', from: 'moi', text: 'Écoute.' },
    { id: 'moi-garder', threadId: 't-moi', from: 'moi', text: 'Tu l’as toujours ?' },
  ],

  notes: [
    { id: 'n1', body: 'C’est toi qui as mon message ?' },
    { id: 'n2', body: 'C’est toi qui as mon message ?\nNe m’efface pas.' },
    { id: 'n3', body: 'C’est toi qui as mon message ?\nNe m’efface pas.\nJe ne te veux pas de mal. Je veux juste rentrer.' },
    { id: 'fin', body: 'Merci. Tu peux fermer.' },
  ],

  replies: [
    {
      id: 'q-heure',
      threadId: 't-marc',
      label: 'Les notes apparaissent toujours à la même heure ?',
      available: { messageDelivered: 'marc-1' },
      effects: [{ type: 'deliverMessage', messageId: 'marc-heure', delayMs: 2000 }],
    },
    {
      id: 'q-origine',
      threadId: 't-marc',
      label: 'D’où vient ce téléphone ?',
      available: { messageDelivered: 'marc-1' },
      effects: [
        { type: 'deliverMessage', messageId: 'marc-origine1', delayMs: 2000 },
        { type: 'deliverMessage', messageId: 'marc-origine2', delayMs: 1500 },
      ],
    },
    {
      id: 'q-ecoute',
      threadId: 't-marc',
      label: 'Vous comprenez ce qu’elle chuchote ?',
      available: { all: [{ messageDelivered: 'marc-1' }, { mediaViewed: 'enregistrement' }] },
      effects: [{ type: 'deliverMessage', messageId: 'marc-ecoute', delayMs: 2400 }],
    },
    {
      id: 'q-serie',
      threadId: 't-marc',
      label: 'Le vendeur pourrait-il retrouver l’ancien propriétaire avec ce numéro de série ?',
      available: { observationFound: 'numero-serie' },
      effects: [
        { type: 'deliverMessage', messageId: 'marc-serie1', delayMs: 1500 },
        { type: 'deliverMessage', messageId: 'marc-serie2', delayMs: 4500 },
        { type: 'deliverMessage', messageId: 'marc-serie3', delayMs: 2200 },
        { type: 'deliverMessage', messageId: 'marc-serie4', delayMs: 1200 },
      ],
    },
    {
      id: 'q-deplace',
      threadId: 't-marc',
      label: 'Je crois qu’elle est chez moi, maintenant.',
      available: { messageDelivered: 'marc-plusrien' },
      effects: [{ type: 'deliverMessage', messageId: 'marc-desole', delayMs: 2500 }],
    },
    {
      id: 'r-transmettre',
      threadId: 't-marc',
      label: 'J’ai retrouvé son dernier message. Pouvez-vous le faire parvenir à sa mère ?',
      available: messageEntendu,
      effects: [
        { type: 'deliverMessage', messageId: 'marc-transmettre', delayMs: 2500 },
        { type: 'deliverMessage', messageId: 'marc-mere', delayMs: 8000 },
      ],
    },
    {
      id: 'r-garder',
      threadId: 't-marc',
      label: 'Je préfère le garder pour l’instant.',
      available: { all: [messageEntendu, { not: { replySent: 'r-transmettre' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'marc-garder', delayMs: 2000 },
        { type: 'deliverMessage', messageId: 'moi-garder', delayMs: 20000, ignoreAirplane: true, background: true },
      ],
    },
  ],

  observations: [
    { id: 'notes-2348', title: 'Toutes les notes de Marc sont apparues à 23:48.', mediaId: 'notes-marc', autoFile: true, actions: [] },
    {
      id: 'chuchotement',
      title: 'Sans le son, le passage inaudible se lit : « Maman… le 14… la route des Étangs. »',
      mediaId: 'enregistrement',
      autoFile: true,
      actions: [],
    },
    { id: 'numero-serie', title: 'Numéro de série du téléphone : F2LXK4Q1P7.', mediaId: 'telephone', autoFile: true, actions: [{ type: 'ask', replyId: 'q-serie', label: 'Questionner Marc' }] },
    { id: 'telephone-pose', title: 'Le téléphone est posé à côté de sa boîte, écran contre la table.', mediaId: 'telephone', actions: [{ type: 'addToFile' }] },
    { id: 'avis-date', title: 'Nora est morte le 14 mars 2025, sur la route des Étangs.', mediaId: 'avis', autoFile: true, actions: [] },
    { id: 'avis-mere', title: 'Sa mère s’appelle Hélène Lemaire.', mediaId: 'avis', autoFile: true, actions: [] },
    { id: 'message-nora', title: 'Le dernier message de Nora, pour sa mère : elle rentrait.', mediaId: 'ne-pas-effacer', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'origine', objective: 'Qui écrit dans les notes de Marc, et que cherche-t-elle ?' }],

  obstacles: [
    {
      id: 'ecouter',
      solved: { mediaViewed: 'enregistrement' },
      hints: [
        'Marc a joint un enregistrement à son e-mail.',
        'Ouvrez la pièce jointe audio et lisez sa transcription.',
        'Dans Mail, ouvrez enregistrement_0412.m4a.',
      ],
    },
    {
      id: 'chuchotement',
      solved: { any: [{ observationFound: 'chuchotement' }, { mediaViewed: 'avis' }, messageEntendu] },
      hints: [
        'Un passage de la transcription reste inaudible.',
        'Marc a cru le lire un jour où il n’y avait aucun son.',
        'Dans Réglages › Audio, coupez les sons du jeu, puis rouvrez l’enregistrement et touchez la ligne révélée.',
      ],
    },
    {
      id: 'nora',
      solved: { any: [{ mediaViewed: 'avis' }, messageEntendu] },
      hints: [
        'Ce téléphone a eu une autre vie avant Marc.',
        'Le carton du téléphone porte un numéro.',
        'Demandez à Marc d’où vient le téléphone, relevez le numéro de série sur la photo du carton, puis demandez-lui de contacter le vendeur.',
      ],
    },
    {
      id: 'message',
      solved: messageEntendu,
      hints: [
        'Un fichier est apparu dans votre Dictaphone, mais il est protégé. Nora vous a écrit comment l’ouvrir.',
        'Elle parle d’un jour, pas d’une heure. Qui sait quand elle n’est pas rentrée ?',
        'L’avis de décès donne le 14 mars : dans Dictaphone, ouvrez ne_pas_effacer.m4a et tapez 1403.',
      ],
    },
    {
      id: 'rendre',
      solved: rendu,
      hints: [
        'Nora ne peut pas l’envoyer elle-même.',
        'Sa mère ne l’a jamais reçu.',
        'Demandez à Marc de transmettre le message à la mère de Nora.',
      ],
    },
  ],

  rules: [
    { id: 'bonjour', when: { caseAccepted: true }, effects: [{ type: 'deliverMessage', messageId: 'marc-1', delayMs: 1600 }] },

    /* La transcription change selon le son du jeu. */
    { id: 'silence', once: false, when: { sound: false }, effects: [{ type: 'setMediaVariant', mediaId: 'enregistrement', variantId: 'silence' }] },
    { id: 'son', once: false, when: { sound: true }, effects: [{ type: 'setMediaVariant', mediaId: 'enregistrement', variantId: 'son' }] },

    /* La bascule : après l'écoute, Nora passe dans le téléphone du joueur. */
    {
      id: 'bascule',
      when: { mediaViewed: 'enregistrement' },
      effects: [
        { type: 'setFlag', name: 'hante', value: true },
        { type: 'writeNote', noteId: 'n1', delayMs: 14000 },
        { type: 'deliverMessage', messageId: 'marc-plusrien', delayMs: 45000, background: true },
      ],
    },
    {
      id: 'fond-ecran',
      when: { noteWritten: 'n1' },
      effects: [
        { type: 'phoneOverride', key: 'wallpaper', value: `${DIR}/fond-voiture.jpg` },
        { type: 'deliverMessage', messageId: 'moi-1', delayMs: 22000, ignoreAirplane: true, background: true },
      ],
    },
    {
      id: 'dictaphone',
      when: { messageDelivered: 'marc-plusrien' },
      effects: [
        { type: 'phoneOverride', key: 'extraApp', value: 'dictaphone' },
        { type: 'grantMedia', mediaId: 'ne-pas-effacer' },
        { type: 'deliverMessage', messageId: 'moi-code', delayMs: 12000, ignoreAirplane: true, background: true },
      ],
    },
    /* Effacer ses notes ne sert à rien : elles reviennent, avec une phrase de plus. */
    { id: 'note-2', when: { all: [{ noteWritten: 'n1' }, { not: { noteExists: 'n1' } }] }, effects: [{ type: 'writeNote', noteId: 'n2', delayMs: 25000 }] },
    { id: 'note-3', when: { all: [{ noteWritten: 'n2' }, { not: { noteExists: 'n2' } }] }, effects: [{ type: 'writeNote', noteId: 'n3', delayMs: 25000 }] },
    /* Le mode avion ne l'arrête pas. */
    {
      id: 'avion',
      when: { all: [hante, { airplane: true }] },
      effects: [{ type: 'deliverMessage', messageId: 'moi-2', delayMs: 3000, ignoreAirplane: true }],
    },

    /* Le bon code (le 14 mars : 1403) ouvre le fichier. */
    {
      id: 'retrouver',
      when: { all: [hante, { flag: 'verrou:ne-pas-effacer' }] },
      effects: [
        { type: 'setMediaVariant', mediaId: 'ne-pas-effacer', variantId: 'plein' },
        { type: 'deliverMessage', messageId: 'moi-ecoute', delayMs: 2500, ignoreAirplane: true },
        { type: 'log', text: 'ne_pas_effacer.m4a n’est plus vide.' },
      ],
    },

    /* Le message est rendu : toutes les intrusions cessent. */
    {
      id: 'apaisement',
      when: rendu,
      effects: [
        { type: 'clearPhoneOverride', key: 'wallpaper' },
        { type: 'clearPhoneOverride', key: 'extraApp' },
        { type: 'removeNote', noteId: 'n1' },
        { type: 'removeNote', noteId: 'n2' },
        { type: 'removeNote', noteId: 'n3' },
        { type: 'writeNote', noteId: 'fin' },
        { type: 'log', text: 'Le message de Nora a été transmis à sa mère.' },
        { type: 'solveCase' },
        // Seule trace : un réglage inconnu, désactivé. L'activer une fois écrit une dernière note.
        { type: 'phoneOverride', key: 'ghostSetting', value: 'Nora::Je voulais juste rentrer.' },
      ],
    },
  ],

  report: {
    text: [
      'Le téléphone de Marc appartenait à {qui}, morte le {date} sur la route des Étangs.',
      'Ce soir-là, elle avait enregistré {quoi} pour {pour}, sans jamais l’envoyer.',
      'Pour qu’elle cesse de chercher, il fallait {fin}.',
    ],
    blanks: {
      qui: {
        answer: 'Nora Lemaire',
        options: [
          { text: 'Nora Lemaire', requires: { any: [{ mediaViewed: 'avis' }, { messageDelivered: 'marc-serie2' }, { mediaViewed: 'ne-pas-effacer@plein' }] } },
          { text: 'Hélène Lemaire', requires: { observationFound: 'avis-mere' } },
          { text: 'la vendeuse du site' },
          { text: 'l’ancienne compagne de Marc' },
        ],
      },
      date: {
        answer: '14 mars 2025',
        options: [
          { text: '14 mars 2025', requires: { any: [{ mediaViewed: 'avis' }, { observationFound: 'chuchotement' }] } },
          { text: '12 octobre 2025', requires: { mediaViewed: 'notes-marc' } },
          { text: '23 avril 2025' },
          { text: '2 novembre 2025', requires: { mediaViewed: 'notes-marc' } },
        ],
      },
      quoi: {
        answer: 'un message vocal',
        options: [
          { text: 'un message vocal', requires: { any: [{ observationFound: 'message-nora' }, { mediaViewed: 'ne-pas-effacer@plein' }] } },
          { text: 'une note' },
          { text: 'une lettre' },
          { text: 'une vidéo' },
        ],
      },
      pour: {
        answer: 'sa mère',
        options: [
          { text: 'sa mère', requires: { any: [{ observationFound: 'message-nora' }, { mediaViewed: 'ne-pas-effacer@plein' }, { mediaViewed: 'avis' }] } },
          { text: 'Marc' },
          { text: 'son petit ami' },
          { text: 'sa sœur' },
        ],
      },
      fin: {
        answer: 'le faire parvenir à sa mère',
        options: [
          { text: 'le faire parvenir à sa mère', requires: { any: [{ observationFound: 'message-nora' }, { mediaViewed: 'ne-pas-effacer@plein' }] } },
          { text: 'effacer toutes ses notes' },
          { text: 'réinitialiser le téléphone' },
          { text: 'rendre le téléphone au vendeur' },
        ],
      },
    },
  },
  about: { duration: '~10 min', tone: 'Hantise' },
  conclusion: {
    title: 'Affaire résolue',
    text: [
      'Le téléphone de Marc avait appartenu à Nora Lemaire, morte le 14 mars 2025 sur la route des Étangs. Elle cherchait le message vocal qu’elle n’avait jamais envoyé à sa mère. Il lui est enfin parvenu.',
    ],
  },
};
