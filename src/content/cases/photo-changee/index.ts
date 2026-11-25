/**
 * Enquête 2 — « Cette photo a changé » (affaire non surnaturelle).
 *
 * Vérité interne : Paul Rey est mort il y a un an. Depuis octobre, sa fille Léa
 * (14 ans) l'ajoute sur les nouvelles photos de l'album familial partagé, avec
 * l'application Retouche+ installée sur l'ancien iPad de son père. Elle le
 * découpe toujours dans le même souvenir de Saint-Malo : même pose, même veste.
 *
 * Mécaniques :
 * - les montages se trahissent : pas d'ombre au parc, pas de reflet dans la vitre ;
 * - l'album partagé se resynchronise : hors ligne, la copie locale du parc
 *   (téléchargée avant la retouche) ne montre pas Paul ;
 * - les Infos des photos indiquent « Modifiée avec Retouche+ · iPad de Paul » ;
 * - fin à choix, sans échec : vérité froide ou vérité qui ménage Léa.
 *
 * Un doute volontaire subsiste : la photo de la plage (août), antérieure à
 * l'installation de l'application et jamais modifiée, montre au loin une
 * silhouette. Rien ne l'explique, rien n'y renvoie.
 */
import type { CaseDefinition, Condition } from '../../../game/types';

const DIR = '/media/cases/photo-changee';
const IMG = { width: 1086, height: 1448 };

const finFroide: Condition = { replySent: 'f-froid' };
const finDouce: Condition = { messageDelivered: 'a-garder' };

/* Zones (coordonnées relatives, mesurées sur les photos). */
const PAUL_PARC = { x: 0.75, y: 0.1, w: 0.17, h: 0.4 };
const OMBRES_PARC = { x: 0.05, y: 0.76, w: 0.9, h: 0.2 };
const PAUL_ANNIV = { x: 0.72, y: 0.12, w: 0.27, h: 0.65 };
const REFLET_ANNIV = { x: 0.2, y: 0.28, w: 0.32, h: 0.21 };

const infosAnniv = [
  { label: 'Prise le', value: '9 novembre 2026, 20:14' },
  { label: 'Appareil', value: 'iPhone d’Anna' },
  { label: 'Modifiée le', value: '10 novembre 2026, 00:37', observationId: 'info-modifiee' },
  { label: 'Modifiée avec', value: 'Retouche+ · iPad de Paul', observationId: 'info-ipad' },
];

