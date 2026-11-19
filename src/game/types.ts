/**
 * Format de données des enquêtes Paraline.
 *
 * Une enquête = un objet `CaseDefinition` (contenu figé, écrit à la main)
 * La progression du joueur = un objet `CaseProgress` (sauvegardé).
 *
 * Tous les identifiants doivent être stables (ne jamais les renommer après
 * publication, la sauvegarde les référence) et uniques dans l'enquête.
 */

export type Id = string;

/* ------------------------------------------------------------------ */
/* Contenu                                                              */
/* ------------------------------------------------------------------ */

export interface Character {
  id: Id;
  name: string;
  /** Une ou deux lettres pour l'avatar. */
  initials: string;
  /** Couleur d'avatar (CSS). */
  color?: string;
  /** Sous-titre affiché dans Messages, ex. « Cliente ». */
  role?: string;
}

/** Zone d'intérêt dans une image, en coordonnées relatives (0 → 1). */
export interface Hotspot {
  id: Id;
  x: number;
  y: number;
  w: number;
  h: number;
  observationId: Id;
  /** Variantes de l'image dans lesquelles la zone existe (toutes si absent). */
  variants?: Id[];
  /** Vidéo uniquement : intervalle (secondes) pendant lequel la zone est active. */
  from?: number;
  to?: number;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface MediaVariant {
  /** Chemin public de l'asset (ex. `/media/cases/x/photo.jpg`). Jamais de base64. */
  src: string;
  /** Image affichée avant lecture (vidéo) ou miniature. */
  poster?: string;
  /** Dimensions naturelles (images, vidéos) pour garder les zones alignées. */
  width?: number;
  height?: number;
  /** Transcription (audio) ou sous-titres (vidéo). */
  cues?: SubtitleCue[];
  transcript?: string;
  /** Contenu HTML d'un document (contenu local de confiance). */
  html?: string;
  hotspots?: Hotspot[];
  /** Description accessible de cette variante (remplace le nom du fichier). */
  alt?: string;
  /** Zoom maximal autorisé (5 par défaut). */
  maxZoom?: number;
  /** Écriture vectorielle posée sur l'image, transformée avec elle (reste nette au zoom). */
  overlay?: ImageOverlay;
}

export interface ImageOverlay {
  /** Zone relative (0 → 1) couverte par le texte. */
  box: { x: number; y: number; w: number; h: number };
  /** Lignes affichées, dans un repère de 100 unités de large. */
  /** `width` : largeur imposée (unités du repère) pour tenir dans la feuille. */
  lines: { text: string; y: number; size: number; width?: number; strike?: boolean }[];
  /** Hauteur du repère (largeur = 100). */
  viewHeight: number;
  /** `unstable` : l'écriture se recompose sans jamais devenir lisible. */
  mode: 'stable' | 'unstable';
  rotate?: number;
}

export type MediaKind = 'image' | 'audio' | 'video' | 'document';

export interface MediaDef {
  id: Id;
  kind: MediaKind;
  /** Nom de fichier affiché, ex. `alerte_0317.mp4`. */
  name: string;
  /** Libellé de taille, ex. « 14 Mo ». */
  sizeLabel?: string;
  /** Durée affichée (audio/vidéo), ex. « 00:14 ». */
  durationLabel?: string;
  defaultVariant: Id;
  variants: Record<Id, MediaVariant>;
  /** Le joueur peut enregistrer une copie figée. */
  allowSaveCopy?: boolean;
  /** Propose une comparaison avec un autre média. */
  compareWith?: Id;
}

export interface MailDef {
  id: Id;
  from: Id;
  subject: string;
  /** Libellé de date/heure fictif affiché, ex. « 22:14 » ou « Hier ». */
  timeLabel: string;
  /** Aperçu affiché dans la liste. Par défaut : premier paragraphe. */
  preview?: string;
  /** Paragraphes du corps. */
  body: string[];
  attachments?: Id[];
  /** Brouillon sans destinataire (épilogue). */
  draft?: boolean;
  /** Texte de notification à la livraison (sinon l'objet). */
  notify?: string;
}

export interface MessageDef {
  id: Id;
  threadId: Id;
  /** `player` ou id d'un personnage. */
  from: 'player' | Id;
  text?: string;
  attachments?: Id[];
  /** Texte de la notification ; `false` : aucune notification. */
  notify?: string | false;
}

export interface ReplyDef {
  id: Id;
  threadId: Id;
  /** Texte du bouton de choix. */
  label: string;
  /** Texte réellement envoyé (par défaut : `label`). */
  text?: string;
  /** Condition pour proposer cette réponse. Toujours proposée si absente. */
  available?: Condition;
  effects?: Effect[];
  /** Proposée uniquement une fois l'affaire résolue (épilogue). */
  whenSolved?: boolean;
}

export type ObservationAction =
  | { type: 'addToFile' }
  | { type: 'ask'; replyId: Id; label?: string }
  | { type: 'examine'; mediaId?: Id; zoom?: { x: number; y: number; scale: number }; label?: string };

export interface ObservationDef {
  id: Id;
  title: string;
  description?: string;
  /** Relevée directement dans le dossier dès sa découverte. */
  autoFile?: boolean;
  /** Média d'origine (pour la miniature et « revoir »). */
  mediaId?: Id;
  actions: ObservationAction[];
}

export interface StepDef {
  id: Id;
  /** Objectif formulé sans dévoiler l'énigme. */
  objective: string;
  /** Trois niveaux : rappel, piste, solution (facultatif si l'enquête définit `obstacles`). */
  hints?: [string, string, string];
}

/** Obstacle de l'aide : le premier non résolu détermine les indices proposés. */
export interface ObstacleDef {
  id: Id;
  solved: Condition;
  hints: [string, string, string];
}

export interface ThreadDef {
  id: Id;
  contact: Id;
  /** Horodatage affiché en tête de conversation. */
  stamp?: string;
  /** Joignabilité particulière du contact. */
  presence?: {
    online: Condition;
    offlineLabel: string;
    /** Conversation close : état affiché à la place. */
    endedWhen?: Condition;
    endedLabel?: string;
  };
  archivedWhen?: Condition;
}

export interface RuleDef {
  id: Id;
  when: Condition;
  effects: Effect[];
  /** `true` par défaut : la règle ne se déclenche qu'une seule fois, à vie. */
  once?: boolean;
}

export interface CaseDefinition {
  id: Id;
  title: string;
  /** Personnage client (id dans `characters`). */
  client: Id;
  characters: Character[];
  media: MediaDef[];
  initialMail: MailDef;
  followUpMails?: MailDef[];
  threads: ThreadDef[];
  messages: MessageDef[];
  replies: ReplyDef[];
  observations: ObservationDef[];
  steps: StepDef[];
  rules: RuleDef[];
  /** Messages présents dans les fils dès l'acceptation. */
  openingMessages?: Id[];
  obstacles?: ObstacleDef[];
  conclusion: { title: string; text: string[] };
}

/* ------------------------------------------------------------------ */
/* Conditions                                                           */
/* ------------------------------------------------------------------ */

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { caseAccepted: true }
  | { mailRead: Id }
  | { mediaViewed: Id }
  | { observationFound: Id }
  | { observationFiled: Id }
  | { replySent: Id }
  | { messageDelivered: Id }
  | { stepIs: Id }
  | { flag: string; equals?: FlagValue }
  /** Heure manuelle exacte, format `HH:MM` (mode automatique = faux). */
  | { manualTime: string }
  /** Date manuelle exacte, format `YYYY-MM-DD` (mode automatique = faux). */
  | { manualDate: string }
  | { airplane: boolean }
  /** Réglage automatique de la date et de l'heure. */
  | { clockAuto: boolean }
  /** Variante actuelle d'un média. */
  | { mediaVariant: Id; is: Id }
  | { ruleFired: Id };

export type FlagValue = boolean | number | string;

/* ------------------------------------------------------------------ */
/* Effets                                                               */
/* ------------------------------------------------------------------ */

export type PhoneOverrideKey = 'wallpaper' | 'homeMessage';

export type Effect =
  /** Message dans un fil. Suspendu en mode avion sauf `ignoreAirplane`. */
  /** `holdUntil` : la livraison attend aussi que cette condition soit vraie. */
  | { type: 'deliverMessage'; messageId: Id; delayMs?: number; ignoreAirplane?: boolean; holdUntil?: Condition }
  /** E-mail de suivi rattaché à l'affaire (ne crée jamais d'affaire). */
  | { type: 'deliverMail'; mailId: Id; delayMs?: number; ignoreAirplane?: boolean; holdUntil?: Condition }
  | { type: 'setMediaVariant'; mediaId: Id; variantId: Id }
  | { type: 'unlockReply'; replyId: Id }
  /** Rend un média disponible dans Photos et dans le dossier. */
  | { type: 'grantMedia'; mediaId: Id }
  | { type: 'setStep'; stepId: Id }
  | { type: 'setFlag'; name: string; value: FlagValue }
  /** Modification temporaire du téléphone, annulée quand `until` devient vraie,
   *  par `clearPhoneOverride`, ou à la fin de l'affaire. */
  | { type: 'phoneOverride'; key: PhoneOverrideKey; value: string; until?: Condition }
  | { type: 'clearPhoneOverride'; key: PhoneOverrideKey }
  | { type: 'notify'; title: string; body?: string; app?: AppId }
  | { type: 'log'; text: string }
  /** Altère les copies conservées d'un média (dénouement surnaturel uniquement). */
  | { type: 'alterCopies'; mediaId: Id; fromVariant: Id; toVariant: Id }
  | { type: 'solveCase' };

/* ------------------------------------------------------------------ */
/* État sauvegardé                                                      */
/* ------------------------------------------------------------------ */

export type AppId = 'mail' | 'messages' | 'photos' | 'files' | 'notes' | 'settings';

export type CaseStatus = 'new' | 'postponed' | 'active' | 'solved';

export interface ThreadEntry {
  messageId: Id;
  at: number;
}

export interface QueuedDelivery {
  kind: 'message' | 'mail';
  id: Id;
  caseId: Id;
  notBefore: number;
  ignoreAirplane?: boolean;
  holdUntil?: Condition;
}

export interface CaseProgress {
  status: CaseStatus;
  acceptedAt?: number;
  solvedAt?: number;
  viewedMedia: Id[];
  foundObservations: Id[];
  filedObservations: Id[];
  sentReplies: Id[];
  unlockedReplies: Id[];
  /** Réponse choisie mais non envoyée (mode avion). */
  preparedReply?: Id;
  deliveredMails: Id[];
  threads: Record<Id, ThreadEntry[]>;
  /** Nombre d'entrées lues par fil. */
  threadRead: Record<Id, number>;
  grantedMedia: Id[];
  mediaVariants: Record<Id, Id>;
  firedRules: Id[];
  /** Dernière valeur des règles répétables (déclenchement sur front montant). */
  ruleArmed: Record<Id, boolean>;
  flags: Record<string, FlagValue>;
  stepId?: Id;
  hintsRevealed: Record<Id, number>;
  log: { at: number; text: string }[];
}

export interface PhoneOverride {
  value: string;
  caseId: Id;
  until?: Condition;
}

export interface SavedCopy {
  id: Id;
  caseId: Id;
  mediaId: Id;
  variantId: Id;
  /** Copie figée de la référence d'asset au moment de l'enregistrement. */
  src: string;
  name: string;
  savedAt: number;
}

export interface Note {
  id: Id;
  title: string;
  body: string;
  caseId?: Id;
  createdAt: number;
  updatedAt: number;
}

export type TutorialStep =
  | 'openMail'
  | 'openMessage'
  | 'openAttachment'
  | 'findDetail'
  | 'fileObservation'
  | 'openFiles'
  | 'finish';

export interface TutorialState {
  status: 'pending' | 'dismissed' | 'active' | 'completed';
  step: TutorialStep;
  found: boolean;
  filed: boolean;
}

export interface Settings {
  clockAuto: boolean;
  /** `YYYY-MM-DD` */
  manualDate: string;
  /** `HH:MM` */
  manualTime: string;
  airplane: boolean;
  sound: boolean;
  volume: number;
  reduceMotion: boolean;
  reduceFlashes: boolean;
  largeText: boolean;
}

export interface Notification {
  id: Id;
  app: AppId;
  title: string;
  body?: string;
  target?: { caseId?: Id; mailId?: Id; threadId?: Id };
}

export interface GameState {
  version: number;
  introDone: boolean;
  tutorial: TutorialState;
  settings: Settings;
  activeCaseId: Id | null;
  cases: Record<Id, CaseProgress>;
  readMails: Id[];
  queue: QueuedDelivery[];
  overrides: Partial<Record<PhoneOverrideKey, PhoneOverride>>;
  copies: SavedCopy[];
  notes: Note[];
  /** Transitoire : non sauvegardé. */
  notifications: Notification[];
}
