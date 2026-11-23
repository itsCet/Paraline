/**
 * Enquête 6 — « 12 % » (thriller en temps réel, sans surnaturel). Brief : docs/enquete-6-douze-pourcent.md.
 *
 * Léa, 24 ans, se réveille enfermée dans le local technique d'une piscine fermée. Elle croit écrire
 * à sa sœur Camille ; le message arrive sur la ligne de permanence du joueur. Sa batterie baisse en
 * temps réel, et chaque demande lui coûte : texte 1 %, photo 2 %, message vocal 3 %.
 * Il faut trouver le lieu (piscine Jean-Bouin) et le donner aux gendarmes, sans le donner à « Hugo »,
 * qui se dit son frère : c'est lui qui l'a enfermée (Léa a dit que sa sœur était sa seule famille).
 *
 * Fins : Retrouvée (Hugo démasqué ou non) · Au petit matin (dernier indice à 1 %) · Un dernier message
 * (message pour Camille à 1 %, lieu jamais donné) · Il est arrivé avant (lieu donné à Hugo).
 */
import type { CaseDefinition, Condition, Effect } from '../../../game/types';

const DIR = '/media/cases/douze-pourcent';
const IMG = { width: 1086, height: 1448 };
const recu = (id: string): Condition => ({ messageDelivered: id });
const flag = (name: string, equals?: string | boolean): Condition => (equals === undefined ? { flag: name } : { flag: name, equals });
const say = (...items: [string, number][]): Effect[] => items.map(([messageId, delayMs]) => ({ type: 'deliverMessage', messageId, delayMs }));
const later = (messageId: string, delayMs: number, holdUntil?: Condition): Effect => ({ type: 'deliverMessage', messageId, delayMs, background: true, holdUntil });
const cout = (n: number): Effect => ({ type: 'addFlag', name: 'batterie', delta: -n, min: 1 });

const allumee: Condition = { not: flag('off') };
const unPourcent: Condition = { flagAtMost: 'batterie', value: 1 };
/** Léa peut encore répondre à une demande : téléphone allumé, plus de 1 %. */
const lea = (cond?: Condition): Condition => ({ all: [allumee, { not: unPourcent }, ...(cond ? [cond] : [])] });
const lieuOk = flag('lieu', 'ok');
const fin = (v?: string): Condition => flag('fin', v);
/** Ce qui permet de désigner la piscine Jean-Bouin (et pas seulement de deviner). */
const preuveBouin: Condition = {
  any: [{ observationFound: 'clocher' }, { observationFound: 'cloches' }, { observationFound: 'bouin-eglise' }, recu('l-dernier'), recu('c-2')],
};

const PLAN = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#777">Mairie de Vernay-les-Eaux · Équipements sportifs</div>
<h2 style="font-size:21px;margin:8px 0 14px">Piscines de la commune</h2>
<p><b>Centre aquatique L’Onde</b><br><span data-obs="onde">Zone commerciale nord, au bord de la rocade. Ouvert tous les soirs jusqu’à 22 h. Grand toboggan extérieur.</span></p>
<p><b>Piscine Jean-Bouin</b><br><span data-obs="bouin-eglise">Rue de l’Église, au pied du clocher Saint-Martin.</span> <span data-obs="bouin-ferme">Fermée depuis 2024 (travaux suspendus). Toboggan extérieur, locaux techniques au sous-sol.</span></p>
<p><b>Piscine du lycée Albert-Camus</b><br><span data-obs="camus">Face à la gare. Bassin couvert, sans toboggan. Ouverte aux scolaires en journée.</span></p>
</div>`;

const AVIS = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
<div style="background:#b3261e;color:#fff;font-weight:800;letter-spacing:.12em;padding:8px;margin-bottom:14px">DISPARITION INQUIÉTANTE</div>
<img src="${DIR}/lea-portrait.jpg" alt="Photo de Léa Garnier, souriante, en veste en jean." style="width:160px;height:213px;object-fit:cover;border-radius:4px;margin:0 auto 12px;display:block"/>
<h2 style="font-size:24px;margin:0 0 4px">Léa GARNIER</h2>
<div style="color:#666;margin-bottom:14px">24 ans · 1,65 m · cheveux châtains · veste en jean</div>
<p style="text-align:left">Vue pour la dernière fois à la sortie d’un bar du centre-ville de Vernay-les-Eaux. Son téléphone a cessé d’émettre dans la nuit.</p>
<p style="color:#666;font-size:13px">Tout renseignement : gendarmerie de Vernay-les-Eaux · 17</p>
</div>`;

