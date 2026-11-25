/**
 * Pour les tests de parcours : remet automatiquement le bon rapport dès qu'une affaire l'attend,
 * afin de vérifier les fins comme avant. Le rapport lui-même est testé dans rapport.test.ts.
 */
import { evaluate, reportBlanks, type CaseIndex } from '../engine';
import type { Action } from '../reducer';
import type { GameState } from '../types';

export function withRapport(reducer: (s: GameState, a: Action) => GameState, cases: CaseIndex) {
  return (s: GameState, a: Action): GameState => {
    let next = reducer(s, a);
    for (const def of cases.list) {
      if (def.report && next.cases[def.id]?.flags.rapport === 'pret') {
        // La bonne réponse doit avoir été découverte au cours du parcours.
        for (const id of reportBlanks(def, next)) {
          const b = def.report.blanks[id];
          const ok = b.options.find((o) => o.text === b.answer);
          if (ok?.requires && !evaluate(ok.requires, next, def.id)) throw new Error(`[${def.id}] rapport : « ${b.answer} » (${id}) n’a pas été découvert`);
        }
        const answers = Object.fromEntries(Object.entries(def.report.blanks).map(([id, b]) => [id, b.answer]));
        next = reducer(next, { type: 'report/submit', caseId: def.id, answers });
      }
    }
    return next;
  };
}
