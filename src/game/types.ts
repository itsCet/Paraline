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
  /** Toucher cette ligne de la transcription relève une observation. */
  observationId?: Id;
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
  /** Panneau « Infos » (métadonnées). Une ligne peut révéler une observation quand on la touche. */
  info?: { label: string; value: string; observationId?: Id }[];
  /** Audio : spectre du son (image calculée depuis le fichier), avec zones à toucher. Axe horizontal = durée du fichier. */
  spectrogram?: { src: string; width: number; height: number; alt: string; hotspots?: Hotspot[] };
  /** Image plongée dans le noir, qu'on éclaire à la lampe (doigt ou inclinaison). Les zones ne se touchent
   *  qu'éclairées. `reveal` : calque visible seulement dans le faisceau (écriture « UV »). */
  flashlight?: { radius?: number; reveal?: string };
  /** Photo à 360° (équirectangulaire, 2:1) : on regarde autour de soi. Les zones utilisent les mêmes
   *  coordonnées que l'image à plat. `exits` : passages vers une autre photo à 360° de l'enquête. */
  panorama?: { exits?: { x: number; y: number; to: Id; label: string }[]; startYaw?: number };
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
  /** `imprint` : trace en creux, à peine visible (empreinte d'écriture). */
  tone?: 'ink' | 'imprint';
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
  /** Album partagé dans lequel le média apparaît (Photos). */
  album?: string;
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
  /** Message système (« Malik a quitté la conversation »), centré, sans bulle. */
  system?: boolean;
  /** Heure affichée sous la bulle (message ancien, ou daté dans l'histoire). Par défaut : heure de réception. */
  time?: string;
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
  /** Heure figée de tous les messages du contact (fantôme : « 03:17 »). */
  frozenTime?: string;
  /** Réponse quand le joueur appelle ce contact (par défaut : « ne répond pas »). */
  callText?: string;
  /** Conversation de groupe : participants (le nom de l'auteur s'affiche au-dessus de ses bulles). */
  members?: Id[];
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
  /** Enquête réservée : son e-mail reste verrouillé tant que le code d'accès n'a pas été saisi. */
  locked?: boolean;
  followUpMails?: MailDef[];
  threads: ThreadDef[];
  messages: MessageDef[];
  replies: ReplyDef[];
  observations: ObservationDef[];
  steps: StepDef[];
  rules: RuleDef[];
  /** Messages présents dans les fils dès l'acceptation. */
  openingMessages?: Id[];
  /** Notes qui peuvent apparaître dans l'app Notes du joueur. */
  /** `at` : date fictive de la note (ISO), pour les notes « anciennes » d'un autre propriétaire. */
  notes?: { id: Id; title?: string; body: string; at?: string }[];
  /** Le joueur revient dans le jeu après l'avoir quitté (Page Visibility) au moins `minAwayMs`. */
  onReturn?: { minAwayMs: number; when?: Condition; effects: Effect[] };
  /** Épreuve « ne bouge plus » (override `stillness`) : toucher l'écran déclenche le sursaut et relance le compte. */
  /** Batterie d'un contact, qui baisse en temps réel : le drapeau `flag` perd 1 toutes les `everyMs`
   *  tant que `while` est vraie, sans descendre sous `floor`. Affichée dans l'en-tête du fil `threadId`.
   *  Une absence ne coûte qu'un cran (pas de rattrapage). */
  /** App Radio (override `extraApp: 'radio'`) : la première station dont la fréquence (MHz) correspond et dont `when` est vraie
   *  est diffusée ; sinon, du souffle. Le joueur peut enregistrer une émission (le média rejoint l'album « Radio »). */
  /** App Boussole (override `extraApp: 'boussole'`) : viser une direction réelle (cap en degrés, 0 = nord)
   *  pendant `hold` secondes pose le drapeau `boussole:<id>`. `when` : cible active seulement si vraie. */
  compass?: { targets: { id: Id; bearing: number; tolerance?: number; hold?: number; label: string; when?: Condition }[] };
  radio?: { stations: { freq: number; mediaId: Id; name?: string; when?: Condition }[] };
  battery?: { flag: string; threadId: Id; everyMs: number; floor: number; while: Condition };
  /** `ready` : écran d'explication avant l'épreuve (son bouton demande aussi l'accès au mouvement sur iPhone).
   *  Pendant le compte, toucher l'écran OU bouger le téléphone déclenche le sursaut. */
  stillness?: {
    seconds: number;
    scareImage: string;
    scareSound: string;
    ambience?: string;
    steps?: string;
    whisper?: string;
    text: string;
    subtitle?: string;
    retryText?: string;
    /** Menace qui s'écrit pendant le compte, après `afterSeconds`. */
    warning?: { text: string; afterSeconds: number };
    ready?: { title: string; text: string[]; button: string };
  };
  obstacles?: ObstacleDef[];
  conclusion: { title: string; text: string[] };
  /** Conclusions alternatives : la première dont la condition est vraie remplace `conclusion`. */
  endings?: { when: Condition; title: string; text: string[] }[];
  /** Météo de la ville de l'enquête (écran verrouillé, widget de l'accueil). */
  weather?: Weather;
  /** Durée et ton annoncés au joueur dans Mail (ex. « ~20 min », « Enquête longue »). */
  about?: { duration: string; tone: string };
}

/* ------------------------------------------------------------------ */
/* Conditions                                                           */
/* ------------------------------------------------------------------ */

