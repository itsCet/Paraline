/**
 * Enquête 7 — « 87.6 FM » (étrange, énigmes sonores). Brief : docs/enquete-7-87-6-fm.md.
 *
 * Le radio-réveil d'Henri Vasseur s'allume chaque nuit à 3 h sur 87.6, la fréquence de Radio Vallée,
 * station fermée après l'incendie de son émetteur le 14 mars 1987. Théo, 8 ans, fils d'Henri, technicien
 * de nuit, était seul au micro : son père lui avait dit de lire les nombres d'essai jusqu'à ce qu'il revienne
 * fermer l'antenne (« Fin des émissions »). Il lit encore. Il faut qu'Henri dise enfin la phrase.
 *
 * Mécaniques : app Radio (régler la fréquence) · émissions qui n'existent qu'à 3 h (heure manuelle), et le
 * 14/03/1987 · enregistrer une émission · spectre du son (un nom caché dans un sifflement) · deux fins.
 */
import type { CaseDefinition, Condition, Effect } from '../../../game/types';

const DIR = '/media/cases/quatre-vingt-sept';
const IMG = { width: 1086, height: 1448 };
const recu = (id: string): Condition => ({ messageDelivered: id });
const obs = (id: string): Condition => ({ observationFound: id });
const say = (...items: [string, number][]): Effect[] => items.map(([messageId, delayMs]) => ({ type: 'deliverMessage', messageId, delayMs }));
const troisHeures: Condition = { manualHour: 3 };
/** Une fois l'antenne fermée, 87.6 ne diffuse plus que du souffle. */
const antenne: Condition = { not: { flag: 'eteinte' } };

const ARTICLE = `
<div style="font-family:Georgia,'Times New Roman',serif">
<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777">L’Écho de la Vallée · 16 mars 1987</div>
<h2 style="font-size:23px;line-height:1.2;margin:8px 0 14px">Incendie à Radio Vallée : un enfant périt dans le studio</h2>
<img src="${DIR}/emetteur-1987.jpg" alt="Le bâtiment de l’émetteur de Radio Vallée, noirci par le feu, sous son pylône." style="width:100%;height:auto;margin:0 0 12px;filter:grayscale(1) contrast(1.05)"/>
<p>Le petit bâtiment de Radio Vallée (87.6 FM), sur la colline de Saint-Clair, a été ravagé par les flammes. <span data-obs="incendie">Le feu a pris peu avant 3 heures du matin, le samedi 14 mars.</span></p>
<img src="${DIR}/theo-1987.jpg" alt="Photo de Théo Vasseur, 8 ans, souriant devant un micro de studio, un casque autour du cou." style="float:right;width:110px;height:146px;object-fit:cover;margin:0 0 8px 12px;filter:grayscale(.5)"/>
<p><span data-obs="theo">Théo Vasseur, 8 ans, fils du technicien de nuit, se trouvait seul dans le studio.</span> Il n’a pas pu être sauvé. <span data-obs="absent">Le technicien, Henri V., s’était absenté quelques minutes.</span></p>
<p>Les auditeurs de la nuit se souviennent de sa voix : <span data-obs="rituel">chaque nuit à 3 heures, il fermait l’antenne par les mêmes mots : « Ici Radio Vallée. Fin des émissions. Bonne nuit. »</span> Cette nuit-là, personne ne les a prononcés.</p>
<p>La station n’émettra plus.</p>
</div>`;

