/**
 * Enquête 1 — « La chambre condamnée ».
 *
 * Vérité interne (jamais présentée au joueur sous forme de règles) :
 * Gabriel Vannier est mort le 18/11/2014 dans l'incendie du 8, rue des Ormes,
 * en tenant ouvert le passage qui a sauvé Aline et Hugo Mercier. Sa dernière
 * communication, à 03:17, demandait « Les deux sont sortis ? ». La caméra
 * d'Élise relaie cette communication inachevée.
 *
 * Mécaniques :
 * - 03:17 (manuel) + réseau  → capture_0317 reçoit la porte entrouverte, écriture instable ;
 * - mode avion à 03:17 sur cette version → l'écriture se stabilise (lisible) ;
 * - quitter 03:17 avec le réseau → la capture connectée redevient la porte fermée ;
 * - 18/11/2014 03:17 + réseau → G. Vannier écrit ; il n'est joignable que dans ces conditions ;
 * - après la réponse honnête → porte ouverte sur une pièce vide ;
 * - retour au réglage automatique → mur plein, affaire résolue, anomalies terminées.
 */
import type { CaseDefinition, Condition, ImageOverlay } from '../../../game/types';

const DIR = '/media/cases/chambre-condamnee';
const IMG = { w: 1086, h: 1448 };

/* ------------------------------------------------------------------ */
/* Conditions réutilisées                                               */
/* ------------------------------------------------------------------ */

const at0317: Condition = { manualTime: '03:17' };
const night: Condition = { all: [{ manualDate: '2014-11-18' }, { manualTime: '03:17' }] };
const online: Condition = { airplane: false };
const ended: Condition = { flag: 'echange-termine' };
/** Gabriel n'émet que cette nuit-là, avec le réseau, tant que l'échange n'est pas terminé. */
const gabrielOnline: Condition = { all: [night, online, { flag: 'variante-recue' }, { not: ended }] };
const gabrielReady: Condition = { all: [gabrielOnline, { messageDelivered: 'g-3' }] };
const D_VARIANTS: Condition = { any: [{ mediaVariant: 'capture', is: 'instable' }, { mediaVariant: 'capture', is: 'lisible' }] };

/* ------------------------------------------------------------------ */
/* La feuille de l'image D : écriture vectorielle posée sur la photo     */
/* ------------------------------------------------------------------ */

// Feuille mesurée sur l'image : x 493–541 px, y 524–595 px (1086 × 1448).
const SHEET_BOX = { x: 493 / IMG.w, y: 524 / IMG.h, w: 48 / IMG.w, h: 71 / IMG.h };
const sheet = (mode: ImageOverlay['mode'], strikeQuestion = false): ImageOverlay => ({
  box: SHEET_BOX,
  viewHeight: 148,
  rotate: -0.6,
  mode,
  lines: [
    { text: '18 NOVEMBRE 2014', y: 30, size: 10.5, width: 82 },
    { text: '03:17', y: 50, size: 14, width: 36 },
    { text: 'G. VANNIER', y: 82, size: 11, width: 62 },
    { text: 'LES DEUX', y: 112, size: 11, width: 50, strike: strikeQuestion },
    { text: 'SONT SORTIS ?', y: 128, size: 11, width: 76, strike: strikeQuestion },
  ],
});

/* Zones d'intérêt (coordonnées relatives, mesurées sur les photos). */
const DOOR_BACK = { x: 0.38, y: 0.25, w: 0.21, h: 0.36 };
const DOOR_LEFT = { x: 0.24, y: 0.16, w: 0.08, h: 0.72 };
const WALL_BACK = { x: 0.37, y: 0.21, w: 0.22, h: 0.39 };
const SHEET_HIT = { x: 0.448, y: 0.355, w: 0.056, h: 0.062 };

/* ------------------------------------------------------------------ */
/* Documents HTML                                                       */
/* ------------------------------------------------------------------ */

const COMPARAISON = `
<h2 style="margin:0 0 4px;font-size:22px">Comparaison des deux téléphones</h2>
<p style="margin:0 0 18px;color:#555">Même compte.<br/>Même capture ouverte.</p>
<h3 style="margin:0 0 6px;font-size:17px">Téléphone actuel</h3>
<p style="margin:0 0 16px">Date et heure automatiques.<br/>22:46.<br/>Porte fermée.</p>
<h3 style="margin:0 0 6px;font-size:17px">Ancien téléphone</h3>
<p style="margin:0 0 16px"><span data-obs="doc-ancien-reglage">Réglage automatique désactivé.<br/>Horloge restée à 03:17.</span><br/><span data-obs="doc-ancien-porte">Porte entrouverte.</span></p>
<p style="margin:0">Actualiser la capture sur le téléphone actuel :<br/>aucun changement.</p>`;

