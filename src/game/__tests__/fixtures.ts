/** Enquête de test : uniquement pour les tests du moteur, jamais affichée au joueur. */
import type { CaseDefinition } from '../types';

export const testCase: CaseDefinition = {
  id: 'test-case',
  title: 'Affaire de test',
  client: 'c1',
  characters: [
    { id: 'c1', name: 'Client Test', initials: 'CT' },
    { id: 'c2', name: 'Inconnu', initials: '?' },
  ],
  media: [
    {
      id: 'img',
      kind: 'image',
      name: 'img.jpg',
      defaultVariant: 'v1',
      allowSaveCopy: true,
      variants: {
        v1: { src: '/test/v1.jpg', width: 100, height: 100, hotspots: [{ id: 'h1', x: 0.1, y: 0.1, w: 0.2, h: 0.2, observationId: 'o1' }] },
        v2: { src: '/test/v2.jpg', width: 100, height: 100 },
      },
    },
  ],
  initialMail: { id: 'test-mail', from: 'c1', subject: 'Test', timeLabel: '22:14', body: ['Bonjour'], attachments: ['img'] },
  followUpMails: [{ id: 'test-mail-2', from: 'c1', subject: 'Suite', timeLabel: '22:20', body: ['Suite'] }],
  threads: [
    { id: 't1', contact: 'c1' },
    { id: 't2', contact: 'c2' },
  ],
  messages: [
    { id: 'm-open', threadId: 't1', from: 'c1', text: 'Bonsoir' },
    { id: 'm-ans', threadId: 't1', from: 'c1', text: 'Réponse' },
    { id: 'm-final', threadId: 't1', from: 'c1', text: 'Final' },
    { id: 'm-ghost', threadId: 't2', from: 'c2', text: '…' },
    { id: 'm-net', threadId: 't1', from: 'c1', text: 'Réseau' },
  ],
  replies: [
    { id: 'q1', threadId: 't1', label: 'Question 1', effects: [{ type: 'deliverMessage', messageId: 'm-ans' }] },
    { id: 'q-ask', threadId: 't1', label: 'Question débloquée' },
  ],
  observations: [{ id: 'o1', title: 'Détail', mediaId: 'img', actions: [{ type: 'addToFile' }, { type: 'ask', replyId: 'q-ask' }] }],
  steps: [
    { id: 's1', objective: 'Observer', hints: ['a', 'b', 'c'] },
    { id: 's2', objective: 'Comprendre', hints: ['a', 'b', 'c'] },
  ],
  openingMessages: ['m-open'],
  rules: [
    {
      id: 'r-order',
      when: { all: [{ observationFound: 'o1' }, { replySent: 'q1' }] },
      effects: [{ type: 'deliverMessage', messageId: 'm-final' }, { type: 'setStep', stepId: 's2' }],
    },
    {
      id: 'r-time',
      when: { all: [{ manualTime: '03:17' }, { manualDate: '2014-11-18' }] },
      effects: [
        { type: 'setMediaVariant', mediaId: 'img', variantId: 'v2' },
        { type: 'phoneOverride', key: 'wallpaper', value: '/test/wall.jpg', until: { not: { manualTime: '03:17' } } },
        { type: 'log', text: 'heure' },
      ],
    },
    { id: 'r-ghost', when: { airplane: true }, effects: [{ type: 'deliverMessage', messageId: 'm-ghost', ignoreAirplane: true }] },
    { id: 'r-net', when: { observationFiled: 'o1' }, effects: [{ type: 'deliverMessage', messageId: 'm-net' }, { type: 'deliverMail', mailId: 'test-mail-2' }] },
    { id: 'r-repeat', once: false, when: { airplane: true }, effects: [{ type: 'log', text: 'avion' }] },
    { id: 'r-solve', when: { flag: 'done' }, effects: [{ type: 'solveCase' }] },
  ],
  conclusion: { title: 'Fin', text: ['Conclusion'] },
};

export const otherCase: CaseDefinition = {
  ...testCase,
  id: 'other-case',
  title: 'Autre',
  initialMail: { ...testCase.initialMail, id: 'other-mail' },
  followUpMails: [],
  rules: [],
};