export const douzePourcent: CaseDefinition = {
  id: 'douze-pourcent',
  title: '12 %',
  client: 'coord',
  locked: true,
  about: { duration: '~15 min', tone: 'Thriller · en temps réel' },
  characters: [
    { id: 'coord', name: 'Coordination Paraline', initials: 'P', color: '#6b4f22', role: 'Réseau Paraline' },
    { id: 'lea', name: 'Léa', initials: 'L', color: '#7a4a5a', role: 'Numéro inconnu' },
    { id: 'gend', name: 'Gendarmerie de Vernay', initials: 'G', color: '#2f4a6b', role: 'Brigade de nuit' },
    { id: 'hugo', name: 'Hugo', initials: 'H', color: '#4a5a4a', role: 'Numéro inconnu' },
    { id: 'camille', name: 'Camille', initials: 'C', color: '#5a5a7a', role: 'Sœur de Léa' },
  ],

  media: [
    {
      id: 'piece',
      kind: 'image',
      name: 'IMG_2231.jpg',
      sizeLabel: '1,9 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/piece.jpg`,
          ...IMG,
          maxZoom: 6,
          alt: 'Photo au flash dans le noir : un petit local carrelé de bleu, de gros tuyaux et des vannes le long du mur. Sur le gros tuyau du milieu, peint au pochoir : B-14. En haut à droite, un soupirail grillagé au ras du plafond. De l’eau au sol.',
          info: [
            { label: 'Date', value: 'Aujourd’hui' },
            { label: 'Appareil', value: 'Téléphone de Léa' },
            { label: 'Lieu', value: 'Inconnu (localisation désactivée)' },
          ],
          hotspots: [
            { id: 'p-soupirail', x: 0.68, y: 0.05, w: 0.26, h: 0.09, observationId: 'soupirail' },
            { id: 'p-b14', x: 0.3, y: 0.34, w: 0.18, h: 0.08, observationId: 'b14' },
            { id: 'p-carrelage', x: 0.6, y: 0.2, w: 0.3, h: 0.18, observationId: 'carrelage' },
          ],
        },
      },
    },
    {
      id: 'porte',
      kind: 'image',
      name: 'IMG_2232.jpg',
      sizeLabel: '1,7 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/porte.jpg`,
          ...IMG,
          maxZoom: 6,
          alt: 'Une porte métallique grise, au flash. À hauteur d’yeux, un vieil autocollant : « Ville de Vernay-les-Eaux · Service des sports · Local technique ». Pas de poignée de ce côté.',
          hotspots: [{ id: 'po-autocollant', x: 0.29, y: 0.38, w: 0.4, h: 0.18, observationId: 'mairie' }],
        },
      },
    },
    {
      id: 'dehors',
      kind: 'image',
      name: 'IMG_2233.jpg',
      sizeLabel: '1,4 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/dehors.jpg`,
          ...IMG,
          maxZoom: 6,
          alt: 'À travers une grille, au ras du sol, la nuit : un parking désert et mouillé. À gauche, sous un lampadaire orange, la structure d’un grand toboggan. Tout au fond à droite, un petit clocher d’église éclairé.',
          hotspots: [
            { id: 'd-toboggan', x: 0, y: 0.33, w: 0.32, h: 0.17, observationId: 'toboggan' },
            { id: 'd-clocher', x: 0.79, y: 0.34, w: 0.11, h: 0.12, observationId: 'clocher' },
          ],
        },
      },
    },
    {
      id: 'vocal',
      kind: 'audio',
      name: 'Message vocal de Léa',
      sizeLabel: 'Message vocal',
      durationLabel: '00:15',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/lea-vocal.mp3`,
          // Horaires calés sur l'enregistrement généré (15 s).
          cues: [
            { start: 0.2, end: 2.8, text: 'Je sais pas si tu m’entends… je chuchote.' },
            { start: 2.8, end: 5.2, text: 'Il y a rien. Juste de l’eau qui goutte.', observationId: 'silence' },
            { start: 5.3, end: 9.7, text: '[des cloches sonnent, tout près]', observationId: 'cloches' },
            { start: 9.8, end: 13.8, text: 'Tu entends ? Des cloches. C’est juste au-dessus de moi.' },
          ],
        },
      },
    },
    { id: 'plan', kind: 'document', name: 'piscines_vernay', sizeLabel: 'Mairie', defaultVariant: 'doc', variants: { doc: { src: '', html: PLAN } } },
    { id: 'avis', kind: 'document', name: 'avis_recherche_garnier', sizeLabel: 'Affiche', defaultVariant: 'doc', variants: { doc: { src: '', html: AVIS } } },
    {
      id: 'hopital',
      kind: 'image',
      name: 'IMG_0412.jpg',
      sizeLabel: '1,2 Mo',
      defaultVariant: 'v',
      variants: {
        v: {
          src: `${DIR}/hopital.jpg`,
          ...IMG,
          alt: 'Une chambre d’hôpital au petit matin. Une main avec un bracelet d’hôpital dépasse d’une couverture de survie dorée et fait un pouce levé.',
        },
      },
    },
  ],

  initialMail: {
    id: 'dp-mail',
    from: 'coord',
    subject: 'Permanence de nuit',
    timeLabel: '23:41',
    preview: 'Ce soir, la ligne d’écoute du réseau est redirigée vers votre téléphone.',
    body: [
      'Bonsoir,',
      'Ce soir, vous assurez la permanence. Les messages envoyés à l’ancienne ligne d’écoute du réseau arrivent sur votre téléphone.',
      'Il ne se passe presque jamais rien. Si quelqu’un écrit, répondez.',
      '⏱ Enquête en temps réel : une fois la permanence prise, les choses avancent même si vous ne faites rien.',
      'La coordination',
    ],
  },

  threads: [
    { id: 't-lea', contact: 'lea', presence: { online: allumee, offlineLabel: 'Injoignable', endedWhen: flag('off'), endedLabel: 'Injoignable' } },
    { id: 't-gend', contact: 'gend' },
    { id: 't-hugo', contact: 'hugo', presence: { online: { not: fin() }, offlineLabel: 'Numéro non attribué', endedWhen: { any: [flag('hugo-demasque'), fin()] }, endedLabel: 'Numéro non attribué' } },
    { id: 't-camille', contact: 'camille' },
  ],

  messages: [
    /* Léa */
    { id: 'l-1', threadId: 't-lea', from: 'lea', text: 'Camille c’est moi, Léa' },
    { id: 'l-2', threadId: 't-lea', from: 'lea', text: 'Je sais pas où je suis. Il m’a enfermée.' },
    { id: 'l-3', threadId: 't-lea', from: 'lea', text: 'J’ai presque plus de batterie. Réponds stp' },
    { id: 'l-soeur1', threadId: 't-lea', from: 'lea', text: 'Non… j’ai tapé son numéro de mémoire.' },
    { id: 'l-soeur2', threadId: 't-lea', from: 'lea', text: 'Camille c’est ma sœur. C’est la seule famille qui me reste.' },
    { id: 'l-soeur3', threadId: 't-lea', from: 'lea', text: 'Peu importe. Aidez-moi. Appelez quelqu’un.' },
    { id: 'l-bless1', threadId: 't-lea', from: 'lea', text: 'Non. J’ai mal à la tête. Je me suis réveillée ici.' },
    { id: 'l-bless2', threadId: 't-lea', from: 'lea', text: 'Un type m’a parlé à la sortie du bar. Après, plus rien.' },
    { id: 'l-noir1', threadId: 't-lea', from: 'lea', text: 'Presque rien. C’est carrelé. Ça sent le chlore, comme une piscine.' },
    { id: 'l-noir2', threadId: 't-lea', from: 'lea', text: 'Il fait froid. Tout est éteint. Aucun bruit.' },
    { id: 'l-photo', threadId: 't-lea', from: 'lea', text: 'Voilà. C’est tout ce que je vois.' },
    { id: 'l-photo-pj', threadId: 't-lea', from: 'lea', attachments: ['piece'], notify: false },
    { id: 'l-porte', threadId: 't-lea', from: 'lea', attachments: ['porte'], notify: 'Photo' },
    { id: 'l-porte2', threadId: 't-lea', from: 'lea', text: 'Pas de poignée. Fermée de l’autre côté.' },
    { id: 'l-monte', threadId: 't-lea', from: 'lea', text: 'Attends. Je monte sur un tuyau.' },
    { id: 'l-dehors', threadId: 't-lea', from: 'lea', attachments: ['dehors'], notify: 'Photo' },
    { id: 'l-vocal', threadId: 't-lea', from: 'lea', attachments: ['vocal'], notify: 'Message vocal' },
    { id: 'l-hugo1', threadId: 't-lea', from: 'lea', text: 'Non !! J’ai pas de frère.' },
    { id: 'l-hugo2', threadId: 't-lea', from: 'lea', text: 'Hugo c’est LUI. C’est le prénom qu’il m’a donné au bar. Ne lui dites rien.' },
    { id: 'l-tenir', threadId: 't-lea', from: 'lea', text: 'D’accord. Je reste près de la porte. J’éteins l’écran.' },
    { id: 'l-1pc-a', threadId: 't-lea', from: 'lea', text: '1 %' },
    { id: 'l-1pc-b', threadId: 't-lea', from: 'lea', text: 'Il me reste un message. Qu’est-ce que je t’envoie ?' },
    { id: 'l-1pc-ok', threadId: 't-lea', from: 'lea', text: '1 %. Je les attends. Dites-leur de faire vite.' },
    { id: 'l-dernier', threadId: 't-lea', from: 'lea', text: 'Une serviette par terre. Brodé dessus : PISCINE J. BOUIN. Je' },
    { id: 'l-camille', threadId: 't-lea', from: 'lea', text: 'Dis à Camille que je l’aime. Que c’est pas sa faute, pour maman.' },
    { id: 'l-off', threadId: 't-lea', from: 'lea', text: 'Le téléphone de Léa s’est éteint.', system: true },
    { id: 'l-voix', threadId: 't-lea', from: 'lea', text: 'J’entends des voix en haut. Quelqu’un crie « Gendarmerie ! »' },
    { id: 'l-voix-vite', threadId: 't-lea', from: 'lea', text: 'J’entends des pas qui descendent. Quelqu’un crie « Gendarmerie ! »' },
    { id: 'l-ouvre', threadId: 't-lea', from: 'lea', text: 'Quelqu’un ouvre le cadenas.' },
    { id: 'l-lui', threadId: 't-lea', from: 'lea', text: 'C’est lui.' },

    /* Gendarmerie */
    { id: 'g-1', threadId: 't-gend', from: 'gend', text: 'Gendarmerie de Vernay-les-Eaux, brigade de nuit. Nous avons votre signalement.' },
    { id: 'g-2', threadId: 't-gend', from: 'gend', text: 'Il nous faut un lieu précis. Nous ne pouvons pas fouiller toute la ville.' },
    { id: 'g-3', threadId: 't-gend', from: 'gend', text: 'Du chlore, dites-vous ? Il y a trois piscines sur la commune.' },
    { id: 'g-4', threadId: 't-gend', from: 'gend', attachments: ['plan'], notify: false },
    { id: 'g-onde', threadId: 't-gend', from: 'gend', text: 'Une patrouille est passée à L’Onde. Ouvert, du monde, rien d’anormal.' },
    { id: 'g-camus', threadId: 't-gend', from: 'gend', text: 'Le gardien du lycée a ouvert le bassin. Personne.' },
    { id: 'g-ok', threadId: 't-gend', from: 'gend', text: 'Jean-Bouin, fermée depuis deux ans… Ça colle. Une équipe part. Quelques minutes.' },
    { id: 'g-b14', threadId: 't-gend', from: 'gend', text: 'Bien reçu. On descend directement au sous-sol.' },
    { id: 'g-h', threadId: 't-gend', from: 'gend', text: 'Merci. On cherche à localiser ce numéro.' },
    { id: 'g-trouvee', threadId: 't-gend', from: 'gend', text: 'On l’a trouvée. Local technique, au sous-sol. Elle est vivante.' },
    { id: 'g-trouvee-vite', threadId: 't-gend', from: 'gend', text: 'On l’a trouvée, dans le local B-14. Elle est vivante.' },
    { id: 'g-trouvee-matin', threadId: 't-gend', from: 'gend', text: 'On l’a trouvée au petit matin, au sous-sol de Jean-Bouin. Hypothermie, mais vivante.' },
    { id: 'g-vide', threadId: 't-gend', from: 'gend', text: 'Nous sommes arrivés à Jean-Bouin. Le local était vide. Le cadenas posé par terre.' },
    { id: 'g-avis', threadId: 't-gend', from: 'gend', text: 'Un avis de recherche a été diffusé ce matin.' },
    { id: 'g-avis-pj', threadId: 't-gend', from: 'gend', attachments: ['avis'], notify: false },

    /* « Hugo » */
    { id: 'h-1', threadId: 't-hugo', from: 'hugo', text: 'Bonsoir. Je suis Hugo, le frère de Léa.' },
    { id: 'h-2', threadId: 't-hugo', from: 'hugo', text: 'Elle m’a envoyé votre numéro juste avant que ça coupe. Elle vous a dit où elle était ?' },
    { id: 'h-3', threadId: 't-hugo', from: 'hugo', text: 'Je vous en prie. Chaque minute compte. Je peux y être tout de suite.' },
    { id: 'h-c1', threadId: 't-hugo', from: 'hugo', text: 'Je vous l’ai dit. Elle me l’a envoyé.' },
    { id: 'h-c2', threadId: 't-hugo', from: 'hugo', text: 'On perd du temps. Où est ma sœur ?' },
    { id: 'h-merci', threadId: 't-hugo', from: 'hugo', text: 'Merci. J’y vais.' },
    { id: 'h-fin', threadId: 't-hugo', from: 'hugo', text: 'Merci pour votre aide.' },
    { id: 'h-a1', threadId: 't-hugo', from: 'hugo', text: '…' },
    { id: 'h-a2', threadId: 't-hugo', from: 'hugo', text: 'Vous auriez dû rester en dehors de ça.' },

    /* Camille */
    { id: 'c-0', threadId: 't-camille', from: 'camille', text: 'Numéro de Camille : celui que Léa voulait écrire, à un chiffre près.', system: true },
    { id: 'c-1', threadId: 't-camille', from: 'camille', text: 'Qui êtes-vous ? Où est-elle ??' },
    { id: 'c-2', threadId: 't-camille', from: 'camille', text: 'Une piscine… Petites, on se cachait au sous-sol de Jean-Bouin. Elle connaît l’endroit par cœur.' },
    { id: 'c-3', threadId: 't-camille', from: 'camille', text: 'J’y vais.' },
    { id: 'c-4', threadId: 't-camille', from: 'camille', text: 'Camille n’a plus écrit.', system: true },
    { id: 'c-e0', threadId: 't-camille', from: 'camille', text: 'Le lendemain, 08:12', system: true },
    { id: 'c-e1', threadId: 't-camille', from: 'camille', text: 'Bonjour. C’est Camille, la sœur de Léa. Elle m’a donné votre numéro.' },
    { id: 'c-e2', threadId: 't-camille', from: 'camille', text: 'Elle va bien. Elle voulait que vous sachiez.' },
    { id: 'c-e3', threadId: 't-camille', from: 'camille', attachments: ['hopital'], notify: false },
  ],

  replies: [
    /* Léa : chaque réponse de sa part lui coûte de la batterie. */
    { id: 'r-qui', threadId: 't-lea', label: 'Je ne suis pas Camille. Vous vous êtes trompée de numéro.', available: lea(recu('l-3')), effects: [cout(1), ...say(['l-soeur1', 2500], ['l-soeur2', 2500], ['l-soeur3', 2000])] },
    { id: 'r-blesse', threadId: 't-lea', label: 'Je suis là. Vous êtes blessée ?', available: lea(recu('l-3')), effects: [cout(1), ...say(['l-bless1', 3000], ['l-bless2', 3000])] },
    {
      id: 'r-gend',
      threadId: 't-lea',
      label: 'Je préviens les gendarmes. Que voyez-vous autour de vous ?',
      available: lea(recu('l-3')),
      effects: [cout(1), ...say(['l-noir1', 3000], ['l-noir2', 2500]), { type: 'deliverMessage', messageId: 'g-1', delayMs: 4000 }, { type: 'deliverMessage', messageId: 'g-2', delayMs: 7000 }],
    },
    { id: 'r-photo', threadId: 't-lea', label: 'Prenez une photo de la pièce, avec le flash.', available: lea(recu('l-noir1')), effects: [cout(2), ...say(['l-photo', 3500], ['l-photo-pj', 1500])] },
    { id: 'r-porte', threadId: 't-lea', label: 'Et la porte ? Photographiez-la.', available: lea({ mediaViewed: 'piece' }), effects: [cout(2), ...say(['l-porte', 3500], ['l-porte2', 2000])] },
    {
      id: 'r-soupirail',
      threadId: 't-lea',
      label: 'Le soupirail en haut : montez et photographiez dehors.',
      available: lea({ observationFound: 'soupirail' }),
      effects: [cout(2), ...say(['l-monte', 2500], ['l-dehors', 5000])],
    },
    { id: 'r-vocal', threadId: 't-lea', label: 'Envoyez-moi un message vocal. Je veux entendre ce qu’il y a autour.', available: lea(recu('l-photo')), effects: [cout(3), ...say(['l-vocal', 6000])] },
    { id: 'r-hugo', threadId: 't-lea', label: 'Vous avez un frère, Hugo ?', available: lea(recu('h-1')), effects: [cout(1), ...say(['l-hugo1', 2000], ['l-hugo2', 2500])] },
    { id: 'r-tenir', threadId: 't-lea', label: 'Les gendarmes arrivent. Économisez votre batterie.', available: lea(lieuOk), effects: [cout(1), ...say(['l-tenir', 2500]), { type: 'setFlag', name: 'econome', value: true }] },
    // 1 % : un seul message.
    {
      id: 'r-dernier',
      threadId: 't-lea',
      label: 'Dites-moi ce que vous voyez. N’importe quoi.',
      available: { all: [allumee, recu('l-1pc-b')] },
      effects: [...say(['l-dernier', 4000], ['l-off', 1500]), { type: 'setFlag', name: 'dernier', value: true }],
    },
    {
      id: 'r-camille',
      threadId: 't-lea',
      label: 'Écrivez à votre sœur. Je lui transmettrai.',
      available: { all: [allumee, recu('l-1pc-b')] },
      effects: [...say(['l-camille', 4500], ['l-off', 1500]), { type: 'setFlag', name: 'pour-camille', value: true }],
    },

    /* Gendarmerie : le lieu. */
    { id: 'g-r-onde', threadId: 't-gend', label: 'Le centre aquatique L’Onde.', available: { all: [recu('g-4'), { not: lieuOk }] }, effects: [later('g-onde', 30000)] },
    { id: 'g-r-camus', threadId: 't-gend', label: 'La piscine du lycée Camus.', available: { all: [recu('g-4'), { not: lieuOk }] }, effects: [later('g-camus', 30000)] },
    {
      id: 'g-r-bouin',
      threadId: 't-gend',
      label: 'La piscine Jean-Bouin, rue de l’Église.',
      available: { all: [{ any: [recu('g-4'), recu('l-dernier'), recu('c-2')] }, preuveBouin, { not: lieuOk }] },
      effects: [{ type: 'setFlag', name: 'lieu', value: 'ok' }, ...say(['g-ok', 3000])],
    },
    { id: 'g-r-b14', threadId: 't-gend', label: 'Au sous-sol : le local technique B-14.', available: { all: [lieuOk, { observationFound: 'b14' }] }, effects: [{ type: 'setFlag', name: 'rapide', value: true }, ...say(['g-b14', 2500])] },
    {
      id: 'g-r-hugo',
      threadId: 't-gend',
      label: 'Un homme se fait passer pour son frère et me demande où elle est. Voici son numéro.',
      available: flag('hugo-demasque'),
      effects: [{ type: 'setFlag', name: 'hugo-signale', value: true }, ...say(['g-h', 3000])],
    },

    /* « Hugo » */
    { id: 'h-r-comment', threadId: 't-hugo', label: 'Comment avez-vous eu ce numéro ?', available: { all: [recu('h-2'), { not: fin() }] }, effects: say(['h-c1', 2000], ['h-c2', 2500]) },
    {
      id: 'h-r-donner',
      threadId: 't-hugo',
      label: 'Elle est à la piscine Jean-Bouin.',
      available: { all: [recu('h-2'), preuveBouin, { not: flag('hugo-demasque') }, { not: fin() }] },
      effects: [{ type: 'setFlag', name: 'hugo-sait', value: true }, ...say(['h-merci', 2000])],
    },
    {
      id: 'h-r-accuse',
      threadId: 't-hugo',
      label: 'Léa n’a pas de frère. Qui êtes-vous ?',
      available: { all: [recu('h-2'), { any: [recu('l-soeur2'), recu('l-hugo1')] }, { not: flag('hugo-sait') }, { not: fin() }] },
      effects: [...say(['h-a1', 3000], ['h-a2', 3000]), { type: 'setFlag', name: 'hugo-demasque', value: true }],
    },

    /* Camille (fin « 1 % ») */
    {
      id: 'c-r-transmettre',
      threadId: 't-camille',
      label: 'Léa m’a écrit par erreur. Elle est enfermée. Elle dit : « Je t’aime. Ce n’est pas ta faute, pour maman. » Ça sentait le chlore, comme une piscine.',
      available: recu('c-0'),
      effects: say(['c-1', 3000], ['c-2', 5000], ['c-3', 3000]),
    },
  ],

  observations: [
    { id: 'carrelage', title: 'Des murs carrelés de bleu, comme autour d’un bassin.', mediaId: 'piece', autoFile: true, actions: [] },
    { id: 'soupirail', title: 'En haut, un soupirail grillagé : la pièce est en sous-sol.', mediaId: 'piece', autoFile: true, actions: [{ type: 'ask', replyId: 'r-soupirail', label: 'Demander à Léa' }] },
    { id: 'b14', title: 'Sur un tuyau, au pochoir : B-14. Le numéro du local ?', mediaId: 'piece', autoFile: true, actions: [{ type: 'ask', replyId: 'g-r-b14', label: 'Le dire aux gendarmes' }] },
    { id: 'mairie', title: '« Ville de Vernay-les-Eaux · Service des sports » : un bâtiment municipal.', mediaId: 'porte', autoFile: true, actions: [] },
    { id: 'toboggan', title: 'Un grand toboggan, tout près : la piscine a un toboggan extérieur.', mediaId: 'dehors', autoFile: true, actions: [] },
    { id: 'clocher', title: 'Juste derrière, un clocher d’église.', mediaId: 'dehors', autoFile: true, actions: [] },
    { id: 'silence', title: 'Aucun bruit autour d’elle : l’endroit est fermé.', mediaId: 'vocal', autoFile: true, actions: [] },
    { id: 'cloches', title: 'Des cloches d’église, juste au-dessus d’elle.', mediaId: 'vocal', autoFile: true, actions: [] },
    { id: 'onde', title: 'L’Onde : ouverte jusqu’à 22 h, au bord de la rocade.', mediaId: 'plan', autoFile: true, actions: [] },
    { id: 'bouin-eglise', title: 'Jean-Bouin : au pied du clocher Saint-Martin.', mediaId: 'plan', autoFile: true, actions: [] },
    { id: 'bouin-ferme', title: 'Jean-Bouin : fermée depuis 2024, toboggan extérieur, locaux au sous-sol.', mediaId: 'plan', autoFile: true, actions: [] },
    { id: 'camus', title: 'Lycée Camus : bassin couvert, sans toboggan.', mediaId: 'plan', autoFile: true, actions: [] },
  ],

  steps: [{ id: 'lea', objective: 'Où est Léa ? Trouvez-la avant que son téléphone s’éteigne.' }],

  obstacles: [
    {
      id: 'repondre',
      solved: { replySent: 'r-gend' },
      hints: ['Quelqu’un a besoin d’aide, maintenant.', 'Léa ne sait pas où elle est. Prévenez quelqu’un.', 'Répondez à Léa : « Je préviens les gendarmes. Que voyez-vous autour de vous ? »'],
    },
    {
      id: 'lieu',
      solved: { any: [lieuOk, fin()] },
      hints: [
        'Chaque demande lui coûte de la batterie. Que peut-elle vous montrer d’utile ?',
        'Une photo de la pièce, puis de ce qu’on voit par le soupirail. Comparez avec la liste des piscines envoyée par les gendarmes.',
        'Le toboggan et le clocher : c’est la piscine Jean-Bouin, rue de l’Église. Dites-le aux gendarmes.',
      ],
    },
    {
      id: 'hugo',
      solved: { any: [flag('hugo-demasque'), flag('secours'), fin()] },
      hints: ['Tout le monde ne dit pas la vérité.', 'Relisez ce que Léa a dit de sa famille.', 'Léa n’a pas de frère : ne dites rien à « Hugo ».'],
    },
    {
      id: 'attendre',
      solved: { any: [flag('secours'), fin()] },
      hints: ['Les secours sont en route.', 'Vous pouvez les aider à aller plus vite.', 'Donnez aux gendarmes le numéro du local, B-14, peint sur un tuyau.'],
    },
  ],

  // 1 cran toutes les 50 s tant que Léa attend.
  battery: { flag: 'batterie', threadId: 't-lea', everyMs: 50000, floor: 1, while: { all: [recu('l-1'), allumee, { not: flag('secours') }, { not: flag('econome') }, { not: fin() }] } },

  rules: [
    {
      id: 'ouverture',
      when: { caseAccepted: true },
      effects: [{ type: 'setFlag', name: 'batterie', value: 12 }, ...say(['l-1', 2500], ['l-2', 2000], ['l-3', 2500])],
    },
    { id: 'piscines', when: { all: [recu('l-noir1'), recu('g-2')] }, effects: say(['g-3', 4000], ['g-4', 1500]) },
    { id: 'hugo-arrive', when: recu('l-noir2'), effects: [later('h-1', 35000, { not: flag('secours') }), later('h-2', 39000, { not: flag('secours') })] },
    { id: 'hugo-insiste', when: recu('h-2'), effects: [later('h-3', 60000, { not: { any: [flag('hugo-sait'), flag('hugo-demasque'), flag('secours'), fin()] } })] },

    /* 1 % */
    { id: 'un-pourcent', when: { all: [unPourcent, allumee, { not: lieuOk }] }, effects: say(['l-1pc-a', 1500], ['l-1pc-b', 2000]) },
    { id: 'un-pourcent-ok', when: { all: [unPourcent, allumee, lieuOk, { not: recu('l-1pc-a') }] }, effects: say(['l-1pc-ok', 1500]) },
    { id: 'eteint', when: recu('l-off'), effects: [{ type: 'setFlag', name: 'off', value: true }, { type: 'setFlag', name: 'batterie', value: 0 }] },
    { id: 'camille-numero', when: { all: [recu('l-off'), flag('pour-camille')] }, effects: say(['c-0', 3000]) },

    /* Secours */
    // Deux arrivées possibles (identifiants distincts : un message déjà programmé n'est jamais reprogrammé) ; la première l'emporte.
    { id: 'secours', when: lieuOk, effects: [later('l-voix', 75000, { all: [allumee, { not: recu('l-voix-vite') }, { not: fin() }] }), later('g-trouvee', 90000, { all: [allumee, { not: flag('secours') }, { not: fin() }] })] },
    { id: 'secours-rapide', when: { all: [lieuOk, flag('rapide')] }, effects: [later('l-voix-vite', 20000, { all: [allumee, { not: recu('l-voix') }, { not: fin() }] }), later('g-trouvee-vite', 30000, { all: [allumee, { not: flag('secours') }, { not: fin() }] })] },
    { id: 'secours-tard', when: { all: [lieuOk, flag('off')] }, effects: [later('g-trouvee-matin', 25000, { all: [{ not: flag('secours') }, { not: fin() }] })] },
    { id: 'trouvee', when: { any: [recu('g-trouvee'), recu('g-trouvee-vite')] }, effects: [{ type: 'setFlag', name: 'secours', value: true }, { type: 'setFlag', name: 'fin', value: 'retrouvee' }] },
    { id: 'trouvee-tard', when: recu('g-trouvee-matin'), effects: [{ type: 'setFlag', name: 'secours', value: true }, { type: 'setFlag', name: 'fin', value: 'matin' }] },
    { id: 'epilogue', when: flag('secours'), effects: say(['c-e0', 12000], ['c-e1', 3000], ['c-e2', 3500], ['c-e3', 2000]) },
    { id: 'fin-retrouvee', when: recu('c-e3'), effects: [{ type: 'log', text: 'Léa a été retrouvée vivante.' }, { type: 'solveCase' }] },

    /* Hugo savait */
    { id: 'hugo-y-va', when: flag('hugo-sait'), effects: [later('h-fin', 30000, { not: flag('secours') })] },
    {
      id: 'hugo-arrive-avant',
      when: recu('h-fin'),
      effects: [{ type: 'setFlag', name: 'fin', value: 'hugo' }],
    },
    // Si son téléphone est encore allumé, elle a le temps d'écrire.
    { id: 'hugo-porte', when: { all: [recu('h-fin'), allumee] }, effects: say(['l-ouvre', 2000], ['l-lui', 2500], ['l-off', 3000]) },
    { id: 'hugo-vide', when: { all: [recu('h-fin'), lieuOk] }, effects: [later('g-vide', 12000)] },
    { id: 'hugo-avis', when: recu('h-fin'), effects: [later('g-avis', 25000), later('g-avis-pj', 26500)] },
    { id: 'fin-hugo', when: recu('g-avis-pj'), effects: [{ type: 'log', text: 'Léa a disparu.' }, { type: 'solveCase' }] },

    /* Un dernier message : Camille y va seule. */
    { id: 'camille-seule', when: recu('c-3'), effects: [later('c-4', 90000, { not: lieuOk })] },
    { id: 'fin-message', when: recu('c-4'), effects: [{ type: 'setFlag', name: 'fin', value: 'message' }, { type: 'log', text: 'Camille est partie seule.' }, { type: 'solveCase' }] },
  ],

  conclusion: { title: 'Fin de permanence', text: ['Léa Garnier a écrit au mauvais numéro. C’était le vôtre.'] },
  endings: [
    {
      when: fin('hugo'),
      title: 'Il est arrivé avant',
      text: [
        'Léa Garnier était enfermée au sous-sol de la piscine Jean-Bouin. « Hugo » n’était pas son frère : Léa n’avait que sa sœur, Camille. Il voulait savoir ce qu’elle vous avait dit.',
        'Vous lui avez donné l’adresse. Il est arrivé le premier. Léa est toujours recherchée.',
      ],
    },
    {
      when: fin('message'),
      title: 'Un dernier message',
      text: [
        'À 1 %, Léa a choisi d’écrire à sa sœur. Vous avez transmis. Camille a compris tout de suite : le sous-sol de Jean-Bouin, leur cachette d’enfance.',
        'Elle y est partie seule. Elle n’a plus écrit.',
      ],
    },
    {
      when: { all: [fin('matin'), flag('pour-camille')] },
      title: 'Au petit matin',
      text: [
        'À 1 %, Léa a choisi d’écrire à sa sœur. Grâce à Camille et à leur cachette d’enfance, vous avez pu envoyer les gendarmes à Jean-Bouin.',
        'Ils l’ont trouvée au matin, transie, mais vivante.',
      ],
    },
    {
      when: fin('matin'),
      title: 'Au petit matin',
      text: [
        'Son dernier pour cent a servi à vous décrire une serviette brodée : PISCINE J. BOUIN. Les gendarmes l’ont trouvée au matin, transie, mais vivante.',
        'Il s’en est fallu de peu.',
      ],
    },
    {
      when: { all: [fin('retrouvee'), flag('hugo-signale')] },
      title: 'Retrouvée',
      text: [
        'Léa Garnier était enfermée au sous-sol de la piscine Jean-Bouin. Vous avez trouvé le lieu avec presque rien : un toboggan, un clocher, des cloches.',
        'Vous avez aussi compris que « Hugo » mentait. Grâce à son numéro, les gendarmes l’ont interpellé dans la nuit.',
      ],
    },
    {
      when: fin('retrouvee'),
      title: 'Retrouvée',
      text: [
        'Léa Garnier était enfermée au sous-sol de la piscine Jean-Bouin. Vous avez trouvé le lieu avec presque rien : un toboggan, un clocher, des cloches.',
        'L’homme qui l’a enfermée court toujours. Mais elle est en vie.',
      ],
    },
  ],
};