const ARTICLE = `
<div style="font-family:Georgia,'Times New Roman',serif">
<div style="border-bottom:2px solid #222;padding-bottom:6px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
  <strong style="font-size:21px;letter-spacing:.02em">Le Courrier du Quartier</strong>
  <span style="font-size:13px;color:#555">19 novembre 2014</span>
</div>
<div style="font-size:12px;color:#777;margin-bottom:14px;text-transform:uppercase;letter-spacing:.08em">Faits divers · Archives</div>
<h2 style="font-size:24px;line-height:1.15;margin:0 0 14px">Deux habitants sauvés dans l’incendie de la rue des Ormes</h2>
<p>Un incendie s’est déclaré dans la nuit du 17 au 18 novembre au 8, rue des Ormes.</p>
<p><span data-obs="art-passage">Aline Mercier et son fils Hugo ont rejoint la sortie de service grâce à Gabriel Vannier, 41 ans, resté en arrière pour maintenir le passage ouvert.</span></p>
<p><span data-obs="art-survivants">Les deux habitants ont été pris en charge sains et saufs.</span> Gabriel Vannier n’a pas survécu.</p>
<p><span data-obs="art-derniere">Sa dernière communication, enregistrée à 03 h 17, demandait si les deux occupants avaient pu sortir. Aucune réponse n’a pu lui être transmise.</span></p>
<p><span data-obs="art-condamne">Le passage endommagé sera condamné lors de la remise en état de l’immeuble.</span></p>
</div>`;

/* ------------------------------------------------------------------ */
/* Enquête                                                              */
/* ------------------------------------------------------------------ */