export const quatreVingtSept: CaseDefinition = {
  id: 'quatre-vingt-sept',
  title: '87.6 FM',
  client: 'noemie',
  locked: true,
  about: { duration: '~20 min', tone: 'Étrange · casque conseillé' },
  characters: [{ id: 'noemie', name: 'Noémie Vasseur', initials: 'NV', color: '#5a6b4a', role: 'Petite-fille d’Henri Vasseur' }],

  media: [
    {
      id: 'enregistrement',
      kind: 'audio',
      name: 'radio_3h00.m4a',
      sizeLabel: 'Enregistré par Noémie',
      durationLabel: '00:29',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/enregistrement.mp3`,
          // Horaires calés sur le mixage généré (29 s).
          cues: [
            { start: 0.8, end: 4.0, text: 'Huit… sept… six.', observationId: 'n-freq' },
            { start: 4.6, end: 12.6, text: 'Zéro… trois… zéro… zéro.', observationId: 'n-heure' },
            { start: 13.2, end: 20.6, text: 'Un… quatre… zéro… trois… huit… sept.', observationId: 'n-date' },
            { start: 21.4, end: 27.4, text: '[un sifflement aigu, régulier]' },
            { start: 27.8, end: 28.6, text: 'Papa ?' },
          ],
          spectrogram: {
            src: `${DIR}/enregistrement-spectre.jpg`,
            width: 1200,
            height: 360,
            alt: 'Spectre de l’enregistrement : les nombres apparaissent comme de petites traînées. Pendant le sifflement, des lettres sont dessinées dans le son, à côté d’un pylône d’antenne : RADIO VALLÉE.',
            hotspots: [{ id: 's-vallee', x: 0.72, y: 0.26, w: 0.24, h: 0.56, observationId: 'vallee' }],
          },
        },
      },
    },
    {
      id: 'radio-reveil',
      kind: 'image',
      name: 'IMG_3001.jpg',
      sizeLabel: '2,0 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/radio-reveil.jpg`,
          ...IMG,
          maxZoom: 6,
          alt: 'Un vieux radio-réveil des années 80 en imitation bois, sur une table de nuit, dans le noir. À gauche, l’écran affiche 3:00 en chiffres rouges. À droite, sur le cadran FM, l’aiguille orange est sur 87.6.',
          info: [
            { label: 'Date', value: 'Cette nuit · 03:00' },
            { label: 'Appareil', value: 'Téléphone de Noémie' },
          ],
          hotspots: [
            { id: 'r-aiguille', x: 0.53, y: 0.47, w: 0.36, h: 0.09, observationId: 'aiguille' },
            { id: 'r-ecran', x: 0.13, y: 0.46, w: 0.38, h: 0.1, observationId: 'ecran' },
          ],
        },
      },
    },
    {
      id: 'emission',
      kind: 'audio',
      name: '87.6 · 03:00',
      sizeLabel: 'Émission enregistrée',
      durationLabel: '00:30',
      album: 'Radio',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/emission.mp3`,
          cues: [
            { start: 0.6, end: 9.4, text: 'Essai, essai. Un, deux, trois. Ici Radio Vallée, quatre-vingt-sept six.' },
            { start: 10.0, end: 15.4, text: 'Papa a dit : tu lis les nombres jusqu’à ce que je dise « fin des émissions ».', observationId: 'attend' },
            { start: 16.4, end: 23.8, text: 'Un… quatre… zéro… trois… huit… sept.' },
            { start: 25.4, end: 27.2, text: 'Papa ? Tu reviens quand ?', observationId: 'papa' },
          ],
          spectrogram: { src: `${DIR}/emission-spectre.jpg`, width: 1200, height: 360, alt: 'Spectre de l’émission : seulement la voix de l’enfant et le souffle.' },
        },
      },
    },
    {
      id: 'nuit',
      kind: 'audio',
      name: '87.6 · 14/03/1987 · 03:00',
      sizeLabel: 'Émission enregistrée',
      durationLabel: '00:22',
      album: 'Radio',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/nuit.mp3`,
          cues: [
            { start: 0.6, end: 4.0, text: 'Papa ? Il y a une drôle d’odeur.' },
            { start: 5.0, end: 7.2, text: 'Il y a de la fumée sous la porte.', observationId: 'fumee' },
            { start: 8.6, end: 11.7, text: 'Tu m’as dit de pas quitter le micro. Alors je reste.', observationId: 'reste' },
            { start: 13.0, end: 16.2, text: 'Huit… sept… six…' },
            { start: 17.0, end: 20.4, text: '[un sifflement]' },
          ],
          spectrogram: {
            src: `${DIR}/nuit-spectre.jpg`,
            width: 1200,
            height: 360,
            alt: 'Spectre de l’émission de 1987. Pendant le sifflement final, un mot est dessiné dans le son : REVIENS.',
          },
        },
      },
    },
    {
      id: 'adieu',
      kind: 'audio',
      name: '87.6 · Fin des émissions',
      sizeLabel: 'Émission enregistrée',
      durationLabel: '00:13',
      album: 'Radio',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/adieu.mp3`,
          cues: [
            { start: 0.8, end: 2.9, text: 'Henri : Ici Radio Vallée. Fin des émissions.' },
            { start: 4.0, end: 5.3, text: 'Henri : Bonne nuit, mon grand.' },
            { start: 7.2, end: 8.5, text: 'Théo : Bonne nuit, papa.', observationId: 'bonne-nuit' },
            { start: 9.0, end: 12.8, text: '[le souffle s’éteint]' },
          ],
        },
      },
    },
    {
      id: 'horizon',
      kind: 'audio',
      name: 'Radio Horizon · 99.3',
      sizeLabel: 'Émission enregistrée',
      durationLabel: '00:16',
      album: 'Radio',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/horizon.mp3`,
          cues: [{ start: 1.0, end: 9.8, text: 'Vous écoutez Radio Horizon. Musique et nouvelles, toute la nuit. Prudence sur les routes : du brouillard est annoncé jusqu’au matin.' }],
        },
      },
    },
    { id: 'article', kind: 'document', name: 'echo_vallee_16-03-1987', sizeLabel: 'Coupure de presse', defaultVariant: 'doc', variants: { doc: { src: '', html: ARTICLE } } },
    {
      id: 'fin',
      kind: 'image',
      name: 'IMG_3044.jpg',
      sizeLabel: '1,6 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/fin.jpg`,
          ...IMG,
          alt: 'Au petit matin, dans une chambre de maison de retraite, les mains ridées d’un vieil homme reposent sur le vieux radio-réveil éteint. Un bouquet de fleurs séchées, la lumière du jour par la fenêtre.',
        },
      },
    },
  ],

  radio: {
    stations: [
      // 87.6 : rien en journée. À 3 h : Théo. Le 14 mars 1987 à 3 h : la dernière nuit. Henri prêt : l'adieu.
      { freq: 87.6, mediaId: 'adieu', name: 'Radio Vallée', when: { all: [troisHeures, { flag: 'henri-pret' }, antenne] } },
      { freq: 87.6, mediaId: 'nuit', name: 'Radio Vallée', when: { all: [troisHeures, { manualDate: '1987-03-14' }, antenne] } },
      { freq: 87.6, mediaId: 'emission', name: 'Radio Vallée', when: { all: [troisHeures, antenne] } },
      { freq: 99.3, mediaId: 'horizon', name: 'Radio Horizon' },
    ],
  },

  initialMail: {
    id: 'fm-mail',
    from: 'noemie',
    subject: 'La radio de mon grand-père s’allume toute seule',
    timeLabel: '03:12',
    preview: 'Toutes les nuits, à 3 h pile, il s’allume. Une voix d’enfant lit des nombres.',
    body: [
      'Bonjour,',
      'Mon grand-père, Henri, est en maison de retraite depuis l’automne. J’ai récupéré son vieux radio-réveil.',
      'Toutes les nuits, à 3 h pile, il s’allume tout seul. Toujours sur la même fréquence. On entend une voix d’enfant qui lit des nombres.',
      'Je l’ai enregistrée cette nuit avec mon téléphone. Je ne dors plus.',
      'Noémie Vasseur',
    ],
    attachments: ['enregistrement', 'radio-reveil'],
  },

  threads: [{ id: 't-noemie', contact: 'noemie' }],

  messages: [
    { id: 'n-1', threadId: 't-noemie', from: 'noemie', text: 'Merci de me répondre. Je commençais à croire que je devenais folle.' },
    { id: 'n-2', threadId: 't-noemie', from: 'noemie', text: 'On m’a dit que vos téléphones Paraline captent la FM. Vous allez peut-être l’entendre aussi.' },
    { id: 'n-heure1', threadId: 't-noemie', from: 'noemie', text: 'Oui. Toujours 3 h pile, toujours 87.6. L’aiguille ne bouge jamais.' },
    { id: 'n-heure2', threadId: 't-noemie', from: 'noemie', text: 'En journée, sur 87.6, il n’y a que du souffle. J’ai essayé cent fois.' },
    { id: 'n-vallee1', threadId: 't-noemie', from: 'noemie', text: 'Radio Vallée… Grand-père y était technicien de nuit, dans les années 80.' },
    { id: 'n-vallee2', threadId: 't-noemie', from: 'noemie', text: 'Il n’en parle jamais. Je vais fouiller ses cartons.' },
    { id: 'n-carton1', threadId: 't-noemie', from: 'noemie', text: 'J’ai trouvé ça, plié dans une boîte à chaussures.' },
    { id: 'n-carton2', threadId: 't-noemie', from: 'noemie', attachments: ['article'], notify: false },
    { id: 'n-carton3', threadId: 't-noemie', from: 'noemie', text: 'Théo Vasseur. J’avais un oncle. Personne ne me l’a jamais dit.' },
    { id: 'n-date1', threadId: 't-noemie', from: 'noemie', text: 'Il lit la date de cette nuit-là. Toutes les nuits.' },
    { id: 'n-date2', threadId: 't-noemie', from: 'noemie', text: 'Je ne sais pas si je veux entendre ce qui s’est passé. Mais vous, vous pourriez.' },
    { id: 'n-nuit1', threadId: 't-noemie', from: 'noemie', text: 'Grand-père était au café d’en face. « Dix minutes », il a toujours dit à la police.' },
    { id: 'n-nuit2', threadId: 't-noemie', from: 'noemie', text: 'Il ne se l’est jamais pardonné. Je comprends pourquoi il ne parlait plus de radio.' },
    { id: 'n-theo1', threadId: 't-noemie', from: 'noemie', text: 'Grand-père ne parle presque plus. Mais je crois que ça, il le dira.' },
    { id: 'n-theo2', threadId: 't-noemie', from: 'noemie', text: 'J’y vais à la première heure. Je lui apporte le radio-réveil.' },
    { id: 'n-lendemain', threadId: 't-noemie', from: 'noemie', text: 'Le lendemain', system: true },
    { id: 'n-henri1', threadId: 't-noemie', from: 'noemie', text: 'Je lui ai tout raconté. Il a pleuré. Il a serré le poste contre lui.' },
    { id: 'n-henri2', threadId: 't-noemie', from: 'noemie', text: 'Il dit qu’il sera prêt. À 3 h, sur 87.6. Comme avant.' },
    { id: 'n-fin1', threadId: 't-noemie', from: 'noemie', text: 'Le radio-réveil s’est éteint. À 3 h 01. Il ne s’est pas rallumé.' },
    { id: 'n-fin2', threadId: 't-noemie', from: 'noemie', text: 'Grand-père s’est endormi juste après. Il souriait.' },
    { id: 'n-fin3', threadId: 't-noemie', from: 'noemie', attachments: ['fin'], notify: false },
  ],

  replies: [
    {
      id: 'r-nombres',
      threadId: 't-noemie',
      label: '8-7-6, puis 0-3-0-0 : 87.6 à 3 h. C’est là que votre radio s’allume ?',
      available: { all: [obs('n-freq'), obs('n-heure')] },
      effects: say(['n-heure1', 3000], ['n-heure2', 3500]),
    },
    {
      id: 'r-vallee',
      threadId: 't-noemie',
      label: 'Dans le sifflement, il y a un nom : « Radio Vallée ». Ça vous dit quelque chose ?',
      available: obs('vallee'),
      effects: say(['n-vallee1', 3500], ['n-vallee2', 3000], ['n-carton1', 15000], ['n-carton2', 1500], ['n-carton3', 4000]),
    },
    {
      id: 'r-date',
      threadId: 't-noemie',
      label: '1-4-0-3-8-7 : le 14 mars 1987. La nuit de l’incendie.',
      available: { all: [obs('n-date'), obs('incendie')] },
      effects: say(['n-date1', 3500], ['n-date2', 4000]),
    },
    {
      id: 'r-nuit',
      threadId: 't-noemie',
      label: 'Cette nuit-là, Théo est resté au micro parce que son père le lui avait demandé.',
      available: obs('reste'),
      effects: [...say(['n-nuit1', 4000], ['n-nuit2', 4000]), { type: 'setFlag', name: 'nuit-dite', value: true }],
    },
    {
      id: 'r-theo',
      threadId: 't-noemie',
      label: 'Théo attend que son père ferme l’antenne. Il faut qu’Henri dise : « Fin des émissions ».',
      available: { all: [obs('attend'), obs('rituel')] },
      effects: say(['n-theo1', 4000], ['n-theo2', 3500], ['n-lendemain', 12000], ['n-henri1', 3000], ['n-henri2', 3500]),
    },
  ],

  observations: [
    { id: 'n-freq', title: '« Huit, sept, six » : 87.6, une fréquence FM.', mediaId: 'enregistrement', autoFile: true, actions: [] },
    { id: 'n-heure', title: '« Zéro, trois, zéro, zéro » : 03:00.', mediaId: 'enregistrement', autoFile: true, actions: [{ type: 'ask', replyId: 'r-nombres', label: 'Demander à Noémie' }] },
    { id: 'n-date', title: '« Un, quatre, zéro, trois, huit, sept » : 14 03 87 ?', mediaId: 'enregistrement', autoFile: true, actions: [] },
    { id: 'vallee', title: 'Dessiné dans le sifflement, à côté d’un pylône : RADIO VALLÉE.', mediaId: 'enregistrement', autoFile: true, actions: [{ type: 'ask', replyId: 'r-vallee', label: 'Demander à Noémie' }] },
    { id: 'aiguille', title: 'L’aiguille du cadran est sur 87.6.', mediaId: 'radio-reveil', autoFile: true, actions: [] },
    { id: 'ecran', title: 'L’écran du radio-réveil affiche 3:00.', mediaId: 'radio-reveil', autoFile: true, actions: [] },
    { id: 'attend', title: 'Théo lit les nombres jusqu’à ce que son père dise « fin des émissions ».', mediaId: 'emission', autoFile: true, actions: [] },
    { id: 'papa', title: '« Papa ? Tu reviens quand ? »', mediaId: 'emission', autoFile: true, actions: [] },
    { id: 'incendie', title: 'Incendie de Radio Vallée : le 14 mars 1987, peu avant 3 heures.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'theo', title: 'Théo Vasseur, 8 ans, fils du technicien, était seul au studio.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'absent', title: 'Le technicien, Henri V., s’était absenté quelques minutes.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'rituel', title: 'Chaque nuit à 3 h, l’antenne fermait sur : « Ici Radio Vallée. Fin des émissions. Bonne nuit. »', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'fumee', title: '« Il y a de la fumée sous la porte. »', mediaId: 'nuit', autoFile: true, actions: [] },
    { id: 'reste', title: 'Son père lui avait dit de ne pas quitter le micro. Il est resté.', mediaId: 'nuit', autoFile: true, actions: [{ type: 'ask', replyId: 'r-nuit', label: 'Le dire à Noémie' }] },
    { id: 'bonne-nuit', title: '« Bonne nuit, papa. »', mediaId: 'adieu', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'voix', objective: 'Qui parle sur 87.6, et qu’attend-il ?' }],

  obstacles: [
    {
      id: 'ecouter',
      solved: { all: [obs('n-freq'), obs('n-heure')] },
      hints: ['Noémie vous a envoyé un enregistrement.', 'Écoutez les nombres jusqu’au bout : ils forment quelque chose.', 'Dans l’enregistrement de Noémie : « 8-7-6 », une fréquence, puis « 0-3-0-0 », une heure.'],
    },
    {
      id: 'trois-heures',
      solved: { mediaViewed: 'emission' },
      hints: [
        'La voix ne parle qu’à une heure précise.',
        'Ouvrez Radio, réglez 87.6. Puis changez l’heure du téléphone.',
        'Réglages › Date et heure : désactivez le réglage automatique, réglez 03:00, puis allumez Radio sur 87.6.',
      ],
    },
    {
      id: 'vallee',
      solved: { any: [obs('vallee'), recu('n-carton2')] },
      hints: [
        'L’enregistrement contient autre chose que des nombres.',
        'Ne vous contentez pas d’écouter le sifflement : regardez-le.',
        'Ouvrez l’enregistrement de Noémie, touchez « Afficher le spectre » : un nom est dessiné dans le sifflement. Touchez-le, puis demandez à Noémie.',
      ],
    },
    {
      id: 'fermer',
      solved: { replySent: 'r-theo' },
      hints: [
        'Que veut Théo ?',
        'Il attend une phrase précise. L’article dit laquelle, et qui devait la prononcer.',
        'Dites à Noémie que Théo attend qu’Henri dise « Fin des émissions ».',
      ],
    },
    {
      id: 'adieu',
      solved: obs('bonne-nuit'),
      hints: ['Henri est prêt.', 'À la même heure, sur la même fréquence.', 'Réglez l’heure sur 03:00 et écoutez 87.6 jusqu’au bout.'],
    },
  ],

  rules: [
    {
      id: 'ouverture',
      when: { caseAccepted: true },
      effects: [
        { type: 'phoneOverride', key: 'extraApp', value: 'radio' },
        { type: 'notify', title: 'Radio', body: 'Application Radio FM ajoutée à l’écran d’accueil', app: 'radio' },
        ...say(['n-1', 3000], ['n-2', 3500]),
      ],
    },
    {
      id: 'henri-pret',
      when: recu('n-henri2'),
      effects: [{ type: 'setFlag', name: 'henri-pret', value: true }, { type: 'notify', title: 'Radio', body: 'Cette nuit, à 3 h, sur 87.6…', app: 'radio' }],
    },
    // Une fois l'adieu entendu, l'antenne ne diffuse plus.
    { id: 'eteinte', when: obs('bonne-nuit'), effects: [{ type: 'setFlag', name: 'eteinte', value: true }, ...say(['n-fin1', 6000], ['n-fin2', 3500], ['n-fin3', 2000])] },
    { id: 'fin', when: recu('n-fin3'), effects: [{ type: 'log', text: 'Henri a fermé l’antenne. Théo a dit bonne nuit.' }, { type: 'solveCase' }] },
  ],

  conclusion: { title: 'Fin des émissions', text: ['Le 14 mars 1987, Théo Vasseur est resté au micro de Radio Vallée en attendant son père.'] },
  endings: [
    {
      when: { flag: 'nuit-dite' },
      title: 'Fin des émissions',
      text: [
        'Le 14 mars 1987, Théo Vasseur, 8 ans, est resté seul au micro de Radio Vallée pendant que son père était au café d’en face. Il lisait les nombres d’essai, comme on le lui avait demandé, quand le feu a pris.',
        'Trente-neuf ans plus tard, Henri a enfin fermé l’antenne. Noémie sait maintenant ce que son grand-père n’a jamais pu dire. Le radio-réveil ne s’est plus jamais allumé.',
      ],
    },
    {
      when: { flag: 'eteinte' },
      title: 'Fin des émissions',
      text: [
        'Le 14 mars 1987, Théo Vasseur, 8 ans, est resté seul au micro de Radio Vallée. Il attendait que son père revienne fermer l’antenne.',
        'Trente-neuf ans plus tard, Henri a dit la phrase. Le radio-réveil ne s’est plus jamais allumé.',
      ],
    },
  ],
};
