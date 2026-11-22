/**
 * Enquête 4 — « Le cinquième » (surnaturelle, longue : 15–20 min, quatre actes).
 *
 * Vérité interne : dans la nuit du 14 au 15 février 2014, Sarah, Julien, Inès,
 * Malik et Théo Marchand (20 ans, bonnet rouge) louent le chalet des Pins au bord
 * du lac de Vaulx. Sur un pari de Julien, Théo traverse le lac gelé ; la glace
 * cède. Les quatre s'enfuient avant l'aube et se taisent. Officiellement, Théo
 * s'est noyé seul. Il veut que la vérité soit dite à sa sœur, Léna. Sarah a
 * refoulé ce souvenir.
 *
 * Acte 1 : groupe « Chalet », quatre versions, métadonnées des photos.
 * Acte 2 : livre d'or (empreinte), fils privés, confrontation par preuves ;
 *          Malik avoue, Inès nomme Théo, Julien nie et bloque.
 * Acte 3 : Théo se retourne sur toutes les photos ; app Téléphone (message de
 *          02:14) ; GPS au milieu du lac ; 15/02/2014 02:14 → dernière photo.
 * Acte 4 : qui dit la vérité à Léna ? Trois fins.
 */
import type { CaseDefinition, Condition, Effect, ObstacleDef } from '../../../game/types';

const DIR = '/media/cases/le-cinquieme';
const IMG = { width: 1086, height: 1448 };
const recu = (id: string): Condition => ({ messageDelivered: id });
const PHOTOS = ['groupe', 'cartes', 'ponton'] as const;
const FINS = ['f-ensemble', 'f-moi', 'f-personne'];
const finChoisie: Condition = { any: FINS.map((id) => ({ replySent: id })) };

/** Enchaîne des messages dans un fil (le moteur cumule les délais d'un même fil). */
const say = (...items: [string, number][]): Effect[] => items.map(([messageId, delayMs]) => ({ type: 'deliverMessage', messageId, delayMs }));

const LIEU_CHALET = { label: 'Lieu', value: 'Chalet des Pins, lac de Vaulx' };
const LIEU_LAC = { label: 'Lieu', value: '45,6184° N · 5,8921° E — lac de Vaulx, à 400 m de la rive', observationId: 'gps-lac' };
const APPAREIL = { label: 'Appareil', value: 'iPhone 5 — Julien' };

