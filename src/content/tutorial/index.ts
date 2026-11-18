/**
 * Exercice de prise en main. Données isolées des enquêtes : elles ne passent
 * jamais par le registre `CASES` et n'apparaissent pas dans la liste des affaires.
 */
import type { MediaDef, TutorialStep } from '../../game/types';

export const TUTORIAL_MAIL = {
  id: 'tutorial-mail',
  from: 'Guide de prise en main',
  initials: 'G',
  subject: 'Votre première observation',
  timeLabel: 'Exemple',
  body: [
    'Voici une photographie d’exemple. Ouvrez-la et regardez le bureau : un tiroir est resté entrouvert. Touchez ce détail pour relever une observation.',
  ],
};

export const TUTORIAL_OBSERVATION = {
  id: 'tutorial-drawer',
  title: 'Le tiroir est entrouvert.',
  description: 'Un détail relevé sur la photographie d’exemple.',
};

export const TUTORIAL_MEDIA: MediaDef = {
  id: 'tutorial-desk',
  kind: 'image',
  name: 'bureau.jpg',
  sizeLabel: '1,2 Mo',
  defaultVariant: 'default',
  variants: {
    default: {
      src: '/media/tutorial/bureau.svg',
      width: 800,
      height: 600,
      hotspots: [{ id: 'drawer', x: 0.585, y: 0.715, w: 0.285, h: 0.17, observationId: TUTORIAL_OBSERVATION.id }],
    },
  },
};

export const TUTORIAL_FOLDER_TITLE = 'Exercice de prise en main';

export const TUTORIAL_END =
  'Vous savez maintenant examiner une pièce jointe et conserver une observation. Dans les enquêtes, vos découvertes pourront débloquer des questions et des actions.';

/** Texte du guide selon l'étape et l'écran affiché. */
export function coachText(step: TutorialStep, ctx: { app: string | null; viewerOpen: boolean; inMail: boolean; inFolder: boolean }): string {
  const home = 'Revenez à l’accueil avec la barre en bas de l’écran';
  switch (step) {
    case 'openMail':
      return ctx.app === null || ctx.app === 'mail' ? 'Ouvrez l’application Mail.' : `${home}, puis ouvrez Mail.`;
    case 'openMessage':
      if (ctx.app === 'mail') return 'Ouvrez le message « Votre première observation ».';
      return ctx.app === null ? 'Ouvrez Mail, puis le message « Votre première observation ».' : `${home}, puis ouvrez Mail.`;
    case 'openAttachment':
      if (ctx.viewerOpen) return 'Regardez le bureau.';
      return ctx.inMail ? 'Touchez la photo jointe pour l’ouvrir.' : 'Ouvrez le message du guide dans Mail, puis sa photo.';
    case 'findDetail':
      return ctx.viewerOpen
        ? 'Touchez le tiroir entrouvert. Vous pouvez agrandir avec deux doigts ou le bouton +.'
        : 'Rouvrez la photo jointe au message du guide.';
    case 'fileObservation':
      return ctx.viewerOpen ? 'Touchez « Ajouter au dossier ».' : 'Rouvrez la photo et touchez le tiroir pour l’ajouter au dossier.';
    case 'openFiles':
      if (ctx.app === 'files') return ctx.inFolder ? 'Votre observation est rangée ici.' : `Ouvrez « ${TUTORIAL_FOLDER_TITLE} ».`;
      return ctx.app === null ? 'Ouvrez Dossiers.' : `${home}, puis ouvrez Dossiers.`;
    case 'finish':
      return 'Touchez « Terminer l’exercice » en bas du dossier.';
  }
}
