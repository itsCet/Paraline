/**
 * Boussole : ajoutée à l'accueil par une enquête (override `extraApp: 'boussole'`).
 * Les cibles de l'enquête (`compass.targets`) dont la condition est vraie peuvent être trouvées.
 */
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { evaluate } from '../game/engine';
import { NavBar } from '../components/ui';
import { CompassDial } from '../components/CompassDial';

export function CompassApp() {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const cid = state.overrides.extraApp?.caseId;
  const def = cid ? cases.byId.get(cid) : undefined;
  const p = cid ? state.cases[cid] : undefined;
  const targets = (def?.compass?.targets ?? []).filter((t) => !t.when || (def && evaluate(t.when, state, def.id)));
  const found = targets.filter((t) => p?.flags[`boussole:${t.id}`]).map((t) => t.id);
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title">Boussole</h1>
        <CompassDial
          targets={targets}
          found={found}
          onFound={(id) => {
            if (!def) return;
            dispatch({ type: 'compass/found', caseId: def.id, targetId: id });
            nav.showToast(`${targets.find((t) => t.id === id)?.label ?? 'Signal'} : trouvé`);
          }}
        />
      </div>
    </>
  );
}