const ANNONCE = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<img src="${DIR}/chalet.jpg" alt="Le chalet des Pins sous la neige, au bord du lac." style="width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px;display:block;margin-bottom:14px"/>
<h2 style="margin:0 0 4px;font-size:22px">Chalet des Pins — au bord du lac de Vaulx</h2>
<p style="margin:0 0 14px;color:#8a8478;font-size:14px">★ 4,8 · 6 voyageurs · 3 chambres · ponton privé</p>
<p>Un chalet en bois face au lac, cheminée, balcon. L’été, baignade depuis le ponton.</p>
<p>En hiver, le lac gèle souvent. <span data-obs="annonce-glace">La traversée à pied est strictement interdite</span> : la glace reste fine au milieu, même par grand froid.</p>
<p>Chaque séjour se termine par un mot dans <span data-obs="annonce-livre">notre livre d’or, tenu depuis 2009</span>.</p>
<p style="color:#8a8478;font-size:14px">Hôte : Mme Roux · Superhôte</p>
</div>`;

const ARTICLE = `
<div style="font-family:Georgia,'Times New Roman',serif">
<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777">L’Écho des Lacs · 16 février 2014</div>
<h2 style="font-size:24px;line-height:1.2;margin:8px 0 14px">Lac de Vaulx : un jeune homme de 20 ans retrouvé sans vie</h2>
<p>Le corps de Théo Marchand, 20 ans, a été retrouvé samedi matin dans le lac de Vaulx, à quelques centaines de mètres de la rive.</p>
<p>Selon les premiers éléments de l’enquête, le jeune homme serait sorti seul <span data-obs="article-nuit">dans la nuit du 14 au 15 février</span> et se serait aventuré sur la glace, qui a cédé.</p>
<p><span data-obs="article-telephone">Son téléphone portable n’a pas été retrouvé.</span> Aucun témoin ne s’est manifesté.</p>
<p>« Il ne serait jamais allé sur la glace tout seul », confie sa sœur aînée, Léna.</p>
</div>`;

const photo = (
  id: (typeof PHOTOS)[number],
  name: string,
  date: string,
  dateObs: string | undefined,
  dos: { alt: string; hotspot: [number, number, number, number]; obs: string },
  face: { alt: string },
) => ({
  id,
  kind: 'image' as const,
  name,
  sizeLabel: '1,9 Mo',
  defaultVariant: 'dos',
  allowSaveCopy: true,
  variants: {
    dos: {
      src: `${DIR}/${id}.jpg`,
      ...IMG,
      maxZoom: 8,
      alt: dos.alt,
      info: [{ label: 'Date', value: date, observationId: dateObs }, APPAREIL, LIEU_CHALET],
      hotspots: [{ id: `${id}-theo`, x: dos.hotspot[0], y: dos.hotspot[1], w: dos.hotspot[2], h: dos.hotspot[3], observationId: dos.obs }],
    },
    face: {
      src: `${DIR}/${id}-face.jpg`,
      ...IMG,
      maxZoom: 8,
      alt: face.alt,
      info: [{ label: 'Date', value: date, observationId: dateObs }, APPAREIL, LIEU_LAC],
      hotspots: [{ id: `${id}-theo-face`, x: dos.hotspot[0], y: dos.hotspot[1], w: dos.hotspot[2], h: dos.hotspot[3], observationId: 'il-regarde' }],
    },
  },
});

/** Aide en trois niveaux : chaque obstacle est résolu dès qu'un obstacle suivant l'est (progression cumulative). */
function chain(list: [string, Condition, [string, string, string]][]): ObstacleDef[] {
  return list.map(([id], i) => ({ id, solved: { any: list.slice(i).map(([, c]) => c) }, hints: list[i][2] }));
}

export const leCinquieme: CaseDefinition = {
  id: 'le-cinquieme',
  title: 'Le cinquième',
  client: 'sarah',
  characters: [
    { id: 'sarah', name: 'Sarah Morel', initials: 'S', color: '#b0715a', role: 'Cliente' },
    { id: 'julien', name: 'Julien', initials: 'J', color: '#4f6b8a', role: 'Ami de Sarah' },
    { id: 'ines', name: 'Inès', initials: 'I', color: '#8a3b4a', role: 'Amie de Sarah' },
    { id: 'malik', name: 'Malik', initials: 'M', color: '#6b7a5a', role: 'Ami de Sarah' },
    { id: 'groupe', name: 'Chalet 🌲', initials: '🌲', color: '#2f4a3a', role: 'Sarah, Julien, Inès, Malik, vous' },
    { id: 'lena', name: 'Léna Marchand', initials: 'L', color: '#6a5a8a' },
  ],

  media: [
    photo(
      'groupe',
      'IMG_2041.jpg',
      '14 févr. 2014 · 21:40',
      undefined,
      {
        alt: 'Selfie de quatre amis sur le canapé, devant la cheminée du chalet. Au fond, devant la baie vitrée noire, un jeune homme de dos, bonnet rouge, parka kaki.',
        hotspot: [0.75, 0.21, 0.19, 0.29],
        obs: 'silhouette-groupe',
      },
      { alt: 'Le même selfie devant la cheminée. Au fond, devant la baie vitrée, le jeune homme au bonnet rouge s’est retourné : les mains dans les poches, il regarde l’objectif.' },
    ),
    photo(
      'cartes',
      'IMG_2043.jpg',
      '14 févr. 2014 · 23:12',
      'heure-cartes',
      {
        alt: 'Partie de cartes autour de la table du chalet, bières et bougies. Derrière eux, dans l’embrasure d’une porte ouverte sur le noir, une silhouette au bonnet rouge, de dos.',
        hotspot: [0.68, 0.19, 0.17, 0.34],
        obs: 'silhouette-cartes',
      },
      { alt: 'La partie de cartes. Dans l’embrasure de la porte, le jeune homme au bonnet rouge fait face à la pièce. Il regarde l’objectif.' },
    ),
    photo(
      'ponton',
      'IMG_2037.jpg',
      '14 févr. 2014 · 16:05',
      undefined,
      {
        alt: 'Les quatre amis serrés sur le ponton enneigé, le lac gelé derrière eux. Très loin sur la glace, une petite silhouette au bonnet rouge, de dos.',
        hotspot: [0.75, 0.23, 0.09, 0.1],
        obs: 'silhouette-ponton',
      },
      { alt: 'Les quatre amis sur le ponton. Loin sur la glace, la silhouette au bonnet rouge s’est retournée vers eux.' },
    ),
    {
      id: 'annonce',
      kind: 'document',
      name: 'annonce_chalet_des_pins',
      sizeLabel: 'Page web',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: ANNONCE } },
    },
    {
      id: 'livre-dor',
      kind: 'image',
      name: 'livre_dor.jpg',
      sizeLabel: '2,2 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/livre-dor.jpg`,
          ...IMG,
          maxZoom: 10,
          alt: 'Le livre d’or ouvert sur une table, en lumière rasante. Au milieu, le talon déchiré d’une page arrachée. À droite, une page lignée vierge ; en creux, l’empreinte d’une écriture : « Merci pour tout — S., J., I., M. et Théo — nuit du 14 au 15 février 2014 ».',
          overlay: {
            box: { x: 0.4, y: 0.3, w: 0.5, h: 0.14 },
            viewHeight: 37,
            mode: 'stable',
            tone: 'imprint',
            rotate: -1,
            lines: [
              { text: 'Merci pour tout !', y: 9, size: 6.5, width: 46 },
              { text: 'S., J., I., M. et Théo', y: 21, size: 6.5, width: 62 },
              { text: 'nuit du 14 au 15 février 2014', y: 32, size: 5, width: 66 },
            ],
          },
          hotspots: [
            { id: 'l-empreinte', x: 0.39, y: 0.28, w: 0.53, h: 0.18, observationId: 'empreinte' },
            { id: 'l-talon', x: 0.32, y: 0.22, w: 0.07, h: 0.62, observationId: 'page-arrachee' },
          ],
        },
      },
    },
    {
      id: 'article',
      kind: 'document',
      name: 'echo_des_lacs_16-02-2014',
      sizeLabel: 'Article',
      defaultVariant: 'doc',
      variants: { doc: { src: '', html: ARTICLE } },
    },
    {
      // Messagerie de l'app Téléphone (acte 3).
      id: 'messagerie',
      kind: 'audio',
      name: 'Numéro masqué',
      sizeLabel: 'Reçu à 02:14',
      durationLabel: '00:09',
      album: 'Messagerie',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/messagerie-0214.mp3`,
          // Horaires calés sur l'enregistrement réel (9 s).
          cues: [
            { start: 0, end: 2.9, text: 'Vous avez un nouveau message. Reçu à deux heures quatorze.', observationId: 'appel-0214' },
            { start: 3.4, end: 4.3, text: 'Je vous vois…' },
            { start: 5.5, end: 7.1, text: 'Vous partez ?' },
            { start: 7.2, end: 8.9, text: 'Vous êtes partis.', observationId: 'vous-partez' },
          ],
        },
      },
    },
    {
      id: 'derniere-photo',
      kind: 'image',
      name: 'IMG_0214.jpg',
      sizeLabel: '1,4 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/derniere-photo.jpg`,
          ...IMG,
          maxZoom: 8,
          alt: 'Photo de nuit prise depuis la glace, vers la rive. Quatre silhouettes de dos, lampes à la main, s’éloignent vers le chalet éclairé.',
          info: [
            { label: 'Date', value: '15 févr. 2014 · 02:14' },
            { label: 'Appareil', value: 'iPhone 5c — Théo' },
            { label: 'Lieu', value: '45,6184° N · 5,8921° E — lac de Vaulx, à 400 m de la rive' },
          ],
          hotspots: [{ id: 'd-lampes', x: 0.17, y: 0.43, w: 0.65, h: 0.23, observationId: 'ils-partent' }],
        },
      },
    },
    {
      id: 'lena-vocal',
      kind: 'audio',
      name: 'Léna — message vocal',
      sizeLabel: '272 Ko',
      durationLabel: '00:17',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/lena.mp3`,
          // Horaires calés sur l'enregistrement réel (17 s).
          cues: [
            { start: 0, end: 4, text: 'C’est Léna. Je viens de lire votre message.' },
            { start: 5.5, end: 9.1, text: 'Pendant douze ans, j’ai cru qu’il était sorti seul, cette nuit-là.' },
            { start: 10.6, end: 12.4, text: 'Je ne sais pas encore si je vous en veux.' },
            { start: 14.1, end: 17.2, text: 'Mais merci de me l’avoir dit. Il aurait voulu ça.' },
          ],
        },
      },
    },
    {
      id: 'reflet',
      kind: 'image',
      name: 'IMG_8812.jpg',
      sizeLabel: '2,4 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/reflet.jpg`,
          ...IMG,
          maxZoom: 8,
          alt: 'Les quatre amis, douze ans plus tard, à la terrasse d’un café parisien. Dans le reflet de la vitrine, derrière eux, un jeune homme au bonnet rouge sourit.',
          hotspots: [{ id: 'r-reflet', x: 0.72, y: 0.41, w: 0.2, h: 0.3, observationId: 'reflet-theo' }],
        },
      },
    },
  ],

  locked: true,
  initialMail: {
    id: 'lc-mail',
    from: 'sarah',
    subject: 'Il y a quelqu’un sur nos photos',
    timeLabel: '08:52',
    preview: 'En février 2014, avec mes trois meilleurs amis, on a passé un week-end dans un chalet au bord du lac de Vaulx.',
    body: [
      'Bonjour,',
      'En février 2014, avec mes trois meilleurs amis, Julien, Inès et Malik, on a passé un week-end dans un chalet au bord du lac de Vaulx. On y retourne le mois prochain, douze ans après.',
      'Pour l’occasion, on a ressorti les photos. Sur chacune, il y a un garçon au bonnet rouge. Aucun de nous ne le connaît.',
      'Et ce n’est pas tout : d’une photo à l’autre, il se rapproche.',
      'Je vous joins la première. Je vous ajoute à notre conversation de groupe, ils ont les autres.',
      'Sarah Morel',
    ],
    attachments: ['groupe'],
  },

  followUpMails: [
    {
      id: 'lena-mail',
      from: 'lena',
      subject: 'Théo',
      timeLabel: 'Maintenant',
      body: [
        'Bonjour,',
        'J’ai lu votre message trois fois.',
        'Pendant douze ans, j’ai cru que mon frère était sorti seul, cette nuit-là. Merci de m’avoir dit la vérité.',
        'Mais pourquoi ce n’est pas eux ?',
        'Léna Marchand',
      ],
    },
  ],

  threads: [
    { id: 't-groupe', contact: 'groupe', members: ['sarah', 'julien', 'ines', 'malik'] },
    { id: 't-sarah', contact: 'sarah' },
    { id: 't-malik', contact: 'malik' },
    { id: 't-ines', contact: 'ines' },
    {
      id: 't-julien',
      contact: 'julien',
      presence: {
        online: { any: [{ not: { flag: 'bloque' } }, recu('julien-debloque1')] },
        offlineLabel: 'Julien vous a bloqué.',
      },
    },
  ],

  messages: [
    /* Acte 1 — le groupe */
    { id: 'sarah-p1', threadId: 't-sarah', from: 'sarah', text: 'Merci d’avoir accepté. Ici, c’est juste entre nous.' },
    { id: 'sarah-g1', threadId: 't-groupe', from: 'sarah', text: 'Je vous présente l’enquêteur dont je vous ai parlé.' },
    { id: 'julien-g1', threadId: 't-groupe', from: 'julien', text: 'Un enquêteur paranormal. Sérieusement, Sarah.' },
    { id: 'ines-g1', threadId: 't-groupe', from: 'ines', text: 'Bonjour. On ne connaît pas ce garçon, vraiment.' },
    { id: 'malik-g1', threadId: 't-groupe', from: 'malik', text: 'Les deux autres photos du week-end.' },
    { id: 'malik-g2', threadId: 't-groupe', from: 'malik', attachments: ['ponton', 'cartes'], notify: false },

    { id: 'julien-qui', threadId: 't-groupe', from: 'julien', text: 'Non. Un type du coin qui traînait autour du chalet, c’est tout.' },
    { id: 'ines-qui', threadId: 't-groupe', from: 'ines', text: 'Jamais vu.' },
    { id: 'sarah-qui', threadId: 't-groupe', from: 'sarah', text: 'Moi non plus. C’est bien ça qui me fait peur.' },

    { id: 'sarah-chalet1', threadId: 't-groupe', from: 'sarah', text: 'Le chalet des Pins. On l’avait loué sur un site, l’annonce est toujours en ligne.' },
    { id: 'sarah-chalet2', threadId: 't-groupe', from: 'sarah', attachments: ['annonce'], notify: false },
    { id: 'julien-chalet', threadId: 't-groupe', from: 'julien', text: 'On y retourne le mois prochain. Si Sarah ne décide pas qu’il est hanté d’ici là.' },

    { id: 'sarah-soiree', threadId: 't-groupe', from: 'sarah', text: 'Non. Vers 22 h, tout le monde dormait. Je m’en souviens très bien.' },
    { id: 'julien-soiree', threadId: 't-groupe', from: 'julien', text: '22 h, oui. On était morts après la balade sur le lac.' },
    { id: 'ines-soiree', threadId: 't-groupe', from: 'ines', text: 'On n’a pas joué aux cartes tard, ce soir-là ?' },
    { id: 'julien-soiree2', threadId: 't-groupe', from: 'julien', text: 'Non, Inès.' },

    { id: 'julien-ponton', threadId: 't-groupe', from: 'julien', text: 'C’est une tache floue. Arrêtez de vous monter la tête.' },
    { id: 'malik-ponton', threadId: 't-groupe', from: 'malik', text: 'Je ne peux pas faire ça.' },
    { id: 'sys-malik', threadId: 't-groupe', from: 'malik', text: 'Malik a quitté la conversation.', system: true },

    /* Acte 2 — fils privés */
    { id: 'malik-p1', threadId: 't-malik', from: 'malik', text: 'Pardon. Je ne pouvais pas rester dans ce groupe.' },
    { id: 'malik-p2', threadId: 't-malik', from: 'malik', text: 'Il y a des choses qu’on ne dit pas devant Julien. Posez-moi les bonnes questions.' },
    { id: 'malik-cartes', threadId: 't-malik', from: 'malik', text: 'Non. Personne ne dormait. On s’est promis de dire qu’on était couchés.' },
    { id: 'malik-cinq1', threadId: 't-malik', from: 'malik', text: '…Oui. On était cinq.' },
    { id: 'malik-cinq2', threadId: 't-malik', from: 'malik', text: 'Il était venu avec nous. On a juré de ne jamais en parler.' },
    { id: 'malik-cinq3', threadId: 't-malik', from: 'malik', text: 'Je ne peux pas en dire plus. Inès va vous écrire.' },

    { id: 'sarah-livre1', threadId: 't-sarah', from: 'sarah', text: 'Je l’appelle.' },
    { id: 'sarah-livre2', threadId: 't-sarah', from: 'sarah', text: 'La page de février 2014 a été arrachée. Elle a photographié celle d’après, quand même.' },
    { id: 'sarah-livre3', threadId: 't-sarah', from: 'sarah', attachments: ['livre-dor'], notify: false },
    { id: 'sarah-theo1', threadId: 't-sarah', from: 'sarah', text: 'Je ne sais pas.' },
    { id: 'sarah-theo2', threadId: 't-sarah', from: 'sarah', text: 'Je vous jure que je ne sais pas. Mais ce prénom me serre le ventre.' },

    { id: 'ines-p1', threadId: 't-ines', from: 'ines', text: 'Malik m’a prévenue. Vous voulez savoir qui il était.' },
    { id: 'ines-qui1', threadId: 't-ines', from: 'ines', text: 'Théo Marchand. Vingt ans. Le petit frère de Léna, mon amie d’enfance.' },
    { id: 'ines-qui2', threadId: 't-ines', from: 'ines', text: 'Il est mort cette nuit-là. On l’a retrouvé dans le lac le lendemain.' },
    { id: 'ines-qui3', threadId: 't-ines', from: 'ines', attachments: ['article'], notify: false },
    { id: 'ines-qui4', threadId: 't-ines', from: 'ines', text: 'Personne n’a jamais su qu’il était avec nous. Même pas Léna.' },
    { id: 'ines-glace1', threadId: 't-ines', from: 'ines', text: 'Ce n’est pas à moi de le dire.' },
    { id: 'ines-glace2', threadId: 't-ines', from: 'ines', text: 'Demandez à Julien.' },

    { id: 'julien-bloque1', threadId: 't-julien', from: 'julien', text: 'Vous êtes payé pour fouiller la vie des gens ?' },
    { id: 'julien-bloque2', threadId: 't-julien', from: 'julien', text: 'Théo s’est noyé seul. C’est écrit dans le journal. Laissez-nous tranquilles.' },

    /* Acte 3 — il se tourne */
    { id: 'sarah-tourne1', threadId: 't-groupe', from: 'sarah', text: 'Vous avez rouvert les photos ?' },
    { id: 'sarah-tourne2', threadId: 't-groupe', from: 'sarah', text: 'Il s’est retourné. Sur toutes.' },
    { id: 'ines-tourne', threadId: 't-groupe', from: 'ines', text: 'Il nous regarde.' },
    { id: 'julien-debloque1', threadId: 't-julien', from: 'julien', text: 'Je vous ai débloqué.' },
    { id: 'julien-debloque2', threadId: 't-julien', from: 'julien', text: 'Vous avez vu les photos ? C’est moi qu’il regarde.' },
    { id: 'julien-pari1', threadId: 't-julien', from: 'julien', text: 'C’était un pari. Traverser le lac jusqu’à l’île, de nuit. Il voulait nous prouver qu’il n’était plus un gamin.' },
    { id: 'julien-pari2', threadId: 't-julien', from: 'julien', text: 'C’est moi qui ai parié. J’ai rigolé quand il est parti.' },
    { id: 'julien-pari3', threadId: 't-julien', from: 'julien', text: 'On a entendu la glace. On a eu peur. On est partis avant le jour.' },
    { id: 'julien-pari4', threadId: 't-julien', from: 'julien', text: 'Pendant douze ans, je me suis répété qu’il avait rejoint l’autre rive.' },

    { id: 'sarah-souvenir1', threadId: 't-groupe', from: 'sarah', text: 'Je m’en souviens.' },
    { id: 'sarah-souvenir2', threadId: 't-groupe', from: 'sarah', text: 'Je ne voulais pas m’en souvenir.' },
    { id: 'sarah-souvenir3', threadId: 't-groupe', from: 'sarah', text: 'Il nous appelait. On avait nos lampes. On a fait demi-tour.' },
    { id: 'ines-souvenir', threadId: 't-groupe', from: 'ines', text: 'Ça fait douze ans qu’on se tait.' },
    { id: 'julien-groupe', threadId: 't-groupe', from: 'julien', text: 'C’était mon pari. Je le dirai aussi.' },

    /* Acte 4 — dire la vérité */
    { id: 'ines-lena1', threadId: 't-groupe', from: 'ines', text: 'J’ai retrouvé Léna. Elle vit toujours à Vaulx.' },
    { id: 'ines-lena2', threadId: 't-groupe', from: 'ines', text: 'Elle doit savoir. Mais qui le lui dit ?' },
    { id: 'ines-julien', threadId: 't-groupe', from: 'ines', text: 'Julien ne dit rien… Il vous a parlé, à vous ?' },

    { id: 'sarah-ens', threadId: 't-groupe', from: 'sarah', text: 'D’accord. Ensemble.' },
    { id: 'julien-ens', threadId: 't-groupe', from: 'julien', text: 'Ensemble.' },
    { id: 'ines-ens', threadId: 't-groupe', from: 'ines', text: 'On lui écrit ce soir. Malik aussi.' },
    { id: 'ines-vocal1', threadId: 't-groupe', from: 'ines', text: 'Léna a répondu. Elle a préféré parler.' },
    { id: 'ines-vocal2', threadId: 't-groupe', from: 'ines', attachments: ['lena-vocal'], notify: false },
    { id: 'sarah-reflet1', threadId: 't-groupe', from: 'sarah', text: 'On s’est retrouvés tous les quatre ce matin, en terrasse. Regardez la vitrine.' },
    { id: 'sarah-reflet2', threadId: 't-groupe', from: 'sarah', attachments: ['reflet'], notify: false },

    { id: 'sarah-moi', threadId: 't-groupe', from: 'sarah', text: 'Merci. Je crois qu’on n’en aurait jamais eu le courage.' },
    { id: 'julien-personne', threadId: 't-groupe', from: 'julien', text: 'Merci.' },
    { id: 'sarah-personne', threadId: 't-groupe', from: 'sarah', text: 'Il est toujours sur les photos.' },
  ],

  replies: [
    /* Groupe */
    {
      id: 'g-qui',
      threadId: 't-groupe',
      label: 'Vous ne le reconnaissez vraiment pas ?',
      available: recu('malik-g2'),
      effects: say(['julien-qui', 2200], ['ines-qui', 1800], ['sarah-qui', 2000]),
    },
    {
      id: 'g-chalet',
      threadId: 't-groupe',
      label: 'Parlez-moi du chalet.',
      available: recu('malik-g2'),
      effects: say(['sarah-chalet1', 2200], ['sarah-chalet2', 1200], ['julien-chalet', 2400]),
    },
    {
      id: 'g-soiree',
      threadId: 't-groupe',
      label: 'La partie de cartes a été photographiée à 23:12. Vous jouiez encore ?',
      available: { all: [recu('malik-g2'), { observationFound: 'heure-cartes' }] },
      effects: say(['sarah-soiree', 2200], ['julien-soiree', 1800], ['ines-soiree', 2600], ['julien-soiree2', 1200]),
    },
    {
      id: 'g-ponton',
      threadId: 't-groupe',
      label: 'Sur la photo du ponton, quelqu’un marche sur la glace. Le même bonnet rouge.',
      available: { all: [recu('malik-g2'), { observationFound: 'silhouette-ponton' }] },
      effects: say(['julien-ponton', 2400], ['malik-ponton', 3000], ['sys-malik', 1500]),
    },
    {
      id: 'g-derniere',
      threadId: 't-groupe',
      label: 'J’ai retrouvé la dernière photo du téléphone de Théo. 02:14, prise depuis la glace. On y voit vos quatre lampes.',
      available: { observationFound: 'ils-partent' },
      effects: say(['sarah-souvenir1', 3500], ['sarah-souvenir2', 2500], ['sarah-souvenir3', 3000], ['ines-souvenir', 3000]),
    },
    {
      id: 'f-ensemble',
      threadId: 't-groupe',
      label: 'Vous quatre, ensemble. Chacun avec ses mots.',
      available: { all: [recu('ines-lena2'), recu('julien-groupe'), { not: finChoisie }] },
      effects: [
        ...say(['sarah-ens', 2000], ['julien-ens', 1600], ['ines-ens', 2000], ['ines-vocal1', 14000], ['ines-vocal2', 1200]),
        ...say(['sarah-reflet1', 9000], ['sarah-reflet2', 1500]),
      ],
    },
    {
      id: 'f-moi',
      threadId: 't-groupe',
      label: 'Je vais lui écrire moi-même.',
      available: { all: [recu('ines-lena2'), { not: finChoisie }] },
      effects: [...say(['sarah-moi', 2500]), { type: 'deliverMail', mailId: 'lena-mail', delayMs: 14000 }],
    },
    {
      id: 'f-personne',
      threadId: 't-groupe',
      label: 'Ça ne ramènera pas Théo. Laissez ça derrière vous.',
      available: { all: [recu('ines-lena2'), { not: finChoisie }] },
      effects: say(['julien-personne', 2000], ['sarah-personne', 3500]),
    },

    /* Sarah */
    {
      id: 's-livre',
      threadId: 't-sarah',
      label: 'La propriétaire pourrait-elle photographier la page de février 2014 du livre d’or ?',
      available: { observationFound: 'annonce-livre' },
      effects: say(['sarah-livre1', 1600], ['sarah-livre2', 6000], ['sarah-livre3', 1200]),
    },
    {
      id: 's-theo',
      threadId: 't-sarah',
      label: 'Sur la page suivante, l’écriture s’est imprimée : « S., J., I., M. et Théo ». Qui est Théo ?',
      available: { observationFound: 'empreinte' },
      effects: say(['sarah-theo1', 2500], ['sarah-theo2', 3000]),
    },

    /* Malik : confrontation par preuves */
    {
      id: 'm-cartes',
      threadId: 't-malik',
      label: 'À 23:12, vous ne dormiez pas.',
      available: { all: [recu('malik-p2'), { observationFound: 'heure-cartes' }] },
      effects: say(['malik-cartes', 3000]),
    },
    {
      id: 'm-cinq',
      threadId: 't-malik',
      label: 'Le livre d’or est signé par cinq personnes. Vous étiez cinq.',
      available: { all: [recu('malik-p2'), { observationFound: 'empreinte' }] },
      effects: say(['malik-cinq1', 4000], ['malik-cinq2', 3000], ['malik-cinq3', 2500]),
    },

    /* Inès */
    {
      id: 'i-qui',
      threadId: 't-ines',
      label: 'Qui était Théo ?',
      available: recu('ines-p1'),
      effects: say(['ines-qui1', 2500], ['ines-qui2', 3000], ['ines-qui3', 1500], ['ines-qui4', 2500]),
    },
    {
      id: 'i-glace',
      threadId: 't-ines',
      label: 'Que faisait-il sur la glace, en pleine nuit ?',
      available: recu('ines-qui4'),
      effects: say(['ines-glace1', 3000], ['ines-glace2', 2000]),
    },

    /* Julien */
    {
      id: 'j-glace',
      threadId: 't-julien',
      label: 'Inès m’a parlé de Théo. Que s’est-il passé sur la glace ?',
      available: recu('ines-glace2'),
      effects: say(['julien-bloque1', 2500], ['julien-bloque2', 2500]),
    },
    {
      id: 'j-pari',
      threadId: 't-julien',
      label: 'Que s’est-il passé cette nuit-là ?',
      available: recu('julien-debloque2'),
      effects: say(['julien-pari1', 3500], ['julien-pari2', 3000], ['julien-pari3', 3000], ['julien-pari4', 3000]),
    },
  ],

  observations: [
    { id: 'silhouette-groupe', title: 'Au fond de la pièce, près de la fenêtre : un jeune homme de dos, bonnet rouge, doudoune bleu marine.', mediaId: 'groupe', autoFile: true, actions: [] },
    { id: 'silhouette-cartes', title: 'Dans l’embrasure de la porte, le même bonnet rouge. Plus près.', mediaId: 'cartes', autoFile: true, actions: [] },
    {
      id: 'silhouette-ponton',
      title: 'Loin sur le lac gelé, une silhouette au bonnet rouge marche sur la glace.',
      mediaId: 'ponton',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'g-ponton', label: 'En parler au groupe' }],
    },
    {
      id: 'heure-cartes',
      title: 'La partie de cartes a été photographiée le 14 février 2014 à 23:12.',
      mediaId: 'cartes',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'g-soiree', label: 'En parler au groupe' }],
    },
    { id: 'annonce-glace', title: 'Le lac gèle l’hiver, mais la glace reste fine au milieu. La traversée est interdite.', mediaId: 'annonce', autoFile: true, actions: [] },
    {
      id: 'annonce-livre',
      title: 'Le chalet tient un livre d’or depuis 2009.',
      mediaId: 'annonce',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 's-livre', label: 'Demander à Sarah' }],
    },
    { id: 'page-arrachee', title: 'La page de février 2014 a été arrachée au ras de la reliure.', mediaId: 'livre-dor', actions: [{ type: 'addToFile' }] },
    {
      id: 'empreinte',
      title: 'En lumière rasante, l’écriture de la page arrachée s’est imprimée : « Merci pour tout ! S., J., I., M. et Théo — nuit du 14 au 15 février 2014 ».',
      mediaId: 'livre-dor',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 's-theo', label: 'Demander à Sarah' }],
    },
    { id: 'article-nuit', title: 'Théo Marchand s’est noyé dans le lac dans la nuit du 14 au 15 février 2014. Officiellement, il était seul.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'article-telephone', title: 'Le téléphone de Théo n’a jamais été retrouvé.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'il-regarde', title: 'Il s’est retourné. Il regarde l’objectif.', autoFile: true, actions: [] },
    { id: 'gps-lac', title: 'La position GPS des photos a changé : le milieu du lac de Vaulx.', autoFile: true, actions: [] },
    { id: 'appel-0214', title: 'Message vocal d’un numéro masqué, « reçu à deux heures quatorze ».', mediaId: 'messagerie', autoFile: true, actions: [] },
    { id: 'vous-partez', title: '« Je vous vois… Vous partez ? … Vous êtes partis. »', mediaId: 'messagerie', autoFile: true, actions: [] },
    {
      id: 'ils-partent',
      title: 'Prise depuis la glace le 15 février 2014 à 02:14 : quatre lampes s’éloignent vers le chalet.',
      mediaId: 'derniere-photo',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'g-derniere', label: 'Le montrer au groupe' }],
    },
    { id: 'reflet-theo', title: 'Dans le reflet de la vitrine, ils sont cinq. Théo sourit.', mediaId: 'reflet', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'verite', objective: 'Qui est le garçon au bonnet rouge, et que veut-il ?' }],

  obstacles: chain([
    [
      'ponton',
      recu('sys-malik'),
      [
        'Les quatre amis n’ont pas tous la même version. Les photos non plus.',
        'Regardez loin derrière le ponton, sur la glace, puis parlez-en au groupe.',
        'Groupe Chalet : ouvrez IMG_2037.jpg, touchez la silhouette sur la glace, puis « En parler au groupe ».',
      ],
    ],
    [
      'livre',
      { observationFound: 'empreinte' },
      [
        'Le chalet garde ses propres souvenirs.',
        'L’annonce du chalet parle d’un livre d’or. Une page vierge peut garder la trace de la précédente.',
        'Groupe : « Parlez-moi du chalet », touchez « livre d’or » dans l’annonce, demandez la photo à Sarah, puis zoomez sur la page de droite.',
      ],
    ],
    [
      'malik',
      recu('ines-p1'),
      [
        'Malik a quitté le groupe pour vous parler seul.',
        'Opposez-lui une preuve qu’ils étaient plus de quatre.',
        'Conversation avec Malik : « Le livre d’or est signé par cinq personnes. »',
      ],
    ],
    [
      'ines',
      recu('ines-glace2'),
      ['Inès connaît le garçon.', 'Demandez-lui qui il était, puis ce qu’il faisait dehors.', 'Conversation avec Inès : « Qui était Théo ? », puis « Que faisait-il sur la glace ? ».'],
    ],
    [
      'julien',
      { flag: 'tourne' },
      [
        'Il reste quelqu’un qui n’a rien dit.',
        'Inès vous a renvoyé vers Julien. Même bloqué, quelque chose peut encore arriver.',
        'Écrivez à Julien dans Messages, puis attendez quelques instants et rouvrez les photos.',
      ],
    ],
    [
      'date',
      { mediaViewed: 'derniere-photo' },
      [
        'Quelqu’un a appelé ce téléphone. Son propre téléphone n’a jamais été retrouvé.',
        'Le message vocal donne une heure. Le livre d’or et l’article donnent une nuit.',
        'Réglages › Date et heure : désactivez le réglage automatique, puis 15/02/2014 à 02:14. Ouvrez ensuite Photos.',
      ],
    ],
    [
      'souvenir',
      recu('sarah-souvenir3'),
      ['Ce que montre cette photo, ils doivent le voir.', 'Relevez ce qu’on voit au loin sur IMG_0214.jpg.', 'Touchez les quatre lampes sur IMG_0214.jpg, puis « Le montrer au groupe ».'],
    ],
    [
      'aveu',
      { any: [recu('julien-groupe'), finChoisie] },
      [
        'Pour que la vérité soit entière, chacun doit l’avoir dite.',
        'Julien vous a débloqué.',
        'Conversation avec Julien : « Que s’est-il passé cette nuit-là ? ».',
      ],
    ],
    [
      'fin',
      finChoisie,
      [
        'Inès a retrouvé Léna.',
        'Quelqu’un doit lui dire la vérité. Qui ?',
        'Dans le groupe, choisissez qui parle à Léna. Si les quatre le font ensemble, Théo peut partir.',
      ],
    ],
  ]),

  rules: [
    {
      id: 'bonjour',
      when: { caseAccepted: true },
      effects: [
        { type: 'deliverMessage', messageId: 'sarah-p1', delayMs: 1500 },
        ...say(['sarah-g1', 2500], ['julien-g1', 2200], ['ines-g1', 2400], ['malik-g1', 2600], ['malik-g2', 1200]),
      ],
    },
    { id: 'malik-seul', when: recu('sys-malik'), effects: say(['malik-p1', 6000], ['malik-p2', 2500]) },
    { id: 'ines-arrive', when: recu('malik-cinq3'), effects: say(['ines-p1', 7000]) },

    /* Julien bloque ; peu après, Théo se retourne. */
    {
      id: 'bloque',
      when: recu('julien-bloque2'),
      effects: [{ type: 'setFlag', name: 'bloque', value: true }, { type: 'log', text: 'Julien vous a bloqué.' }, ...say(['sarah-tourne1', 15000])],
    },
    {
      id: 'tourne',
      when: recu('sarah-tourne1'),
      effects: [
        { type: 'setFlag', name: 'tourne', value: true },
        ...PHOTOS.map((m): Effect => ({ type: 'setMediaVariant', mediaId: m, variantId: 'face' })),
        ...say(['sarah-tourne2', 2500], ['ines-tourne', 3000]),
        { type: 'phoneOverride', key: 'extraApp', value: 'telephone' },
        { type: 'grantMedia', mediaId: 'messagerie' },
        { type: 'notify', title: 'Téléphone', body: 'Nouveau message vocal · Numéro masqué', app: 'phone' },
        { type: 'deliverMessage', messageId: 'julien-debloque1', delayMs: 25000, background: true },
        { type: 'log', text: 'Sur toutes les photos, le garçon s’est retourné.' },
      ],
    },
    { id: 'debloque', when: recu('julien-debloque1'), effects: say(['julien-debloque2', 2500]) },

    /* Revenir à 02:14, cette nuit-là : la dernière photo du téléphone de Théo. */
    {
      id: 'derniere',
      when: {
        all: [{ flag: 'tourne' }, { manualTime: '02:14' }, { any: [{ manualDate: '2014-02-15' }, { manualDate: '2014-02-14' }] }],
      },
      effects: [
        { type: 'grantMedia', mediaId: 'derniere-photo' },
        { type: 'notify', title: 'Photos', body: 'Nouvelle photo : IMG_0214.jpg', app: 'photos' },
        { type: 'log', text: 'Une photo est apparue : IMG_0214.jpg, 15 février 2014, 02:14.' },
      ],
    },

    /* Julien rejoint l'aveu du groupe une fois qu'il a tout dit. */
    { id: 'julien-rejoint', when: { all: [recu('sarah-souvenir3'), recu('julien-pari4')] }, effects: say(['julien-groupe', 3000]) },
    { id: 'lena', when: recu('ines-souvenir'), effects: say(['ines-lena1', 5000], ['ines-lena2', 2500]) },
    // Sans l'aveu de Julien, la fin complète n'est pas proposée : Inès le fait remarquer, sans rien dévoiler.
    { id: 'julien-silence', when: { all: [recu('ines-lena2'), { not: recu('julien-pari4') }, { not: finChoisie }] }, effects: [{ type: 'deliverMessage', messageId: 'ines-julien', delayMs: 9000, holdUntil: { not: finChoisie } }] },

    /* Trois fins. */
    {
      id: 'fin-ensemble',
      when: recu('sarah-reflet2'),
      effects: [{ type: 'log', text: 'Les quatre ont dit la vérité à Léna. Théo est parti.' }, { type: 'solveCase' }],
    },
    {
      id: 'fin-moi',
      when: { all: [{ replySent: 'f-moi' }, { mailRead: 'lena-mail' }] },
      effects: [{ type: 'log', text: 'Léna sait. Mais pas par eux.' }, { type: 'solveCase' }],
    },
    {
      id: 'fin-personne',
      when: recu('sarah-personne'),
      effects: [{ type: 'log', text: 'Personne n’a parlé. Théo est toujours sur les photos.' }, { type: 'solveCase' }],
    },
  ],

  about: { duration: '~20 min', tone: 'Enquête longue, trois fins' },
  conclusion: {
    title: 'Affaire résolue',
    text: ['Théo Marchand était avec eux, cette nuit-là. La vérité a été dite.'],
  },
  endings: [
    {
      when: { replySent: 'f-ensemble' },
      title: 'La vérité, de leur bouche',
      text: [
        'Dans la nuit du 14 au 15 février 2014, Théo Marchand a voulu traverser le lac gelé sur un pari. La glace a cédé. Sarah, Julien, Inès et Malik sont partis sans rien dire.',
        'Douze ans plus tard, ils l’ont dit eux-mêmes à Léna, ensemble. Le lendemain, à la terrasse d’un café, dans le reflet de la vitrine, ils étaient cinq. Théo souriait.',
      ],
    },
    {
      when: { replySent: 'f-moi' },
      title: 'Une vérité de seconde main',
      text: [
        'Théo Marchand ne s’est pas noyé seul : ses quatre amis étaient là et sont partis. Léna le sait, désormais.',
        'Mais c’est vous qui le lui avez écrit. « Pourquoi ce n’est pas eux ? » Sa question reste sans réponse.',
      ],
    },
    {
      when: { replySent: 'f-personne' },
      title: 'Affaire close, sans apaisement',
      text: [
        'Vous savez ce qui s’est passé sur le lac de Vaulx. Léna ne le saura pas.',
        'Le groupe a repris ses conversations. Sur les photos du chalet, le garçon au bonnet rouge regarde toujours l’objectif.',
      ],
    },
  ],
};
