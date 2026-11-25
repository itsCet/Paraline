/**
 * Enquête 5 — « Dossier 0 » (horreur). Brief : docs/enquete-5-dossier-0.md.
 *
 * Le téléphone pro du joueur appartenait à Victor Hessel, enquêteur disparu le 17/11/2024.
 * Il avait retrouvé le témoignage de Clara Morand (16 ans, disparue en 1998 après l'incendie
 * qui a tué sa mère), puis l'avait supprimé contre de l'argent. Clara est restée dans le téléphone.
 *
 * Mécaniques : anciennes notes datées · le jeu remarque quand le joueur le quitte (photo « prise
 * par ce téléphone » à l'heure réelle de son absence, note « Tu es parti 3 min 12 s ») · Localiser
 * (un point qui se rapproche) · la lumière baisse · « Récemment supprimés » si la date est réglée
 * dans les 30 jours suivant le 16/11/2024 · épreuve « Ne bouge plus » avec sursaut · deux fins.
 */
import type { CaseDefinition, Condition, Effect } from '../../../game/types';

const DIR = '/media/cases/dossier-0';
const IMG = { width: 1086, height: 1448 };
const recu = (id: string): Condition => ({ messageDelivered: id });
const hante: Condition = { flag: 'hante' };
const localise: Condition = { flag: 'localiser' };
const say = (...items: [string, number][]): Effect[] => items.map(([messageId, delayMs]) => ({ type: 'deliverMessage', messageId, delayMs }));
/** Messages de « l'inconnu » : ni le mode avion ni rien ne les arrête. */
const elle = (messageId: string, delayMs: number, background = false): Effect => ({ type: 'deliverMessage', messageId, delayMs, ignoreAirplane: true, background });
const dim = (v: number): Effect => ({ type: 'phoneOverride', key: 'dim', value: String(v) });

const ARTICLE = `
<div style="font-family:Georgia,'Times New Roman',serif">
<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#777">La Gazette de Saint-Aubin · 5 mars 1998</div>
<h2 style="font-size:23px;line-height:1.2;margin:8px 0 14px">Rue des Tilleuls : une mère de famille périt dans l’incendie de sa maison</h2>
<img src="${DIR}/clara-1998.jpg" alt="Photo de classe de Clara Morand, 16 ans." style="float:right;width:110px;height:146px;object-fit:cover;margin:0 0 8px 12px;filter:grayscale(.4)"/>
<p>Le feu s’est déclaré <span data-obs="incendie">dans la nuit du 3 au 4 mars, au premier étage du 12 rue des Tilleuls</span>. Les pompiers n’ont rien pu faire pour Sylvie Morand, 41 ans.</p>
<p>Détail que les enquêteurs n’expliquent pas : <span data-obs="porte-fermee">la porte de sa chambre était fermée à clé, de l’extérieur</span>.</p>
<p>Sa fille, Clara, 16 ans, reste introuvable. <span data-obs="fugue">« Elle avait déjà fugué, elle reviendra », assure son beau-père, Bernard Morand</span>, qui se trouvait au rez-de-chaussée.</p>
</div>`;

