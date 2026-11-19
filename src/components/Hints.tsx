/** Aide en trois niveaux (rappel, piste, solution), toujours sur demande. */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../game/store';
import { currentObstacle } from '../game/engine';
import { Sheet } from './ui';
import { Icon } from './icons';
import type { CaseDefinition } from '../game/types';

export const HINT_LABELS = ['Rappel', 'Piste', 'Solution'];

/** Aide courante d'une enquête : le premier obstacle non résolu, sinon l'étape en cours. */
export function useHelp(def: CaseDefinition | undefined) {
  const { state } = useGame();
  if (!def) return undefined;
  const p = state.cases[def.id];
  if (!p || p.status !== 'active') return undefined;
  const step = def.steps.find((s) => s.id === p.stepId);
  const help = currentObstacle(def, state) ?? (step?.hints ? { id: step.id, hints: step.hints } : undefined);
  return help && { ...help, revealed: p.hintsRevealed[help.id] ?? 0 };
}

export function HintList({ def }: { def: CaseDefinition }) {
  const { dispatch } = useGame();
  const help = useHelp(def);
  if (!help) return null;
  return (
    <div className="group">
      {help.hints.slice(0, help.revealed).map((h, i) => (
        <div key={i} className="hint">
          <div className="hint-level">
            {i + 1}. {HINT_LABELS[i]}
          </div>
          <p>{h}</p>
        </div>
      ))}
      {help.revealed < 3 && (
        <button className="row" onClick={() => dispatch({ type: 'hint/reveal', caseId: def.id, stepId: help.id })}>
          <span className="row-ico">
            <Icon.Bulb size={22} />
          </span>
          <span className="row-main">
            <div className="row-title">{help.revealed === 0 ? 'Demander un indice' : help.revealed === 1 ? 'Indice suivant' : 'Afficher la solution'}</div>
            <div className="row-sub">Niveau {help.revealed + 1} sur 3</div>
          </span>
        </button>
      )}
    </div>
  );
}

/** Ampoule de la barre du bas : ouvre l'aide de l'enquête en cours, sans rien révéler d'office. */
export function HintBulb() {
  const { state, cases } = useGame();
  const [open, setOpen] = useState(false);
  const def = state.activeCaseId ? cases.byId.get(state.activeCaseId) : undefined;
  const help = useHelp(def);
  const [phone, setPhone] = useState<HTMLElement | null>(null);
  if (!def || !help || !state.introDone) return null;
  return (
    <>
      <button
        className="hint-bulb"
        onClick={(e) => {
          // La feuille s'ouvre sur tout le téléphone, pas dans la barre du bas.
          setPhone(e.currentTarget.closest<HTMLElement>('.phone'));
          setOpen(true);
        }} aria-label="Indices" title="Indices">
        <Icon.Bulb size={22} />
      </button>
      {open && phone && createPortal(
        <Sheet onClose={() => setOpen(false)} label="Indices">
          <h2>Besoin d’un coup de pouce ?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 0 }}>
            {def.title} · trois niveaux, du plus discret à la solution.
          </p>
          <HintList def={def} />
          <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => setOpen(false)}>
            Fermer
          </button>
        </Sheet>,
        phone,
      )}
    </>
  );
}