export const chambreCondamnee: CaseDefinition = {
  id: 'chambre-condamnee',
  title: 'La chambre condamnée',
  client: 'elise',
  characters: [
    { id: 'elise', name: 'Élise Morel', initials: 'É', color: '#5b4a6b', role: 'Cliente' },
    { id: 'gabriel', name: 'G. Vannier', initials: 'GV', color: '#3d4048' },
  ],

  media: [
    {
      id: 'img-4821',
      kind: 'image',
      name: 'IMG_4821.jpg',
      sizeLabel: '2,4 Mo',
      defaultVariant: 'mur',
      variants: {
        mur: {
          src: `${DIR}/couloir-depart.jpg`,
          ...{ width: IMG.w, height: IMG.h },
          alt: 'Photo du couloir prise avant le départ : une porte sur la gauche, un mur plein au fond.',
          hotspots: [
            { id: 'a-mur', ...WALL_BACK, observationId: 'mur-fond' },
            { id: 'a-gauche', ...DOOR_LEFT, observationId: 'porte-gauche' },
          ],
        },
      },
    },
    {
      // Un seul fichier apparent ; ses variantes sont reçues au fil de l'affaire.
      id: 'capture',
      kind: 'image',
      name: 'capture_0317.jpg',
      sizeLabel: '1,9 Mo',
      allowSaveCopy: true,
      defaultVariant: 'fermee',
      variants: {
        fermee: {
          src: `${DIR}/couloir-porte-fermee.jpg`,
          width: IMG.w,
          height: IMG.h,
          maxZoom: 10,
          alt: 'Capture du couloir : une porte fermée occupe le fond, à l’endroit du mur.',
          hotspots: [
            { id: 'b-porte', ...DOOR_BACK, observationId: 'porte-fond' },
            { id: 'b-gauche', ...DOOR_LEFT, observationId: 'porte-gauche' },
          ],
        },
        instable: {
          src: `${DIR}/couloir-porte-entrouverte.jpg`,
          width: IMG.w,
          height: IMG.h,
          maxZoom: 10,
          alt: 'Capture du couloir : la porte du fond est entrouverte, une feuille y est fixée. L’écriture de la feuille change sans cesse et reste illisible.',
          overlay: sheet('unstable'),
          hotspots: [
            { id: 'd-feuille', ...SHEET_HIT, observationId: 'feuille-instable' },
            { id: 'd-porte', ...DOOR_BACK, observationId: 'porte-entrouverte' },
          ],
        },
        lisible: {
          src: `${DIR}/couloir-porte-entrouverte.jpg`,
          width: IMG.w,
          height: IMG.h,
          maxZoom: 10,
          alt: 'Capture du couloir : la porte du fond est entrouverte. La feuille fixée dessus porte : 18 novembre 2014, 03:17, G. Vannier, « Les deux sont sortis ? ».',
          overlay: sheet('stable'),
          hotspots: [
            { id: 'd2-feuille', ...SHEET_HIT, observationId: 'feuille-lisible' },
            { id: 'd2-porte', ...DOOR_BACK, observationId: 'porte-entrouverte' },
          ],
        },
        // Jamais la version active du fichier : seulement ce que devient la copie conservée au dénouement.
        barree: {
          src: `${DIR}/couloir-porte-entrouverte.jpg`,
          width: IMG.w,
          height: IMG.h,
          maxZoom: 10,
          alt: 'Copie de la capture : la porte du fond est entrouverte. La feuille porte : 18 novembre 2014, 03:17, G. Vannier. La question « Les deux sont sortis ? » est barrée.',
          overlay: sheet('stable', true),
          hotspots: [{ id: 'g-feuille', ...SHEET_HIT, observationId: 'question-barree' }],
        },
        ouverte: {
          src: `${DIR}/couloir-resolution.jpg`,
          width: IMG.w,
          height: IMG.h,
          maxZoom: 10,
          alt: 'Capture du couloir : la porte du fond est grande ouverte sur une pièce vide.',
          hotspots: [{ id: 'e-piece', ...DOOR_BACK, observationId: 'piece-vide' }],
        },
        mur: {
          src: `${DIR}/couloir-depart.jpg`,
          width: IMG.w,
          height: IMG.h,
          alt: 'Capture du couloir : un mur plein au fond, comme sur la photo prise avant le départ.',
          hotspots: [{ id: 'f-mur', ...WALL_BACK, observationId: 'mur-revenu' }],
        },
      },
    },
    {
      id: 'img-5093',
      kind: 'image',
      name: 'IMG_5093.jpg',
      sizeLabel: '2,8 Mo',
      defaultVariant: 'carton',
      variants: {
        carton: {
          src: `${DIR}/camera-carton.jpg`,
          width: IMG.w,
          height: IMG.h,
          alt: 'La caméra posée dans un carton ouvert, son câble et son adaptateur secteur débranchés à côté.',
          hotspots: [
            { id: 'c-prise', x: 0.44, y: 0.55, w: 0.16, h: 0.21, observationId: 'prise' },
            { id: 'c-camera', x: 0.23, y: 0.41, w: 0.18, h: 0.21, observationId: 'camera' },
          ],
        },
      },
    },
    {
      id: 'comparaison',
      kind: 'document',
      name: 'Comparaison des deux téléphones',
      sizeLabel: 'Note',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: COMPARAISON } },
    },
    {
      id: 'article',
      kind: 'document',
      name: 'article_2014',
      sizeLabel: 'Archive',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: ARTICLE } },
    },
  ],

  locked: true,
  initialMail: {
    id: 'cc-mail',
    from: 'elise',
    subject: 'La caméra était débranchée',
    timeLabel: '22:14',
    preview: 'J’ai quitté mon appartement du 8, rue des Ormes il y a deux semaines.',
    body: [
      'Bonjour,',
      'J’ai quitté mon appartement du 8, rue des Ormes il y a deux semaines.',
      'La caméra que j’avais dans le couloir est maintenant dans un carton. Pourtant, je reçois encore des alertes. Toujours à 03:17.',
      'Je reconnais le couloir, mais il y a une porte au fond. À cet endroit, il y avait un mur.',
      'Je joins une photo prise avant mon départ et la dernière capture reçue.',
      'Le support me dit que c’est une ancienne image enregistrée. Sauf que cette porte n’a jamais existé pendant les quatre années où j’ai vécu là.',
      'Est-ce que vous pouvez regarder ?',
      'Élise',
    ],
    attachments: ['img-4821', 'capture'],
  },
  followUpMails: [
    {
      id: 'cc-brouillon',
      from: 'gabriel',
      draft: true,
      subject: '(Sans objet)',
      timeLabel: '03:17',
      body: ['Merci d’avoir répondu.'],
      notify: 'Un brouillon a été récupéré.',
    },
  ],

  threads: [
    { id: 't-elise', contact: 'elise' },
    {
      id: 't-gabriel',
      contact: 'gabriel',
      stamp: '18/11/2014, 03:17',
      frozenTime: '03:17',
      callText: 'Le numéro n’est plus attribué depuis 2014.',
      presence: {
        online: gabrielOnline,
        offlineLabel: 'Contact indisponible',
        endedWhen: ended,
        endedLabel: 'Dernier message : 03:17',
      },
      archivedWhen: { flag: 'affaire-close' },
    },
  ],

  messages: [
    { id: 'e-bonjour', threadId: 't-elise', from: 'elise', text: 'Merci de regarder. Je ne suis plus sur place, mais j’ai gardé les photos et les alertes.' },
    { id: 'e-a1', threadId: 't-elise', from: 'elise', text: 'Oui. Je viens d’ouvrir le carton.' },
    { id: 'e-a2', threadId: 't-elise', from: 'elise', attachments: ['img-5093'], notify: false },
    { id: 'e-a3', threadId: 't-elise', from: 'elise', text: 'Elle n’a pas de batterie. La prise est là, à côté.', notify: false },
    { id: 'e-b1', threadId: 't-elise', from: 'elise', text: 'Moi seulement. J’ai changé le mot de passe hier. Ça n’a rien changé.' },
    { id: 'e-c1', threadId: 't-elise', from: 'elise', text: 'Une fois, sur mon ancien téléphone. Sur le nouveau, la porte était fermée. Sur l’ancien, elle était entrouverte.' },
    { id: 'e-c2', threadId: 't-elise', from: 'elise', text: 'Je vous envoie ce que j’avais noté pour le support.', notify: false },
    { id: 'e-c3', threadId: 't-elise', from: 'elise', attachments: ['comparaison'], notify: false },
    {
      id: 'e-d1',
      threadId: 't-elise',
      from: 'elise',
      text: 'Je l’avais envoyée à ma sœur. Pendant son trajet en avion, elle voyait encore l’écriture. Quand elle a retrouvé du réseau, elle m’a demandé pourquoi j’avais remplacé la photo. Je n’avais rien touché.',
    },
    { id: 'e-e1', threadId: 't-elise', from: 'elise', text: 'Non. Je vais demander à mon ancienne propriétaire.' },
    { id: 'e-e2', threadId: 't-elise', from: 'elise', text: 'Elle m’a envoyé cet article. Elle ne m’avait jamais parlé de ça.' },
    { id: 'e-e3', threadId: 't-elise', from: 'elise', attachments: ['article'], notify: false },
    { id: 'e-f1', threadId: 't-elise', from: 'elise', text: 'L’application vient de se déconnecter de la caméra.' },
    { id: 'e-f2', threadId: 't-elise', from: 'elise', text: 'Je n’ai plus d’alertes.', notify: false },
    { id: 'e-f3', threadId: 't-elise', from: 'elise', text: 'Vous avez réussi à lui répondre ?', notify: false },
    { id: 'e-merci', threadId: 't-elise', from: 'elise', text: 'Merci.' },
    { id: 'e-alerte1', threadId: 't-elise', from: 'elise', text: 'Je viens de recevoir une alerte.' },
    { id: 'e-alerte2', threadId: 't-elise', from: 'elise', text: 'La caméra est à côté de moi, dans son carton. Rien n’est branché.', notify: false },
    { id: 'e-alerte3', threadId: 't-elise', from: 'elise', text: 'Sur l’application, la porte est entrouverte. Elle était fermée tout à l’heure.', notify: false },
    { id: 'e-ouverte', threadId: 't-elise', from: 'elise', text: 'La porte est grande ouverte sur l’application. Il n’y a rien derrière.' },

    { id: 'g-1', threadId: 't-gabriel', from: 'gabriel', text: 'Ça passe encore ?', notify: 'nouveau message' },
    { id: 'g-2', threadId: 't-gabriel', from: 'gabriel', text: 'Je tiens la porte.', notify: false },
    { id: 'g-3', threadId: 't-gabriel', from: 'gabriel', text: 'Les deux sont sortis ?', notify: false },
    { id: 'g-qui', threadId: 't-gabriel', from: 'gabriel', text: 'Gabriel. Je peux pas lâcher la porte.' },
    { id: 'g-sortez', threadId: 't-gabriel', from: 'gabriel', text: 'Pas avant eux.' },
    { id: 'g-verifier', threadId: 't-gabriel', from: 'gabriel', text: 'Faites vite.' },
    { id: 'g-vus', threadId: 't-gabriel', from: 'gabriel', text: 'Vous les avez vus ?' },
    { id: 'g-passez', threadId: 't-gabriel', from: 'gabriel', text: 'Passez-les-moi.' },
    { id: 'g-ok', threadId: 't-gabriel', from: 'gabriel', text: 'D’accord.' },
    { id: 'g-lacher', threadId: 't-gabriel', from: 'gabriel', text: 'Je peux lâcher maintenant.', notify: false },
    { id: 'g-ok2', threadId: 't-gabriel', from: 'gabriel', text: 'D’accord.' },
    { id: 'g-lacher2', threadId: 't-gabriel', from: 'gabriel', text: 'Je peux lâcher maintenant.', notify: false },
  ],

  replies: [
    /* Élise — questions libres */
    {
      id: 'q-alim',
      threadId: 't-elise',
      label: 'Vous êtes certaine qu’elle n’est plus alimentée ?',
      available: { messageDelivered: 'e-bonjour' },
      effects: [
        { type: 'deliverMessage', messageId: 'e-a1' },
        { type: 'deliverMessage', messageId: 'e-a2', delayMs: 1200 },
        { type: 'deliverMessage', messageId: 'e-a3', delayMs: 1400 },
      ],
    },
    {
      id: 'q-compte',
      threadId: 't-elise',
      label: 'Qui a accès au compte de la caméra ?',
      available: { messageDelivered: 'e-bonjour' },
      effects: [{ type: 'deliverMessage', messageId: 'e-b1' }],
    },
    {
      id: 'q-change',
      threadId: 't-elise',
      label: 'Les images ont-elles déjà changé ?',
      available: { messageDelivered: 'e-bonjour' },
      effects: [
        { type: 'deliverMessage', messageId: 'e-c1' },
        { type: 'deliverMessage', messageId: 'e-c2', delayMs: 1500 },
        { type: 'deliverMessage', messageId: 'e-c3', delayMs: 1100 },
      ],
    },
    {
      id: 'q-garder',
      threadId: 't-elise',
      label: 'Avez-vous réussi à garder l’image avec la porte ouverte ?',
      available: { observationFound: 'feuille-instable' },
      effects: [{ type: 'deliverMessage', messageId: 'e-d1', delayMs: 1800 }],
    },
    {
      id: 'q-vannier',
      threadId: 't-elise',
      label: 'Le nom G. Vannier vous dit quelque chose ?',
      available: { observationFound: 'feuille-lisible' },
      effects: [
        { type: 'deliverMessage', messageId: 'e-e1' },
        { type: 'deliverMessage', messageId: 'e-e2', delayMs: 3500 },
        { type: 'deliverMessage', messageId: 'e-e3', delayMs: 1100 },
      ],
    },
    /* Épilogue */
    {
      id: 'q-fin',
      threadId: 't-elise',
      label: 'Il sait qu’ils sont sortis.',
      whenSolved: true,
      available: { messageDelivered: 'e-f3' },
      effects: [
        { type: 'deliverMessage', messageId: 'e-merci' },
        { type: 'deliverMail', mailId: 'cc-brouillon', delayMs: 7000 },
      ],
    },

    /* Gabriel — uniquement quand il est joignable */
    {
      id: 'g-r-qui',
      threadId: 't-gabriel',
      label: 'Qui êtes-vous ?',
      available: gabrielReady,
      effects: [{ type: 'deliverMessage', messageId: 'g-qui', holdUntil: gabrielOnline }],
    },
    {
      id: 'g-r-sortez',
      threadId: 't-gabriel',
      label: 'Sortez de là.',
      available: gabrielReady,
      effects: [{ type: 'deliverMessage', messageId: 'g-sortez', holdUntil: gabrielOnline }],
    },
    {
      id: 'g-r-verifier',
      threadId: 't-gabriel',
      label: 'Je vais vérifier.',
      available: gabrielReady,
      effects: [{ type: 'deliverMessage', messageId: 'g-verifier', holdUntil: gabrielOnline }],
    },
    {
      id: 'g-r-sortis',
      threadId: 't-gabriel',
      label: 'Aline et Hugo sont sortis. Ils sont en sécurité.',
      available: { all: [gabrielReady, { mediaViewed: 'article' }] },
      effects: [{ type: 'deliverMessage', messageId: 'g-vus', holdUntil: gabrielOnline }],
    },
    {
      id: 'g-r-temoignage',
      threadId: 't-gabriel',
      label: 'Leur témoignage le confirme. Vous leur avez permis de sortir.',
      available: { all: [gabrielOnline, { messageDelivered: 'g-vus' }, { not: { replySent: 'g-r-avec' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'g-ok', holdUntil: gabrielOnline },
        { type: 'deliverMessage', messageId: 'g-lacher', delayMs: 2200, holdUntil: gabrielOnline },
      ],
    },
    {
      id: 'g-r-avec',
      threadId: 't-gabriel',
      label: 'Oui, je suis avec eux.',
      available: { all: [gabrielOnline, { messageDelivered: 'g-vus' }, { not: { replySent: 'g-r-temoignage' } }] },
      effects: [{ type: 'deliverMessage', messageId: 'g-passez', holdUntil: gabrielOnline }],
    },
    {
      id: 'g-r-corrige',
      threadId: 't-gabriel',
      label: 'Je ne suis pas avec eux. J’ai leur témoignage. Ils sont sortis.',
      available: { all: [gabrielOnline, { messageDelivered: 'g-passez' }] },
      effects: [
        { type: 'deliverMessage', messageId: 'g-ok2', holdUntil: gabrielOnline },
        { type: 'deliverMessage', messageId: 'g-lacher2', delayMs: 2200, holdUntil: gabrielOnline },
      ],
    },
  ],

  observations: [
    { id: 'mur-fond', title: 'Le fond du couloir est un mur plein.', mediaId: 'img-4821', actions: [{ type: 'addToFile' }] },
    {
      id: 'porte-gauche',
      title: 'La porte de gauche est la même sur la photo et sur la capture.',
      mediaId: 'img-4821',
      actions: [{ type: 'addToFile' }],
    },
    {
      id: 'porte-fond',
      title: 'Une porte fermée occupe le fond du couloir.',
      description: 'Sur la photo prise avant le départ, cet endroit est un mur.',
      mediaId: 'capture',
      actions: [{ type: 'addToFile' }],
    },
    { id: 'prise', title: 'L’adaptateur secteur n’est relié à rien.', mediaId: 'img-5093', actions: [{ type: 'addToFile' }] },
    { id: 'camera', title: 'La caméra repose dans le carton, sans câble branché.', mediaId: 'img-5093', actions: [{ type: 'addToFile' }] },
    {
      id: 'porte-entrouverte',
      title: 'La porte du fond est entrouverte. Une feuille y est fixée.',
      mediaId: 'capture',
      actions: [{ type: 'addToFile' }],
    },
    {
      id: 'feuille-instable',
      title: 'Le texte change alors que le reste de l’image reste identique.',
      mediaId: 'capture',
      actions: [{ type: 'addToFile' }, { type: 'ask', replyId: 'q-garder', label: 'Questionner Élise' }],
    },
    {
      id: 'feuille-lisible',
      title: 'L’écriture de la feuille est lisible.',
      description: '18 novembre 2014 · 03:17 · G. Vannier · « Les deux sont sortis ? »',
      mediaId: 'capture',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'q-vannier', label: 'Questionner Élise' }],
    },
    { id: 'piece-vide', title: 'La porte est grande ouverte sur une pièce vide.', mediaId: 'capture', actions: [{ type: 'addToFile' }] },
    { id: 'mur-revenu', title: 'Le fond du couloir est de nouveau un mur.', mediaId: 'capture', actions: [{ type: 'addToFile' }] },
    { id: 'question-barree', title: 'Sur la copie conservée, la question est désormais barrée.', mediaId: 'capture', autoFile: true, actions: [] },
    {
      id: 'doc-ancien-reglage',
      title: 'Ancien téléphone : réglage automatique désactivé, horloge restée à 03:17.',
      mediaId: 'comparaison',
      autoFile: true,
      actions: [],
    },
    { id: 'doc-ancien-porte', title: 'Ancien téléphone : porte entrouverte.', mediaId: 'comparaison', autoFile: true, actions: [] },
    {
      id: 'art-passage',
      title: 'Gabriel Vannier est resté en arrière pour maintenir le passage ouvert.',
      mediaId: 'article',
      autoFile: true,
      actions: [],
    },
    { id: 'art-survivants', title: 'Aline Mercier et son fils Hugo ont été pris en charge sains et saufs.', mediaId: 'article', autoFile: true, actions: [] },
    {
      id: 'art-derniere',
      title: 'Sa dernière communication, à 03 h 17, n’a jamais reçu de réponse.',
      mediaId: 'article',
      autoFile: true,
      actions: [],
    },
    { id: 'art-condamne', title: 'Le passage endommagé devait être condamné lors des travaux.', mediaId: 'article', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'origine', objective: 'D’où viennent les images reçues par Élise ?' }],

  obstacles: [
    {
      id: 'image',
      solved: { flag: 'variante-recue' },
      hints: [
        'Élise a vu deux versions d’un même fichier sur deux téléphones.',
        'Dans son document, un réglage diffère entre les deux appareils.',
        'Dans Réglages, désactivez la date et l’heure automatiques et choisissez 03:17. Gardez le réseau actif.',
      ],
    },
    {
      id: 'lire',
      // Dépassé aussi si le joueur a trouvé l'article ou terminé l'échange par un autre chemin.
      solved: { any: [{ observationFound: 'feuille-lisible' }, { mediaViewed: 'article' }, ended] },
      hints: [
        'La photo change sans qu’Élise la modifie. Sa sœur a pourtant pu lire l’écriture.',
        'Qu’est-ce qui avait changé pendant le trajet en avion ?',
        'Après avoir reçu la photo avec la porte entrouverte, activez le mode avion à 03:17. Ouvrez de nouveau l’image et conservez une copie.',
      ],
    },
    {
      id: 'identifier',
      solved: { any: [{ mediaViewed: 'article' }, ended] },
      hints: [
        'La feuille porte un nom. Élise connaît peut-être quelqu’un qui peut le retrouver.',
        'Vous pouvez questionner Élise sur G. Vannier une fois reconnecté.',
        'Désactivez le mode avion, demandez à Élise qui est G. Vannier et ouvrez l’article qu’elle transmet.',
      ],
    },
    {
      id: 'joindre',
      solved: { any: [{ messageDelivered: 'g-3' }, ended] },
      hints: [
        'L’heure a déjà changé ce que le téléphone recevait. La feuille contient une autre information temporelle.',
        'La transmission est rattachée à un jour précis, pas seulement à une heure.',
        'Réglez la date sur le 18 novembre 2014 et l’heure sur 03:17, avec le mode avion désactivé.',
      ],
    },
    {
      id: 'repondre',
      solved: ended,
      hints: [
        'Gabriel attend une information sur deux personnes.',
        'L’article rapporte le sort d’Aline et Hugo.',
        'Dites-lui qu’Aline et Hugo sont sortis, puis que leur témoignage le confirme.',
      ],
    },
    {
      id: 'terminer',
      solved: { flag: 'affaire-close' },
      hints: [
        'La communication est terminée, mais votre téléphone est encore réglé sur cette nuit-là.',
        'Il reste à revenir au présent.',
        'Réactivez le réglage automatique de la date et de l’heure.',
      ],
    },
  ],

  rules: [
    /* Accueil */
    { id: 'bonjour', when: { caseAccepted: true }, effects: [{ type: 'deliverMessage', messageId: 'e-bonjour', delayMs: 1600 }] },

    /* Énigme 1 : 03:17 avec le réseau → porte entrouverte, écriture instable (à chaque passage). */
    {
      id: 'recevoir-variante',
      once: false,
      when: { all: [at0317, online, { not: ended }] },
      effects: [
        { type: 'setMediaVariant', mediaId: 'capture', variantId: 'instable' },
        { type: 'setFlag', name: 'variante-recue', value: true },
      ],
    },
    {
      id: 'notifier-variante',
      when: { flag: 'variante-recue' },
      effects: [
        { type: 'notify', title: 'capture_0317.jpg', body: 'Fichier actualisé', app: 'photos' },
        { type: 'log', text: 'capture_0317.jpg a été actualisé.' },
      ],
    },
    /* Premier signe : Élise reçoit l'alerte au moment où le fichier change. */
    {
      id: 'alerte-elise',
      when: { flag: 'variante-recue' },
      effects: [
        { type: 'deliverMessage', messageId: 'e-alerte1', delayMs: 4000 },
        { type: 'deliverMessage', messageId: 'e-alerte2', delayMs: 2200 },
        { type: 'deliverMessage', messageId: 'e-alerte3', delayMs: 2600 },
      ],
    },
    /* Quitter 03:17 avec le réseau : la version connectée redevient la porte fermée. */
    {
      id: 'retour-porte-fermee',
      once: false,
      when: { all: [{ not: at0317 }, online, { not: ended }, D_VARIANTS] },
      effects: [{ type: 'setMediaVariant', mediaId: 'capture', variantId: 'fermee' }],
    },

    /* Énigme 2 : couper la connexion à 03:17 stabilise la version reçue. */
    {
      id: 'stabiliser',
      once: false,
      when: { all: [at0317, { airplane: true }, { mediaVariant: 'capture', is: 'instable' }] },
      effects: [{ type: 'setMediaVariant', mediaId: 'capture', variantId: 'lisible' }],
    },

    /* Énigme 3 : la nuit du 18 novembre 2014, 03:17, avec le réseau → G. Vannier écrit. */
    {
      id: 'contact-gabriel',
      when: gabrielOnline,
      effects: [
        { type: 'deliverMessage', messageId: 'g-1', delayMs: 1500, holdUntil: gabrielOnline },
        { type: 'deliverMessage', messageId: 'g-2', delayMs: 1800, holdUntil: gabrielOnline },
        { type: 'deliverMessage', messageId: 'g-3', delayMs: 2000, holdUntil: gabrielOnline },
        { type: 'log', text: 'Nouveau contact : G. Vannier.' },
      ],
    },

    /* Réponse transmise : la porte s'ouvre sur une pièce vide. */
    {
      id: 'echange-termine',
      when: { any: [{ messageDelivered: 'g-lacher' }, { messageDelivered: 'g-lacher2' }] },
      effects: [
        { type: 'setFlag', name: 'echange-termine', value: true },
        { type: 'setMediaVariant', mediaId: 'capture', variantId: 'ouverte' },
        { type: 'log', text: 'G. Vannier ne répond plus.' },
        { type: 'deliverMessage', messageId: 'e-ouverte', delayMs: 5000 },
      ],
    },

    /* Revenir au présent : fin de l'affaire. */
    {
      id: 'retour-present',
      when: { all: [ended, { clockAuto: true }] },
      effects: [
        { type: 'setMediaVariant', mediaId: 'capture', variantId: 'mur' },
        { type: 'setFlag', name: 'affaire-close', value: true },
        // Seule trace laissée : sur la copie conservée, la question est barrée.
        { type: 'alterCopies', mediaId: 'capture', fromVariant: 'lisible', toVariant: 'barree' },
        { type: 'deliverMessage', messageId: 'e-f1', delayMs: 2500 },
        { type: 'deliverMessage', messageId: 'e-f2', delayMs: 1600 },
        { type: 'deliverMessage', messageId: 'e-f3', delayMs: 1800 },
        { type: 'log', text: 'Retour au présent. La caméra s’est déconnectée.' },
        { type: 'solveCase' },
      ],
    },
  ],

  report: {
    text: [
      'Les images reçues par Élise viennent de {qui}, mort dans l’incendie du 8, rue des Ormes, le {date}.',
      'Cette nuit-là, il {acte} pour que {sauves} puissent sortir.',
      'Sa dernière communication, à 03:17, demandait {question} Personne ne lui avait répondu.',
    ],
    blanks: {
      qui: {
        answer: 'Gabriel Vannier',
        options: [
          { text: 'Gabriel Vannier', requires: { any: [{ observationFound: 'feuille-lisible' }, { mediaViewed: 'article' }, { messageDelivered: 'g-qui' }] } },
          { text: 'Hugo Mercier', requires: { mediaViewed: 'article' } },
          { text: 'l’ancienne propriétaire' },
          { text: 'l’ancien locataire du couloir' },
        ],
      },
      date: {
        answer: '18 novembre 2014',
        options: [
          { text: '18 novembre 2014', requires: { any: [{ observationFound: 'feuille-lisible' }, { mediaViewed: 'article' }] } },
          { text: '19 novembre 2014', requires: { mediaViewed: 'article' } },
          { text: '17 octobre 2014' },
          { text: '3 novembre 2014' },
        ],
      },
      acte: {
        answer: 'a tenu le passage ouvert',
        options: [
          { text: 'a tenu le passage ouvert', requires: { any: [{ mediaViewed: 'article' }, { messageDelivered: 'g-2' }] } },
          { text: 'a condamné la chambre', requires: { mediaViewed: 'article' } },
          { text: 'a débranché la caméra' },
          { text: 'a appelé les pompiers' },
        ],
      },
      sauves: {
        answer: 'Aline et Hugo Mercier',
        options: [
          { text: 'Aline et Hugo Mercier', requires: { mediaViewed: 'article' } },
          { text: 'Élise et sa sœur', requires: { messageDelivered: 'e-d1' } },
          { text: 'les voisins du dessus' },
          { text: 'les pompiers' },
        ],
      },
      question: {
        answer: '« Les deux sont sortis ? »',
        options: [
          { text: '« Les deux sont sortis ? »', requires: { any: [{ observationFound: 'feuille-lisible' }, { messageDelivered: 'g-3' }] } },
          { text: '« Ça passe encore ? »', requires: { messageDelivered: 'g-1' } },
          { text: '« Je tiens la porte. »', requires: { messageDelivered: 'g-2' } },
          { text: '« Qui êtes-vous ? »' },
        ],
      },
    },
  },
  about: { duration: '~15 min', tone: 'Surnaturel' },
  conclusion: {
    title: 'Affaire résolue',
    text: [
      'Les images étaient liées à la dernière communication de Gabriel Vannier. Aline et Hugo avaient survécu. La réponse qui ne lui était jamais parvenue a enfin été transmise.',
    ],
  },
};