const AVIS = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
<div style="background:#b3261e;color:#fff;font-weight:800;letter-spacing:.12em;padding:8px;margin-bottom:14px">DISPARITION INQUIÉTANTE</div>
<img src="${DIR}/victor.jpg" alt="Photo de Victor Hessel." style="width:160px;height:213px;object-fit:cover;border-radius:4px;margin:0 auto 12px;display:block"/>
<h2 style="font-size:24px;margin:0 0 4px">Victor HESSEL</h2>
<div style="color:#666;margin-bottom:14px">46 ans · 1,82 m · barbe grisonnante · manteau sombre</div>
<p style="text-align:left">Vu pour la dernière fois <span data-obs="derniere-fois">le 16 novembre 2024 au soir, rue des Tilleuls, à Saint-Aubin</span>.</p>
<p style="text-align:left"><span data-obs="telephone-jamais">Son téléphone portable n’a jamais été retrouvé.</span></p>
<p style="color:#666;font-size:13px">Tout renseignement : gendarmerie de Saint-Aubin · 17</p>
</div>`;

export const dossierZero: CaseDefinition = {
  id: 'dossier-0',
  title: 'Dossier 0',
  client: 'coord',
  weather: { city: 'Saint-Aubin', temp: 6, sky: 'brouillard' },
  about: { duration: '~25 min', tone: 'Horreur · déconseillé aux âmes sensibles' },
  characters: [
    { id: 'coord', name: 'Coordination Paraline', initials: 'P', color: '#6b4f22', role: 'Réseau Paraline' },
    { id: 'agnes', name: 'Agnès Ferrand', initials: 'A', color: '#5a6b7a', role: 'Voisine du 12 rue des Tilleuls' },
    { id: 'inconnu', name: 'Inconnu', initials: '?', color: '#3a2a2a', role: 'Numéro masqué' },
  ],

  media: [
    {
      // Visite à 360° de l'étage, faite par Victor avec ce téléphone.
      id: 'visite-chambre',
      kind: 'image',
      name: 'VISITE_360_chambre.jpg',
      sizeLabel: 'Photo à 360°',
      album: 'Victor',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/visite-chambre.jpg`,
          alt: 'Visite à 360° de la chambre de Clara : armoire à glace, fenêtre aux volets clos, bureau avec un poste-cassette, posters des années 90, lit au couvre-lit fleuri, table de nuit, porte ouverte sur le couloir.',
          panorama: { exits: [{ x: 0.955, y: 0.68, to: 'visite-couloir', label: 'Couloir' }] },
          hotspots: [
            { id: 'v-dicta', x: 0.752, y: 0.64, w: 0.048, h: 0.04, observationId: 'dictaphone' },
            { id: 'v-poste', x: 0.405, y: 0.55, w: 0.04, h: 0.04, observationId: 'poste' },
            { id: 'v-ours', x: 0.09, y: 0.29, w: 0.04, h: 0.06, observationId: 'ours' },
          ],
        },
        // La chambre change : dans l'embrasure de la porte, quelqu'un se tient dans le noir.
        elle: {
          src: `${DIR}/visite-chambre-elle.jpg`,
          alt: 'La même chambre à 360°. Dans l’embrasure de la porte ouverte, dans le couloir sombre, une jeune fille pâle en chemise de nuit blanche se tient immobile.',
          panorama: { exits: [{ x: 0.955, y: 0.68, to: 'visite-couloir', label: 'Couloir' }] },
          hotspots: [
            { id: 'v-dicta', x: 0.752, y: 0.64, w: 0.048, h: 0.04, observationId: 'dictaphone' },
            { id: 'v-poste', x: 0.405, y: 0.55, w: 0.04, h: 0.04, observationId: 'poste' },
            { id: 'v-ours', x: 0.09, y: 0.29, w: 0.04, h: 0.06, observationId: 'ours' },
            { id: 'v-coin', x: 0.952, y: 0.42, w: 0.034, h: 0.25, observationId: 'coin' },
          ],
        },
      },
    },
    {
      id: 'visite-couloir',
      kind: 'image',
      name: 'VISITE_360_couloir.jpg',
      sizeLabel: 'Photo à 360°',
      album: 'Victor',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/visite-couloir.jpg`,
          alt: 'Visite à 360° du couloir de l’étage : escalier, cadres au mur, porte ouverte de la chambre de Clara, fenêtre au fond, et une porte noircie par l’incendie, une clé dans la serrure.',
          panorama: { exits: [{ x: 0.32, y: 0.55, to: 'visite-chambre', label: 'Chambre de Clara' }] },
          hotspots: [
            { id: 'v-cle', x: 0.81, y: 0.58, w: 0.025, h: 0.07, observationId: 'cle-serrure' },
            { id: 'v-porte', x: 0.69, y: 0.22, w: 0.14, h: 0.6, observationId: 'porte-brulee' },
            { id: 'v-famille', x: 0.13, y: 0.29, w: 0.075, h: 0.21, observationId: 'photos-famille' },
            { id: 'v-enfance', x: 0.425, y: 0.32, w: 0.03, h: 0.11, observationId: 'cadre-enfance' },
            { id: 'v-mariage', x: 0.605, y: 0.3, w: 0.03, h: 0.1, observationId: 'cadre-mariage' },
            { id: 'v-tableau', x: 0.905, y: 0.21, w: 0.08, h: 0.17, observationId: 'tableau-maison' },
          ],
        },
      },
    },
    { id: 'article', kind: 'document', name: 'gazette_05-03-1998', sizeLabel: 'Archive', defaultVariant: 'doc', variants: { doc: { src: '', html: ARTICLE } } },
    { id: 'avis', kind: 'document', name: 'avis_disparition_hessel', sizeLabel: 'Affiche', defaultVariant: 'doc', variants: { doc: { src: '', html: AVIS } } },
    {
      id: 'victor-vocal',
      kind: 'audio',
      name: 'Victor — 17 nov. 2024, 03:02',
      sizeLabel: 'Message vocal',
      durationLabel: '00:14',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/victor-messagerie.mp3`,
          // Horaires calés sur l'enregistrement généré (14,4 s).
          cues: [
            { start: 0, end: 2.1, text: 'Agnès… c’est Victor.' },
            { start: 2.35, end: 4.55, text: 'Il est trois heures. J’ai fait une erreur.' },
            { start: 4.76, end: 7.35, text: 'J’ai effacé ce qu’elle avait dit… pour de l’argent.', observationId: 'victor-efface' },
            { start: 7.67, end: 9.94, text: 'Elle est là. Elle est dans le téléphone.' },
            { start: 10.54, end: 14.4, text: 'Si quelqu’un trouve ce téléphone… ne l’éteignez pas. Écoutez-la.' },
          ],
        },
      },
    },
    {
      // Photo « prise par ce téléphone » pendant que le joueur était parti.
      id: 'bureau-derriere',
      kind: 'image',
      name: 'IMG_0001.jpg',
      sizeLabel: '1,8 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/bureau-derriere.jpg`,
          ...IMG,
          alt: 'La nuit, votre bureau photographié depuis l’embrasure de la porte : lampe allumée, chaise tirée, comme si quelqu’un venait de se lever.',
          info: [
            { label: 'Date', value: 'Aujourd’hui · {flag:photo:heure}', observationId: 'photo-absence' },
            { label: 'Appareil', value: 'Ce téléphone' },
            { label: 'Lieu', value: 'Chez vous' },
          ],
        },
      },
    },
    {
      id: 'temoignage',
      kind: 'audio',
      name: 'temoignage_clara.m4a',
      sizeLabel: 'Supprimé le 16/11/2024',
      durationLabel: '00:26',
      album: 'Récemment supprimés',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/temoignage-clara.mp3`,
          // Horaires calés sur l'enregistrement généré (23 s de voix, puis un chuchotement à gauche).
          cues: [
            { start: 0, end: 4.54, text: 'Je m’appelle Clara Morand. J’ai seize ans…' },
            { start: 5.49, end: 8.82, text: 'Si quelqu’un entend ça… ce n’était pas un accident.' },
            { start: 9.21, end: 13.7, text: 'Cette nuit-là, je l’ai vu fermer la porte de la chambre de maman. Avec la clé.', observationId: 'porte-cle' },
            { start: 14.14, end: 18.92, text: 'Après, il y a eu la fumée. Il m’a dit que personne ne me croirait.' },
            { start: 19.36, end: 23.03, text: 'Alors je l’enregistre. Pour que quelqu’un m’entende.', observationId: 'entendue' },
            { start: 24.2, end: 25.4, text: '[à votre oreille] Je suis restée.' },
          ],
        },
      },
    },
    {
      id: 'bureau-porte',
      kind: 'image',
      name: 'IMG_0002.jpg',
      sizeLabel: '1,6 Mo',
      defaultVariant: 'v',
      variants: { v: { src: `${DIR}/bureau-porte.jpg`, ...IMG, alt: 'Photo prise depuis votre bureau vers la porte grande ouverte. Dans le couloir noir, une silhouette pâle aux longs cheveux.' } },
    },
    {
      id: 'bureau-matin',
      kind: 'image',
      name: 'IMG_0003.jpg',
      sizeLabel: '1,7 Mo',
      defaultVariant: 'v',
      variants: { v: { src: `${DIR}/bureau-matin.jpg`, ...IMG, alt: 'Votre bureau au matin, lumière douce, lampe éteinte, chaise rangée. Rien d’anormal.' } },
    },
  ],

  initialMail: {
    id: 'd0-mail',
    from: 'coord',
    subject: 'Dossier restauré : Victor Hessel',
    timeLabel: '23:58',
    preview: 'Le téléphone que nous vous avons confié appartenait à Victor Hessel.',
    body: [
      'Bonsoir,',
      'Le téléphone professionnel que nous vous avons confié appartenait à Victor Hessel, enquêteur du réseau, disparu le 17 novembre 2024.',
      'Cette nuit, une sauvegarde automatique a restauré un dossier qu’il n’avait jamais clos. Nous ne savons pas comment.',
      'Si vous l’ouvrez, vous reprenez son enquête. Ses notes et ses échanges sont toujours sur l’appareil.',
      '⚠︎ Contient des images et des sons destinés à effrayer. Les effets brusques peuvent être atténués dans Réglages › Accessibilité.',
      'La coordination',
    ],
  },

  threads: [
    { id: 't-agnes', contact: 'agnes', stamp: 'Novembre 2024' },
    { id: 't-inconnu', contact: 'inconnu', callText: 'Numéro masqué. Mais quand vous raccrochez, vous entendez encore respirer.' },
  ],

  openingMessages: ['a-old1', 'v-old1', 'a-old2', 'v-old2', 'a-old3'],

  messages: [
    /* Les derniers échanges de Victor (novembre 2024) : ses messages s'affichent comme les vôtres. */
    { id: 'a-old1', threadId: 't-agnes', from: 'agnes', text: 'Monsieur Hessel, je l’ai encore entendue cette nuit. Elle pleure derrière le mur.', notify: false, time: '23:52' },
    { id: 'v-old1', threadId: 't-agnes', from: 'player', text: 'J’ai trouvé quelque chose dans la chambre. Je vous en parle demain.', time: '23:58' },
    { id: 'a-old2', threadId: 't-agnes', from: 'agnes', text: 'Bernard Morand est passé chez moi. Il savait que vous étiez venu.', notify: false, time: '18:20' },
    { id: 'v-old2', threadId: 't-agnes', from: 'player', text: 'Je ne peux plus continuer cette affaire. Pardon.', time: '22:41' },
    { id: 'a-old3', threadId: 't-agnes', from: 'agnes', text: 'Monsieur Hessel ? Répondez-moi, s’il vous plaît.', notify: false, time: '09:07' },
    { id: 'sys-auj', threadId: 't-agnes', from: 'agnes', text: 'Aujourd’hui', system: true },
    { id: 'a-now1', threadId: 't-agnes', from: 'agnes', text: 'Monsieur Hessel ?? Votre téléphone vient de se reconnecter. C’est vous ?' },

    { id: 'a-qui1', threadId: 't-agnes', from: 'agnes', text: 'Alors il n’est jamais revenu…' },
    { id: 'a-qui2', threadId: 't-agnes', from: 'agnes', text: 'Je l’avais appelé pour la maison d’à côté. Le 12. Celle des Morand. Personne n’y vit depuis 1998.' },
    { id: 'a-qui3', threadId: 't-agnes', from: 'agnes', text: 'Je vous envoie ce qu’il m’avait montré. Dans la chambre, il est resté longtemps penché sur la table de nuit.' },
    { id: 'a-qui4b', threadId: 't-agnes', from: 'agnes', text: 'Il avait fait une visite à 360° de la maison. Vous pouvez tourner autour de vous, passer d’une pièce à l’autre.' },
    { id: 'a-qui4c', threadId: 't-agnes', from: 'agnes', attachments: ['visite-chambre'], notify: false },
    { id: 'a-qui5', threadId: 't-agnes', from: 'agnes', attachments: ['article'], notify: false },

    { id: 'a-clara1', threadId: 't-agnes', from: 'agnes', text: 'Clara ne serait jamais partie sans sa mère. Mais personne ne l’a cherchée bien longtemps.' },
    { id: 'a-clara2', threadId: 't-agnes', from: 'agnes', text: 'Bernard Morand s’est remarié. Il est adjoint au maire, aujourd’hui.' },

    { id: 'a-victor1', threadId: 't-agnes', from: 'agnes', text: 'La nuit du 17. À trois heures du matin. Il m’a laissé ce message. Je ne l’ai jamais effacé.' },
    { id: 'a-victor2', threadId: 't-agnes', from: 'agnes', attachments: ['victor-vocal'], notify: false },
    { id: 'a-victor3', threadId: 't-agnes', from: 'agnes', text: 'Le lendemain, il y avait des affiches partout.' },
    { id: 'a-victor4', threadId: 't-agnes', from: 'agnes', attachments: ['avis'], notify: false },

    { id: 'a-dicta1', threadId: 't-agnes', from: 'agnes', text: 'Il l’avait copiée sur son téléphone. Il disait qu’on entendait Clara.' },
    { id: 'a-dicta2', threadId: 't-agnes', from: 'agnes', text: 'Sur votre téléphone, donc.' },
    { id: 'a-dicta3', threadId: 't-agnes', from: 'agnes', text: 'Attendez. La visite de la chambre… regardez-la encore. Derrière la porte.' },

    { id: 'a-envoi1', threadId: 't-agnes', from: 'agnes', text: '…' },
    { id: 'a-envoi2', threadId: 't-agnes', from: 'agnes', text: 'Je l’apporte à la gendarmerie demain matin. Cette fois, ils ne pourront pas l’ignorer.' },
    { id: 'a-fin', threadId: 't-agnes', from: 'agnes', text: 'Ils ont rouvert le dossier de 1998. Ils cherchent Clara. Enfin.' },

    /* L'inconnu */
    { id: 'i-1', threadId: 't-inconnu', from: 'inconnu', text: 'Tu as son téléphone.' },
    { id: 'i-vu', threadId: 't-inconnu', from: 'inconnu', text: 'Je te regarde.' },
    { id: 'i-viens', threadId: 't-inconnu', from: 'inconnu', text: 'Je viens.' },
    { id: 'i-16', threadId: 't-inconnu', from: 'inconnu', text: 'Le 16 novembre. Ramène-moi au 16 novembre.' },
    { id: 'i-trouvee', threadId: 't-inconnu', from: 'inconnu', text: 'Tu m’as trouvée.' },
    { id: 'i-partir1', threadId: 't-inconnu', from: 'inconnu', text: 'Ils vont m’entendre.' },
    { id: 'i-partir2', threadId: 't-inconnu', from: 'inconnu', text: 'Je peux partir, maintenant.' },
    { id: 'i-partir3', threadId: 't-inconnu', from: 'inconnu', text: 'Mais si quelqu’un me retient, je reste. Pose le téléphone.' },
    { id: 'i-bouge', threadId: 't-inconnu', from: 'inconnu', text: 'Ne bouge plus.' },
    { id: 'i-merci', threadId: 't-inconnu', from: 'inconnu', text: 'Merci.' },
    { id: 'i-eteindre', threadId: 't-inconnu', from: 'inconnu', text: 'Tu peux éteindre.' },
    { id: 'i-parti', threadId: 't-inconnu', from: 'inconnu', text: 'Tu es parti.' },
  ],

  notes: [
    { id: 'v1', at: '2024-11-08T21:14:00', body: '12 rue des Tilleuls\nAgnès F. (voisine) entend une jeune fille pleurer la nuit.\nLa maison est vide depuis 1998.' },
    { id: 'v2', at: '2024-11-12T23:40:00', body: 'Chambre du haut.\nUn mini-dictaphone sur la table de nuit. Une cassette.\nJe l’ai numérisée. C’est elle.' },
    { id: 'v3', at: '2024-11-15T19:05:00', body: 'Morand m’a donné rendez-vous.\n5 000 €. Il veut la cassette.' },
    { id: 'v4', at: '2024-11-16T22:31:00', body: 'J’ai supprimé l’enregistrement.\nIl reste trente jours dans « Récemment supprimés ».\nAprès, il n’existera plus.' },
    { id: 'v5', at: '2024-11-17T03:02:00', body: 'Elle est dans le téléphone.' },
    { id: 'absent', body: 'Tu es parti {flag:absence:duree}.\nJe suis restée.' },
    { id: 'fin', body: 'Merci.\nTu peux éteindre.' },
  ],

  replies: [
    {
      id: 'r-pas-victor',
      threadId: 't-agnes',
      label: 'Je ne suis pas Victor. J’ai récupéré son téléphone.',
      available: recu('a-now1'),
      effects: say(['a-qui1', 3000], ['a-qui2', 3500], ['a-qui3', 2000], ['a-qui4b', 2500], ['a-qui4c', 1200], ['a-qui5', 1500]),
    },
    {
      id: 'r-clara',
      threadId: 't-agnes',
      label: 'Clara Morand a vraiment fugué ?',
      available: { any: [{ observationFound: 'fugue' }, { observationFound: 'porte-fermee' }, { observationFound: 'cle-serrure' }] },
      effects: say(['a-clara1', 3000], ['a-clara2', 3000]),
    },
    {
      id: 'r-victor',
      threadId: 't-agnes',
      label: 'Quand avez-vous eu des nouvelles de Victor pour la dernière fois ?',
      available: recu('a-qui5'),
      effects: say(['a-victor1', 3500], ['a-victor2', 1500], ['a-victor3', 3000], ['a-victor4', 1500]),
    },
    {
      id: 'r-dicta',
      threadId: 't-agnes',
      label: 'Il y avait un dictaphone dans la chambre. Victor a trouvé la cassette ?',
      available: { observationFound: 'dictaphone' },
      effects: say(['a-dicta1', 3000], ['a-dicta2', 2500], ['a-dicta3', 6000]),
    },
    {
      id: 'r-envoyer',
      threadId: 't-agnes',
      label: 'J’ai retrouvé l’enregistrement de Clara. Je vous l’envoie.',
      available: { observationFound: 'entendue' },
      effects: say(['a-envoi1', 3000], ['a-envoi2', 4000]),
    },
  ],

  observations: [
    { id: 'dictaphone', title: 'Un mini-dictaphone sur la table de nuit. Sans cassette.', mediaId: 'visite-chambre', autoFile: true, actions: [{ type: 'ask', replyId: 'r-dicta', label: 'Demander à Agnès' }] },
    { id: 'coin', title: 'Dans l’embrasure de la porte, quelqu’un vous regarde.', mediaId: 'visite-chambre', autoFile: true, actions: [] },
    { id: 'poste', title: 'Un poste-cassette sur le bureau. Clara enregistrait déjà ses cassettes.', mediaId: 'visite-chambre', actions: [] },
    { id: 'ours', title: 'Un ours en peluche, en haut de l’armoire, couvert de poussière.', mediaId: 'visite-chambre', actions: [] },
    {
      id: 'cle-serrure',
      title: 'La clé est restée dans la serrure de la chambre brûlée… côté couloir. On l’a enfermée de l’extérieur.',
      mediaId: 'visite-couloir',
      autoFile: true,
      actions: [{ type: 'ask', replyId: 'r-clara', label: 'Demander à Agnès' }],
    },
    { id: 'porte-brulee', title: 'La porte de la chambre de Sylvie, noircie par l’incendie de 1998.', mediaId: 'visite-couloir', autoFile: true, actions: [] },
    { id: 'photos-famille', title: 'Des photos de famille : Clara, sa mère Sylvie, des grands-parents. Aucune de Bernard Morand.', mediaId: 'visite-couloir', actions: [] },
    { id: 'cadre-enfance', title: 'Clara, petite, sur les épaules de sa mère. Au dos du cadre : « Clara et maman, 1990 ».', mediaId: 'visite-couloir', actions: [] },
    { id: 'cadre-mariage', title: 'Le mariage de Sylvie et Bernard, juin 1993. Le visage de Bernard a été gratté.', mediaId: 'visite-couloir', autoFile: true, actions: [] },
    { id: 'tableau-maison', title: 'Une peinture de la maison, au printemps. Signée « S. Morand ». Sylvie peignait.', mediaId: 'visite-couloir', actions: [] },
    { id: 'incendie', title: 'Incendie au 12 rue des Tilleuls, nuit du 3 au 4 mars 1998. Sylvie Morand est morte.', mediaId: 'article', autoFile: true, actions: [] },
    { id: 'porte-fermee', title: 'La porte de la chambre de Sylvie était fermée à clé, de l’extérieur.', mediaId: 'article', autoFile: true, actions: [{ type: 'ask', replyId: 'r-clara', label: 'Demander à Agnès' }] },
    { id: 'fugue', title: '« Elle a fugué », selon le beau-père, Bernard Morand.', mediaId: 'article', autoFile: true, actions: [{ type: 'ask', replyId: 'r-clara', label: 'Demander à Agnès' }] },
    { id: 'derniere-fois', title: 'Victor a été vu pour la dernière fois le 16/11/2024 au soir, rue des Tilleuls.', mediaId: 'avis', autoFile: true, actions: [] },
    { id: 'telephone-jamais', title: 'Son téléphone n’a jamais été retrouvé. Vous l’avez entre les mains.', mediaId: 'avis', autoFile: true, actions: [] },
    { id: 'victor-efface', title: 'Victor a effacé ce que Clara avait dit. Pour de l’argent.', mediaId: 'victor-vocal', autoFile: true, actions: [] },
    { id: 'photo-absence', title: 'Cette photo a été prise par votre téléphone pendant que vous n’étiez pas là.', mediaId: 'bureau-derriere', autoFile: true, actions: [] },
    { id: 'porte-cle', title: 'Clara a vu son beau-père fermer la porte de sa mère à clé, avant l’incendie.', mediaId: 'temoignage', autoFile: true, actions: [] },
    { id: 'entendue', title: 'Clara a enregistré son témoignage pour être entendue.', mediaId: 'temoignage', autoFile: true, actions: [{ type: 'ask', replyId: 'r-envoyer', label: 'L’envoyer à Agnès' }] },
  ],

  steps: [{ id: 'clara', objective: 'Qu’est-ce que Victor a fait, et que veut-elle ?' }],

  obstacles: [
    {
      id: 'agnes',
      solved: { any: [{ replySent: 'r-pas-victor' }, { flag: 'hante' }] },
      hints: ['Quelqu’un écrit encore à Victor.', 'Dans Messages, Agnès attend une réponse.', 'Répondez à Agnès : « Je ne suis pas Victor. J’ai récupéré son téléphone. »'],
    },
    {
      id: 'chambre',
      solved: hante,
      hints: [
        'La chambre de Clara cache un objet.',
        'Dans la visite à 360°, regardez près du lit, parlez-en à Agnès, puis retournez dans la chambre.',
        'Dans la visite à 360°, touchez le dictaphone sur la table de nuit, posez la question à Agnès, puis rouvrez la visite.',
      ],
    },
    {
      id: 'victor',
      solved: { any: [{ mediaViewed: 'victor-vocal' }, { noteWritten: 'v4' }] },
      hints: ['Que s’est-il passé la dernière nuit de Victor ?', 'Agnès a reçu un dernier message.', 'Demandez à Agnès quand elle a eu des nouvelles de Victor, puis écoutez le message vocal.'],
    },
    {
      id: 'supprime',
      solved: { any: [{ mediaViewed: 'temoignage' }, { observationFound: 'entendue' }] },
      hints: [
        'Victor n’a pas tout effacé d’un coup.',
        'Relisez ses notes : un délai de trente jours.',
        'Réglages › Date et heure : désactivez le réglage automatique, choisissez une date entre le 16/11/2024 et le 15/12/2024, puis ouvrez Photos.',
      ],
    },
    {
      id: 'ecouter',
      solved: { observationFound: 'entendue' },
      hints: ['Écoutez-la jusqu’au bout.', 'Ce qu’elle dit à la fin compte.', 'Ouvrez temoignage_clara.m4a et touchez la ligne « Pour que quelqu’un m’entende ».'],
    },
    {
      id: 'envoyer',
      solved: recu('i-bouge'),
      hints: ['Clara veut être entendue.', 'Agnès peut la faire entendre.', 'Dans Messages, envoyez l’enregistrement à Agnès.'],
    },
    {
      id: 'bouge',
      solved: { any: [{ flag: 'immobile', equals: 'held' }, { flag: 'immobile', equals: 'left' }] },
      hints: ['Elle peut partir, si personne ne la retient.', 'Ne faites rien. Vraiment rien.', 'Posez le téléphone à plat et ne le touchez ni ne le bougez pendant 30 secondes, sans quitter le jeu.'],
    },
  ],

  stillness: {
    seconds: 30,
    text: 'Ne bouge plus.',
    subtitle: 'Si tu bouges, je reste.',
    retryText: 'Tu as bougé. Elle est encore là.',
    warning: { text: 'Touche l’écran, et tu le regretteras.', afterSeconds: 6 },
    ready: {
      title: 'Laisse-la partir',
      text: [
        'Clara a été entendue. Elle peut enfin partir, mais seulement si personne ne la retient.',
        'Posez le téléphone à plat. Pendant 30 secondes, ne le touchez plus et ne le bougez plus.',
      ],
      button: 'Je pose le téléphone',
    },
    scareImage: `${DIR}/jumpscare-v2.jpg`,
    scareSound: `${DIR}/jumpscare.mp3`,
    ambience: `${DIR}/coeur.mp3`,
    steps: `${DIR}/pas.mp3`,
    whisper: `${DIR}/ne-bouge-plus.mp3`,
  },

  // Le jeu remarque quand le joueur le quitte, une fois qu'elle est là.
  onReturn: {
    minAwayMs: 8000,
    when: { all: [hante, { not: { flag: 'immobile' } }] },
    effects: [
      { type: 'setFlag', name: 'absence', value: '$awayMs' },
      { type: 'setFlag', name: 'photo', value: '$awayAt' },
      { type: 'removeNote', noteId: 'absent' },
      { type: 'writeNote', noteId: 'absent', delayMs: 600 },
    ],
  },

  rules: [
    {
      id: 'ouverture',
      when: { caseAccepted: true },
      effects: [
        { type: 'writeNote', noteId: 'v1' },
        { type: 'writeNote', noteId: 'v2' },
        ...say(['sys-auj', 2500], ['a-now1', 2500]),
      ],
    },
    { id: 'note-morand', when: { any: [{ observationFound: 'fugue' }, { observationFound: 'porte-fermee' }, { observationFound: 'cle-serrure' }] }, effects: [{ type: 'writeNote', noteId: 'v3', delayMs: 4000 }] },
    { id: 'note-supprime', when: { mediaViewed: 'victor-vocal' }, effects: [{ type: 'writeNote', noteId: 'v4', delayMs: 6000 }] },
    { id: 'note-supprime-vue', when: { noteWritten: 'v4' }, effects: [{ type: 'notify', title: 'Notes', body: 'Note restaurée · 16 nov. 2024, 22:31', app: 'notes' }] },
    // Elle pousse le joueur vers la date (sans dire « Réglages ») une fois qu'il sait que l'enregistrement a été supprimé.
    { id: 'ramene-moi', when: { all: [hante, { noteWritten: 'v4' }, { not: { mediaViewed: 'temoignage' } }] }, effects: [elle('i-16', 20000)] },

    /* Bascule : la chambre change ; quand on la voit, elle est là. */
    { id: 'chambre-change', when: { all: [{ observationFound: 'dictaphone' }, recu('a-dicta2')] }, effects: [{ type: 'setMediaVariant', mediaId: 'visite-chambre', variantId: 'elle' }, { type: 'notify', title: 'Photos', body: 'VISITE_360_chambre.jpg · modifiée à l’instant', app: 'photos' }] },
    {
      id: 'bascule',
      when: { any: [{ mediaViewed: 'visite-chambre@elle' }, { observationFound: 'coin' }] },
      effects: [
        { type: 'setFlag', name: 'hante', value: true },
        { type: 'writeNote', noteId: 'v5', delayMs: 3000 },
        elle('i-1', 7000),
        elle('i-vu', 80000, true),
        dim(0.12),
        { type: 'log', text: 'Quelqu’un d’autre utilise ce téléphone.' },
      ],
    },
    // Si le joueur ne quitte jamais le jeu, la photo arrive quand même.
    { id: 'photo-sans-absence', when: { all: [recu('i-vu'), { not: { flag: 'photo' } }] }, effects: [{ type: 'setFlag', name: 'photo', value: '$now' }] },
    {
      id: 'photo-prise',
      when: { flag: 'photo' },
      effects: [
        { type: 'grantMedia', mediaId: 'bureau-derriere' },
        { type: 'notify', title: 'Photos', body: 'Nouvelle photo · prise par ce téléphone', app: 'photos' },
      ],
    },

    /* Elle se rapproche. */
    {
      id: 'localiser',
      when: { mediaViewed: 'bureau-derriere' },
      effects: [
        { type: 'setFlag', name: 'localiser', value: true },
        { type: 'setFlag', name: 'distance', value: 4 },
        { type: 'phoneOverride', key: 'extraApp', value: 'localiser' },
        { type: 'notify', title: 'Localiser', body: 'Un contact partage sa position avec vous', app: 'locate' },
        elle('i-viens', 6000),
        dim(0.2),
      ],
    },
    { id: 'distance-3', when: { all: [localise, { any: [{ noteWritten: 'v4' }, { mediaViewed: 'victor-vocal' }] }] }, effects: [{ type: 'setFlag', name: 'distance', value: 3 }] },

    /* « Récemment supprimés » : l'élément existe encore dans les trente jours qui suivent la suppression. */
    {
      id: 'recupere',
      when: { all: [hante, { manualDateBetween: ['2024-11-16', '2024-12-15'] }] },
      effects: [
        { type: 'grantMedia', mediaId: 'temoignage' },
        elle('i-trouvee', 4000),
        { type: 'setFlag', name: 'distance', value: 2 },
        dim(0.3),
        { type: 'log', text: 'temoignage_clara.m4a est réapparu dans « Récemment supprimés ».' },
      ],
    },
    { id: 'ecoutee', when: { observationFound: 'entendue' }, effects: [{ type: 'setFlag', name: 'distance', value: 1 }, dim(0.4)] },

    /* Ne bouge plus. */
    // Elle explique pourquoi : elle peut partir, mais seulement si personne ne la retient.
    { id: 'bouge', when: recu('a-envoi2'), effects: [elle('i-partir1', 5000), elle('i-partir2', 3000), elle('i-partir3', 3500), elle('i-bouge', 3500)] },
    { id: 'epreuve', when: recu('i-bouge'), effects: [{ type: 'phoneOverride', key: 'stillness', value: 'dossier-0' }] },

    /* Fin complète : elle a été entendue. */
    {
      id: 'tenu',
      when: { flag: 'immobile', equals: 'held' },
      effects: [
        { type: 'setFlag', name: 'distance', value: 0 },
        { type: 'clearPhoneOverride', key: 'dim' },
        { type: 'removeNote', noteId: 'absent' },
        { type: 'writeNote', noteId: 'fin', delayMs: 2500 },
        elle('i-merci', 2000),
        elle('i-eteindre', 2500),
        { type: 'grantMedia', mediaId: 'bureau-matin' },
        ...say(['a-fin', 16000]),
      ],
    },
    {
      id: 'fin-tenu',
      when: recu('a-fin'),
      effects: [
        { type: 'log', text: 'Le témoignage de Clara a été entendu.' },
        { type: 'solveCase' },
        // L'article « Affaire Morand : l'enquête rouverte » paraît dans Le Fil (src/content/news.ts).
        { type: 'notify', title: 'Le Fil · La Gazette de Saint-Aubin', body: 'Incendie de 1998 : l’enquête est rouverte', app: 'news' },
      ],
    },

    /* Fin sombre : le joueur est parti pendant l'épreuve. */
    {
      id: 'parti',
      when: { flag: 'immobile', equals: 'left' },
      effects: [
        { type: 'grantMedia', mediaId: 'bureau-porte' },
        { type: 'notify', title: 'Photos', body: 'Nouvelle photo · prise par ce téléphone', app: 'photos' },
        elle('i-parti', 1500),
      ],
    },
    { id: 'fin-parti', when: recu('i-parti'), effects: [{ type: 'log', text: 'Vous êtes parti. Elle est restée.' }, { type: 'solveCase' }] },
  ],

  conclusion: { title: 'Affaire close', text: ['Victor Hessel avait effacé le témoignage de Clara Morand. Il a été retrouvé.'] },
  endings: [
    {
      when: { flag: 'immobile', equals: 'held' },
      title: 'Entendue',
      text: [
        'En 1998, Clara Morand a vu son beau-père enfermer sa mère avant l’incendie. Elle l’a enregistré, puis elle a disparu. En 2024, Victor Hessel a retrouvé la cassette et l’a effacée contre 5 000 €.',
        'Vous avez récupéré son témoignage et vous êtes resté jusqu’au bout. L’enquête de 1998 est rouverte. Le téléphone est calme.',
      ],
    },
    {
      when: { flag: 'immobile', equals: 'left' },
      title: 'Elle est restée',
      text: [
        'Le témoignage de Clara est parti chez Agnès. Mais quand elle vous a demandé de ne plus bouger, vous êtes parti.',
        'La dernière photo a été prise depuis votre bureau, vers la porte ouverte.',
      ],
    },
  ],
};