export const photoChangee: CaseDefinition = {
  id: 'photo-changee',
  title: 'Cette photo a changé',
  client: 'anna',
  characters: [
    { id: 'anna', name: 'Anna Rey', initials: 'A', color: '#4f5d6b', role: 'Cliente' },
    { id: 'lea', name: 'Léa Rey', initials: 'L', color: '#6b4f5d' },
  ],

  media: [
    /* Pièces jointes de l'e-mail : fichiers téléchargés, ils ne changent pas. */
    {
      id: 'mail-parc',
      kind: 'image',
      name: 'parc.jpg',
      sizeLabel: '3,1 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/parc.jpg`,
          ...IMG,
          alt: 'Anna et Léa sur un banc dans un parc en automne. Un homme en veste verte se tient debout en retrait, derrière elles.',
          hotspots: [
            { id: 'mp-paul', ...PAUL_PARC, observationId: 'parc-ombre' },
            { id: 'mp-ombres', ...OMBRES_PARC, observationId: 'parc-ombres' },
          ],
          info: [
            { label: 'Prise le', value: '2 novembre 2026, 15:42' },
            { label: 'Appareil', value: 'iPhone d’Anna' },
            { label: 'Modifiée le', value: '3 novembre 2026, 23:51', observationId: 'info-modifiee' },
            { label: 'Modifiée avec', value: 'Retouche+ · iPad de Paul', observationId: 'info-ipad' },
          ],
        },
      },
    },
    {
      id: 'mail-anniv',
      kind: 'image',
      name: 'anniversaire.jpg',
      sizeLabel: '2,7 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/anniversaire.jpg`,
          ...IMG,
          alt: 'Léa souffle ses bougies, Anna à côté d’elle. Au fond, un homme en veste verte se tient près d’une baie vitrée qui reflète la cuisine.',
          hotspots: [
            { id: 'ma-paul', ...PAUL_ANNIV, observationId: 'anniv-paul' },
            { id: 'ma-reflet', ...REFLET_ANNIV, observationId: 'anniv-reflet' },
          ],
          info: infosAnniv,
        },
      },
    },

    /* Album partagé « Famille » : se resynchronise avec le réseau. */
    {
      id: 'album-parc',
      kind: 'image',
      name: 'IMG_7714.jpg',
      sizeLabel: '3,1 Mo',
      album: 'Famille',
      defaultVariant: 'synchro',
      variants: {
        synchro: {
          src: `${DIR}/parc.jpg`,
          ...IMG,
          alt: 'Album Famille : Anna et Léa sur un banc. Un homme en veste verte se tient debout en retrait, derrière elles.',
          hotspots: [
            { id: 'ap-paul', ...PAUL_PARC, observationId: 'parc-ombre' },
            { id: 'ap-ombres', ...OMBRES_PARC, observationId: 'parc-ombres' },
          ],
          info: [
            { label: 'Prise le', value: '2 novembre 2026, 15:42' },
            { label: 'Appareil', value: 'iPhone d’Anna' },
            { label: 'Modifiée le', value: '3 novembre 2026, 23:51', observationId: 'info-modifiee' },
            { label: 'Modifiée avec', value: 'Retouche+ · iPad de Paul', observationId: 'info-ipad' },
            { label: 'Album', value: 'Famille · synchronisé' },
          ],
        },
        locale: {
          src: `${DIR}/parc-original.jpg`,
          ...IMG,
          alt: 'Album Famille, copie locale : Anna et Léa sur un banc. Personne derrière elles.',
          hotspots: [{ id: 'al-vide', ...PAUL_PARC, observationId: 'parc-hors-ligne' }],
          info: [
            { label: 'Prise le', value: '2 novembre 2026, 15:42' },
            { label: 'Appareil', value: 'iPhone d’Anna' },
            { label: 'Album', value: 'Famille · copie locale (hors ligne)', observationId: 'info-locale' },
          ],
        },
      },
    },
    {
      id: 'album-anniv',
      kind: 'image',
      name: 'IMG_7802.jpg',
      sizeLabel: '2,7 Mo',
      album: 'Famille',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/anniversaire.jpg`,
          ...IMG,
          alt: 'Album Famille : l’anniversaire de Léa. Un homme en veste verte au fond, près de la baie vitrée.',
          hotspots: [
            { id: 'aa-paul', ...PAUL_ANNIV, observationId: 'anniv-paul' },
            { id: 'aa-reflet', ...REFLET_ANNIV, observationId: 'anniv-reflet' },
          ],
          info: infosAnniv,
        },
      },
    },
    {
      id: 'album-plage',
      kind: 'image',
      name: 'IMG_6630.jpg',
      sizeLabel: '2,2 Mo',
      album: 'Famille',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/plage-2026.jpg`,
          ...IMG,
          alt: 'Album Famille : Léa pieds nus sur une plage. Au loin, un homme marche au bord de l’eau.',
          hotspots: [{ id: 'pl-loin', x: 0.87, y: 0.3, w: 0.08, h: 0.13, observationId: 'plage-silhouette' }],
          info: [
            { label: 'Prise le', value: '9 août 2026, 17:05' },
            { label: 'Appareil', value: 'iPhone d’Anna' },
            { label: 'Modifications', value: 'Aucune', observationId: 'plage-intacte' },
            { label: 'Album', value: 'Famille · synchronisé' },
          ],
        },
      },
    },
    {
      id: 'souvenir',
      kind: 'image',
      name: 'saint-malo.jpg',
      sizeLabel: '2,9 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/paul-souvenir.jpg`,
          ...IMG,
          alt: 'Paul et Léa, plus jeune, sur une promenade au bord de la mer. Paul porte une veste en velours vert, une main dans la poche.',
          hotspots: [{ id: 'so-paul', x: 0.16, y: 0.04, w: 0.38, h: 0.93, observationId: 'souvenir-pose' }],
          info: [
            { label: 'Prise le', value: '18 juillet 2023, 11:20' },
            { label: 'Appareil', value: 'iPhone de Paul' },
          ],
        },
      },
    },
  ],

  locked: true,
  initialMail: {
    id: 'pc-mail',
    from: 'anna',
    subject: 'Cette photo a changé',
    timeLabel: '21:03',
    preview: 'Mon mari, Paul, est mort il y a un an.',
    body: [
      'Bonjour,',
      'Mon mari, Paul, est mort il y a un an.',
      'Depuis trois semaines, il apparaît sur des photos récentes. Ma fille et moi au parc : il est derrière nous. À l’anniversaire de Léa : il est au fond de la cuisine.',
      'Je n’ai rien modifié. Je vous joins les deux photos.',
      'Je ne sais pas si j’ai peur ou si j’ai envie que ce soit vrai.',
      'Anna',
    ],
    attachments: ['mail-parc', 'mail-anniv'],
  },

  threads: [
    { id: 't-anna', contact: 'anna' },
    { id: 't-lea', contact: 'lea' },
  ],

  messages: [
    { id: 'a-bonjour', threadId: 't-anna', from: 'anna', text: 'Merci de me répondre. Je n’en ai parlé à personne. Même pas à Léa.' },
    { id: 'a-album1', threadId: 't-anna', from: 'anna', text: 'Dans notre album partagé, « Famille ». Je vous y ajoute.' },
    { id: 'a-album2', threadId: 't-anna', from: 'anna', text: 'Une chose bizarre : ce matin, dans le métro, la photo du parc était normale. Sans lui. En sortant, il était revenu.', notify: false },
    { id: 'a-acces', threadId: 't-anna', from: 'anna', text: 'Léa et moi. Et le compte de Paul. Je n’ai jamais eu le courage de le fermer.' },
    { id: 'a-souv1', threadId: 't-anna', from: 'anna', text: 'Celle-ci. Saint-Malo, il y a trois ans. Léa l’adore, elle l’a en fond d’écran.' },
    { id: 'a-souv2', threadId: 't-anna', from: 'anna', attachments: ['souvenir'], notify: false },
    { id: 'a-ombre', threadId: 't-anna', from: 'anna', text: 'Je n’avais pas remarqué. Ça veut dire qu’il n’est pas vraiment là ?' },
    { id: 'a-ipad1', threadId: 't-anna', from: 'anna', text: 'Il est dans la chambre de Léa. Elle s’en sert pour ses cours.' },
    { id: 'a-ipad2', threadId: 't-anna', from: 'anna', text: 'Vous pensez que c’est elle ?', notify: false },
    { id: 'a-froid1', threadId: 't-anna', from: 'anna', text: 'Donc ce n’est pas lui.' },
    { id: 'a-froid2', threadId: 't-anna', from: 'anna', text: 'Je vais supprimer l’album. Merci pour votre travail.', notify: false },
    { id: 'a-doux1', threadId: 't-anna', from: 'anna', text: 'D’accord. Je vais lui parler ce soir.' },
    { id: 'l-1', threadId: 't-lea', from: 'lea', text: 'Maman m’a dit que c’était vous.' },
    { id: 'l-2', threadId: 't-lea', from: 'lea', text: 'Je voulais juste qu’il soit encore sur les photos.', notify: false },
    { id: 'l-3', threadId: 't-lea', from: 'lea', text: 'Je l’ai découpé sur la photo de Saint-Malo. C’est la seule où il sourit vraiment.' },
    { id: 'a-garder', threadId: 't-anna', from: 'anna', text: 'On a regardé l’album ensemble, Léa et moi. On les garde.' },
  ],

  replies: [
    {
      id: 'q-album',
      threadId: 't-anna',
      label: 'Où sont rangées ces photos ?',
      available: { messageDelivered: 'a-bonjour' },
      effects: [
        { type: 'deliverMessage', messageId: 'a-album1' },
        { type: 'grantMedia', mediaId: 'album-parc' },
        { type: 'grantMedia', mediaId: 'album-anniv' },
        { type: 'grantMedia', mediaId: 'album-plage' },
        { type: 'deliverMessage', messageId: 'a-album2', delayMs: 2600 },
      ],
    },
    {
      id: 'q-acces',
      threadId: 't-anna',
      label: 'Qui a accès à cet album ?',
      available: { messageDelivered: 'a-album1' },
      effects: [{ type: 'deliverMessage', messageId: 'a-acces', delayMs: 1800 }],
    },
    {
      id: 'q-ombre',
      threadId: 't-anna',
      label: 'Sur la photo du parc, Paul n’a pas d’ombre.',
      available: { observationFound: 'parc-ombre' },
      effects: [{ type: 'deliverMessage', messageId: 'a-ombre', delayMs: 2200 }],
    },
    {
      id: 'q-souvenir',
      threadId: 't-anna',
      label: 'Avez-vous une photo de Paul prise avant ?',
      available: { any: [{ observationFound: 'parc-ombre' }, { observationFound: 'anniv-paul' }, { observationFound: 'anniv-reflet' }] },
      effects: [
        { type: 'deliverMessage', messageId: 'a-souv1', delayMs: 2000 },
        { type: 'deliverMessage', messageId: 'a-souv2', delayMs: 1000 },
      ],
    },
    {
      id: 'q-ipad',
      threadId: 't-anna',
      label: 'Qui utilise l’iPad de Paul ?',
      available: { observationFound: 'info-ipad' },
      effects: [
        { type: 'deliverMessage', messageId: 'a-ipad1', delayMs: 2000 },
        { type: 'deliverMessage', messageId: 'a-ipad2', delayMs: 2600 },
      ],
    },
    {
      id: 'f-froid',
      threadId: 't-anna',
      label: 'Quelqu’un ajoute Paul sur les photos avec cet iPad. Ce n’est pas lui.',
      available: { all: [{ messageDelivered: 'a-ipad2' }, { not: { replySent: 'f-doux' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'a-froid1', delayMs: 2500 },
        { type: 'deliverMessage', messageId: 'a-froid2', delayMs: 2200 },
      ],
    },
    {
      id: 'f-doux',
      threadId: 't-anna',
      label: 'C’est sûrement Léa. Parlez-lui avant de supprimer quoi que ce soit.',
      available: { all: [{ messageDelivered: 'a-ipad2' }, { not: { replySent: 'f-froid' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'a-doux1', delayMs: 2000 },
        { type: 'deliverMessage', messageId: 'l-1', delayMs: 9000 },
        { type: 'deliverMessage', messageId: 'l-2', delayMs: 2200 },
      ],
    },
    {
      id: 'l-r-1',
      threadId: 't-lea',
      label: 'Je comprends. Ta mère n’est pas fâchée.',
      available: { all: [{ messageDelivered: 'l-2' }, { not: { replySent: 'l-r-2' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'l-3', delayMs: 2400 },
        { type: 'deliverMessage', messageId: 'a-garder', delayMs: 6000 },
      ],
    },
    {
      id: 'l-r-2',
      threadId: 't-lea',
      label: 'Comment tu as fait ?',
      available: { all: [{ messageDelivered: 'l-2' }, { not: { replySent: 'l-r-1' } }] },
      effects: [
        { type: 'deliverMessage', messageId: 'l-3', delayMs: 2400 },
        { type: 'deliverMessage', messageId: 'a-garder', delayMs: 6000 },
      ],
    },
  ],

  observations: [
    {
      id: 'parc-ombre',
      title: 'Paul n’a pas d’ombre. Anna, Léa et le banc en ont une.',
      mediaId: 'mail-parc',
      actions: [{ type: 'addToFile' }, { type: 'ask', replyId: 'q-ombre', label: 'Questionner Anna' }],
    },
    { id: 'parc-ombres', title: 'Les ombres d’Anna, de Léa et du banc s’étirent nettement sur le gravier.', mediaId: 'mail-parc', actions: [{ type: 'addToFile' }] },
    { id: 'anniv-paul', title: 'Paul se tient au fond de la pièce, une main dans la poche.', mediaId: 'mail-anniv', actions: [{ type: 'addToFile' }] },
    {
      id: 'anniv-reflet',
      title: 'La baie vitrée reflète Anna, Léa et la cuisine. Paul n’y apparaît pas.',
      mediaId: 'mail-anniv',
      actions: [{ type: 'addToFile' }],
    },
    {
      id: 'parc-hors-ligne',
      title: 'Hors ligne, la copie locale de l’album montre le parc sans Paul.',
      mediaId: 'album-parc',
      autoFile: true,
      actions: [],
    },
    { id: 'info-locale', title: 'Hors ligne, l’album affiche une copie locale de la photo.', mediaId: 'album-parc', autoFile: true, actions: [] },
    { id: 'info-modifiee', title: 'La photo a été modifiée le lendemain de sa prise, vers minuit.', mediaId: 'mail-parc', autoFile: true, actions: [] },
    {
      id: 'info-ipad',
      title: 'Modifiée avec Retouche+, sur l’iPad de Paul.',
      mediaId: 'mail-parc',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'q-ipad', label: 'Questionner Anna' }],
    },
    {
      id: 'souvenir-pose',
      title: 'Même veste, même main dans la poche, même angle que sur les photos récentes.',
      mediaId: 'souvenir',
      actions: [{ type: 'addToFile' }],
    },
    { id: 'plage-silhouette', title: 'Au loin, un homme marche au bord de l’eau.', mediaId: 'album-plage', actions: [{ type: 'addToFile' }] },
    { id: 'plage-intacte', title: 'La photo de la plage, prise en août, n’a jamais été modifiée.', mediaId: 'album-plage', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'origine', objective: 'Pourquoi Paul apparaît-il sur les nouvelles photos ?' }],

  obstacles: [
    {
      id: 'anomalies',
      solved: { any: [{ observationFound: 'parc-ombre' }, { observationFound: 'anniv-reflet' }, { observationFound: 'info-ipad' }] },
      hints: [
        'Comparez Paul aux autres personnes sur les photos.',
        'Regardez ce que la lumière produit autour de chacun : ombres, reflets.',
        'Touchez Paul sur la photo du parc : il n’a pas d’ombre. Sur la photo d’anniversaire, touchez le reflet dans la baie vitrée.',
      ],
    },
    {
      id: 'album',
      solved: { any: [{ messageDelivered: 'a-album1' }, { observationFound: 'info-ipad' }] },
      hints: [
        'Anna range ses photos quelque part.',
        'Demandez-lui où sont les photos.',
        'Dans Messages, demandez à Anna où sont rangées ces photos, puis ouvrez l’album « Famille » dans Photos.',
      ],
    },
    {
      id: 'modifiee',
      solved: { any: [{ observationFound: 'info-ipad' }, { observationFound: 'parc-hors-ligne' }] },
      hints: [
        'Dans le métro, Anna a vu la photo du parc sans Paul.',
        'Que devient un album partagé quand le téléphone n’a plus de réseau ? Et que disent les informations d’une photo ?',
        'Activez le mode avion et rouvrez la photo du parc dans l’album. Ouvrez aussi ses Infos (bouton ⓘ).',
      ],
    },
    {
      id: 'qui',
      solved: { messageDelivered: 'a-ipad2' },
      hints: [
        'Les Infos d’une photo indiquent avec quel appareil elle a été modifiée.',
        'L’appareil appartenait à Paul. Quelqu’un s’en sert aujourd’hui.',
        'Ouvrez les Infos de la photo du parc, touchez « Retouche+ · iPad de Paul », puis demandez à Anna qui utilise cet iPad.',
      ],
    },
    {
      id: 'repondre',
      solved: { any: [finFroide, finDouce] },
      hints: [
        'Anna attend votre conclusion.',
        'Vous pouvez lui dire la vérité de deux façons.',
        'Dans Messages, choisissez l’une des deux réponses finales à Anna.',
      ],
    },
  ],

  rules: [
    { id: 'bonjour', when: { caseAccepted: true }, effects: [{ type: 'deliverMessage', messageId: 'a-bonjour', delayMs: 1600 }] },

    /* Album partagé : hors ligne, copie locale téléchargée avant la retouche ; en ligne, version synchronisée. */
    {
      id: 'album-hors-ligne',
      once: false,
      when: { airplane: true },
      effects: [{ type: 'setMediaVariant', mediaId: 'album-parc', variantId: 'locale' }],
    },
    {
      id: 'album-en-ligne',
      once: false,
      when: { airplane: false },
      effects: [{ type: 'setMediaVariant', mediaId: 'album-parc', variantId: 'synchro' }],
    },

    /* Fins */
    {
      id: 'fin-froide',
      when: { messageDelivered: 'a-froid2' },
      effects: [{ type: 'log', text: 'Anna supprime l’album « Famille ».' }, { type: 'solveCase' }],
    },
    {
      id: 'fin-douce',
      when: finDouce,
      effects: [{ type: 'log', text: 'Anna et Léa gardent les photos.' }, { type: 'solveCase' }],
    },
  ],

  weather: { city: 'Saint-Malo', temp: 11, sky: 'nuageux' },
  report: {
    text: [
      'Paul n’est pas revenu : c’est {qui} qui l’ajoutait sur les nouvelles photos.',
      'Elle utilisait {outil}.',
      'Ce qui le prouve : {preuve}.',
    ],
    blanks: {
      qui: {
        answer: 'Léa',
        options: [
          { text: 'Léa', requires: { messageDelivered: 'a-ipad1' } },
          { text: 'Anna' },
          { text: 'quelqu’un qui a accès au compte de Paul', requires: { messageDelivered: 'a-acces' } },
          { text: 'une application de l’album, toute seule' },
        ],
      },
      outil: {
        answer: 'Retouche+, sur l’iPad de Paul',
        options: [
          { text: 'Retouche+, sur l’iPad de Paul', requires: { observationFound: 'info-ipad' } },
          { text: 'le compte de Paul, resté ouvert', requires: { messageDelivered: 'a-acces' } },
          { text: 'le téléphone d’Anna' },
          { text: 'un filtre de l’appareil photo' },
        ],
      },
      preuve: {
        answer: 'Paul n’a ni ombre ni reflet',
        options: [
          { text: 'Paul n’a ni ombre ni reflet', requires: { any: [{ observationFound: 'parc-ombre' }, { observationFound: 'anniv-reflet' }] } },
          { text: 'un homme marche au loin sur la plage', requires: { observationFound: 'plage-silhouette' } },
          { text: 'Paul sourit sur toutes les photos' },
          { text: 'les photos sont floues' },
        ],
      },
    },
  },
  about: { duration: '~10 min', tone: 'Enquête rationnelle' },
  conclusion: {
    title: 'Affaire résolue',
    text: ['Paul était ajouté sur les nouvelles photos de l’album familial.'],
  },
  endings: [
    {
      when: finDouce,
      title: 'Affaire résolue',
      text: [
        'Léa ajoutait son père sur les nouvelles photos de famille, découpé dans un souvenir de Saint-Malo. Anna et Léa ont décidé de les garder.',
      ],
    },
    {
      when: finFroide,
      title: 'Affaire résolue',
      text: ['Les photos avaient été retouchées avec l’iPad de Paul. Anna a supprimé l’album. Elle ne saura peut-être jamais qui l’avait fait.'],
    },
  ],
};