export type Sky = 'clair' | 'nuageux' | 'pluie' | 'brouillard' | 'neige' | 'orage';
export interface Weather {
  city: string;
  temp: number;
  sky: Sky;
}

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
  /** Drapeau numérique inférieur ou égal à `value` (faux si le drapeau n'est pas un nombre). */
  | { flagAtMost: string; value: number }
  /** Heure manuelle exacte, format `HH:MM` (mode automatique = faux). */
  | { manualTime: string }
  /** Date manuelle exacte, format `YYYY-MM-DD` (mode automatique = faux). */
  | { manualDate: string }
  /** Date manuelle comprise entre deux dates incluses (`YYYY-MM-DD`). */
  | { manualDateBetween: [string, string] }
  /** Heure manuelle comprise dans l'heure `HH` (ex. 3 : de 03:00 à 03:59). */
  | { manualHour: number }
  | { airplane: boolean }
  /** Réglage automatique de la date et de l'heure. */
  | { clockAuto: boolean }
  /** Sons du jeu activés ou coupés (Réglages). */
  | { sound: boolean }
  /** Note de l'enquête actuellement présente dans Notes / déjà écrite au moins une fois. */
  | { noteExists: Id }
  | { noteWritten: Id }
  /** Variante actuelle d'un média. */
  | { mediaVariant: Id; is: Id }
  | { ruleFired: Id };

export type FlagValue = boolean | number | string;

/* ------------------------------------------------------------------ */
/* Effets                                                               */
/* ------------------------------------------------------------------ */

/** `dim` : assombrissement de l'écran (`0` à `0.7`). `stillness` : épreuve « ne bouge plus » en cours (valeur : id de l'enquête).
 *  `extraApp` : application ajoutée à l'accueil (`dictaphone`, `telephone`, `localiser`, `radio` ou `boussole`).
 *  `ghostSetting` : réglage inconnu dans Réglages, au format `Libellé::texte de la note écrite à l'activation`. */
export type PhoneOverrideKey = 'wallpaper' | 'homeMessage' | 'extraApp' | 'ghostSetting' | 'dim' | 'stillness';

export type Effect =
  /** Message dans un fil. Suspendu en mode avion sauf `ignoreAirplane`. */
  /** `holdUntil` : la livraison attend aussi que cette condition soit vraie.
   *  `background` : événement programmé (souvent long) qui ne bloque pas les réponses du fil. */
  | { type: 'deliverMessage'; messageId: Id; delayMs?: number; ignoreAirplane?: boolean; holdUntil?: Condition; background?: boolean }
  /** E-mail de suivi rattaché à l'affaire (ne crée jamais d'affaire). */
  | { type: 'deliverMail'; mailId: Id; delayMs?: number; ignoreAirplane?: boolean; holdUntil?: Condition }
  | { type: 'setMediaVariant'; mediaId: Id; variantId: Id }
  | { type: 'unlockReply'; replyId: Id }
  /** Rend un média disponible dans Photos et dans le dossier. */
  | { type: 'grantMedia'; mediaId: Id }
  | { type: 'setStep'; stepId: Id }
  | { type: 'setFlag'; name: string; value: FlagValue }
  /** Ajoute `delta` à un drapeau numérique (0 s'il est absent), borné par `min` / `max`. */
  | { type: 'addFlag'; name: string; delta: number; min?: number; max?: number }
  /** Modification temporaire du téléphone, annulée quand `until` devient vraie,
   *  par `clearPhoneOverride`, ou à la fin de l'affaire. */
  | { type: 'phoneOverride'; key: PhoneOverrideKey; value: string; until?: Condition }
  | { type: 'clearPhoneOverride'; key: PhoneOverrideKey }
  | { type: 'notify'; title: string; body?: string; app?: AppId }
  | { type: 'log'; text: string }
  /** Une note apparaît dans l'app Notes du joueur (définie dans `notes`). */
  | { type: 'writeNote'; noteId: Id; delayMs?: number }
  | { type: 'removeNote'; noteId: Id }
  /** Altère les copies conservées d'un média (dénouement surnaturel uniquement). */
  | { type: 'alterCopies'; mediaId: Id; fromVariant: Id; toVariant: Id }
  | { type: 'solveCase' };

/* ------------------------------------------------------------------ */
/* État sauvegardé                                                      */
/* ------------------------------------------------------------------ */

export type AppId = 'mail' | 'messages' | 'photos' | 'files' | 'notes' | 'settings' | 'voice' | 'phone' | 'locate' | 'radio' | 'compass' | 'news';

export type CaseStatus = 'new' | 'postponed' | 'active' | 'solved';

export interface ThreadEntry {
  messageId: Id;
  at: number;
}

export interface QueuedDelivery {
  kind: 'message' | 'mail' | 'note';
  id: Id;
  caseId: Id;
  notBefore: number;
  ignoreAirplane?: boolean;
  holdUntil?: Condition;
  /** Hors de l'enchaînement du fil : ne retarde pas les autres messages. */
  background?: boolean;
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
  /** Notes d'enquête déjà apparues au moins une fois. */
  writtenNotes: Id[];
  /** Réponses déjà vues par fil (pastille « nouvelle réponse possible »). */
  seenReplies?: Record<Id, Id[]>;
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
  /** Remise à zéro générale (`RESET_EPOCH`) : une sauvegarde plus ancienne est effacée au chargement. */
  epoch?: number;
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
  /** Dernière absence du joueur (application quittée puis reprise). */
  away?: { at: number; ms: number; count: number };
  /** Code d'accès saisi : les enquêtes réservées sont ouvertes. */
  unlocked?: boolean;
  /** Articles du Fil déjà ouverts. */
  readNews?: Id[];
  /** Transitoire : non sauvegardé. */
  notifications: Notification[];
}
