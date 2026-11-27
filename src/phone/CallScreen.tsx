/**
 * Appel entrant (sonnerie plein écran), puis conversation : voix enregistrée, sous-titres,
 * réponses au choix. Raccrocher en cours de route termine l'appel sans ses effets de fin.
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { startRing, unlockAudio } from '../game/sound';
import { Avatar } from '../components/ui';
import { Icon } from '../components/icons';

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export function CallScreen() {
  const { state, cases, dispatch } = useGame();
  const ring = state.ringing;
  const live = state.inCall;
  const ref = ring ?? live;
  const def = ref && cases.byId.get(ref.caseId);
  const call = def?.calls?.find((c) => c.id === ref!.callId);
  const who = call && def ? def.characters.find((c) => c.id === call.from) : undefined;
  const label = call?.label ?? who?.name ?? 'Inconnu';

  // Sonnerie et vibration tant que ça sonne.
  useEffect(() => {
    if (!ring) return;
    const stop = startRing(state.settings);
    let vib: number | undefined;
    try {
      navigator.vibrate?.([700, 500, 700, 1600]);
      vib = window.setInterval(() => navigator.vibrate?.([700, 500, 700, 1600]), 3500);
    } catch {
      /* sans vibreur */
    }
    return () => {
      stop();
      window.clearInterval(vib);
      try {
        navigator.vibrate?.(0);
      } catch {
        /* sans vibreur */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ring?.callId, ring?.since]);

  // Durée de l'appel.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [live]);

  // Réplique en cours : voix, puis les réponses (ou la fin de l'appel).
  const node = live && call ? call.nodes[live.node] : undefined;
  const audio = useRef<HTMLAudioElement>(null);
  const [spoken, setSpoken] = useState(false);
  useEffect(() => {
    setSpoken(false);
    if (!node) return;
    const el = audio.current;
    const done = () => setSpoken(true);
    // Sans son (ou sans fichier) : un temps de lecture du sous-titre.
    if (!node.audio || !el || !state.settings.sound) {
      const t = window.setTimeout(done, Math.min(5000, 900 + node.text.length * 45));
      return () => window.clearTimeout(t);
    }
    el.src = node.audio;
    el.volume = Math.min(1, Math.max(0, state.settings.volume));
    el.onended = done;
    el.onerror = done;
    void el.play().catch(done);
    return () => {
      el.onended = null;
      el.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.node, live?.callId]);
  useEffect(() => {
    if (spoken && node && !node.choices?.length) {
      const t = window.setTimeout(() => dispatch({ type: 'call/end', natural: true }), 900);
      return () => window.clearTimeout(t);
    }
  }, [spoken, node, dispatch]);

  if (!ref || !call || !def) return null;

  if (ring) {
    return (
      <div className="call ringing" role="dialog" aria-label={`Appel entrant : ${label}`}>
        <div className="call-top">
          <div className="call-avatar">{who ? <Avatar initials={who.initials} color={who.color} /> : null}</div>
          <div className="call-name">{label}</div>
          <div className="call-sub">Appel mobile…</div>
        </div>
        <div className="call-actions">
          <button className="call-btn decline" onClick={() => dispatch({ type: 'call/decline' })} aria-label="Refuser l’appel">
            <Icon.Call size={30} />
            <span>Refuser</span>
          </button>
          <button
            className="call-btn accept"
            onClick={() => {
              unlockAudio();
              dispatch({ type: 'call/answer' });
            }}
            aria-label="Accepter l’appel"
          >
            <Icon.Call size={30} />
            <span>Accepter</span>
          </button>
        </div>
      </div>
    );
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - live!.since) / 1000));
  return (
    <div className="call live" role="dialog" aria-label={`Appel en cours : ${label}`}>
      <audio ref={audio} preload="auto" />
      <div className="call-top">
        <div className="call-name">{label}</div>
        <div className="call-sub">{mmss(elapsed)}</div>
      </div>
      <div className="call-line" aria-live="polite">
        {node && <p className="call-text">{node.text}</p>}
      </div>
      <div className="call-choices">
        {spoken &&
          node?.choices?.map((c) => (
            <button key={c.id} className="reply" onClick={() => dispatch({ type: 'call/choose', choiceId: c.id })}>
              <span>{c.label}</span>
              <Icon.Chevron size={18} />
            </button>
          ))}
      </div>
      <div className="call-actions single">
        <button className="call-btn decline" onClick={() => dispatch({ type: 'call/end', natural: false })} aria-label="Raccrocher">
          <Icon.Call size={30} />
          <span>Raccrocher</span>
        </button>
      </div>
    </div>
  );
}
