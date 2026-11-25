/**
 * Rapport d'enquête (Dossiers) : le joueur explique l'affaire en remplissant des trous.
 * Les choix n'apparaissent qu'une fois découverts ; une erreur dit seulement combien de réponses sont justes.
 */
import { Fragment, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { evaluate, reportBlanks, reportParagraphs, reportScore } from '../game/engine';
import { Sheet } from '../components/ui';
import type { CaseDefinition } from '../game/types';

export function ReportCard({ def }: { def: CaseDefinition }) {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const r = def.report!;
  const p = state.cases[def.id];
  const done = p.flags.rapport === 'ok';
  const ids = reportBlanks(def, state);
  const paragraphs = reportParagraphs(def, state);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.keys(r.blanks).map((id) => [id, typeof p.flags[`rapport:${id}`] === 'string' ? (p.flags[`rapport:${id}`] as string) : ''])),
  );
  const [picking, setPicking] = useState<string | null>(null);
  const tries = Number(p.flags['rapport:essais'] ?? 0);
  const right = Number(p.flags['rapport:justes'] ?? 0);
  const complete = ids.every((id) => answers[id]);

  const submit = () => {
    const score = reportScore(def, state, answers);
    dispatch({ type: 'report/submit', caseId: def.id, answers });
    if (score.right === score.total) nav.showToast('Rapport accepté');
  };

  const blank = picking ? r.blanks[picking] : undefined;
  const options = blank?.options.filter((o) => !o.requires || evaluate(o.requires, state, def.id)) ?? [];

  return (
    <section className="report" aria-label="Rapport d’enquête">
      <div className="report-head">
        <span>Rapport d’enquête</span>
        {done ? <span className="tag ok">Remis</span> : <span className="tag">À remettre</span>}
      </div>
      {paragraphs.map((para, i) => (
        <p key={i} className="report-text">
          {para.split(/\{([\w-]+)\}/).map((part, j) =>
            j % 2 === 0 ? (
              <Fragment key={j}>{part}</Fragment>
            ) : (
              <button
                key={j}
                className={`report-blank${answers[part] ? ' filled' : ''}`}
                disabled={done}
                onClick={() => setPicking(part)}
                aria-label={answers[part] ? `Réponse : ${answers[part]}. Modifier` : 'Choisir une réponse'}
              >
                {answers[part] || '…………'}
              </button>
            ),
          )}
        </p>
      ))}
      {!done && (
        <>
          {tries > 0 && right < ids.length && (
            <div className="callout neutral" role="status">
              {right} réponse{right > 1 ? 's' : ''} sur {ids.length} {right > 1 ? 'sont justes' : 'est juste'}. Relisez vos observations et les pièces.
            </div>
          )}
          <button className="btn btn-primary btn-block" disabled={!complete} onClick={submit}>
            Remettre le rapport
          </button>
        </>
      )}
      {blank && picking && (
        <Sheet onClose={() => setPicking(null)} label="Choisir une réponse">
          <h2>Choisir</h2>
          <div className="report-options">
            {options.map((o) => (
              <button
                key={o.text}
                className={`reply${answers[picking] === o.text ? ' prepared' : ''}`}
                onClick={() => {
                  setAnswers((a) => ({ ...a, [picking]: o.text }));
                  setPicking(null);
                }}
              >
                <span>{o.text}</span>
              </button>
            ))}
          </div>
          <p className="footnote">Un choix semble manquer ? Il reste un détail à relever dans les pièces de l’affaire.</p>
        </Sheet>
      )}
    </section>
  );
}
