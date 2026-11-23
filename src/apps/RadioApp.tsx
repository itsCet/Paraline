/**
 * Radio FM : ajoutée à l'accueil par une enquête (override `extraApp: 'radio'`).
 * Le joueur règle la fréquence ; la première station de l'enquête qui correspond (et dont la condition
 * est vraie : heure, date…) est diffusée, sinon on entend du souffle. Une émission peut être enregistrée :
 * elle rejoint « Enregistrements » et s'ouvre dans la visionneuse (transcription, spectre).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../phone/nav';
import { evaluate } from '../game/engine';
import { resolveMedia } from '../game/selectors';
import { albumItems } from './VoiceApp';
import { unlockAudio } from '../game/sound';
import { NavBar } from '../components/ui';
import { Icon } from '../components/icons';

const MIN = 87.5;
const MAX = 108;
const SOUFFLE = '/media/system/radio-souffle.mp3';
const fmt = (f: number) => f.toFixed(1).replace('.', ',');

export function RadioApp() {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const cid = state.overrides.extraApp?.caseId;
  const def = cid ? cases.byId.get(cid) : undefined;
  const [freq, setFreq] = useState(() => {
    try {
      const v = Number(localStorage.getItem('paraline.radio.freq'));
      return v >= MIN && v <= MAX ? v : 99.3;
    } catch {
      return 99.3;
    }
  });
  const [on, setOn] = useState(false);
  const [t, setT] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const lastT = useRef(0);
  const visible = nav.app === 'radio';

  // Station captée : la première qui correspond à la fréquence et dont la condition est vraie.
  const station = useMemo(() => {
    if (!def?.radio) return undefined;
    return def.radio.stations.find((s) => Math.abs(s.freq - freq) < 0.05 && (!s.when || evaluate(s.when, state, def.id)));
  }, [def, freq, state]);
  const r = station && def ? resolveMedia(def, state, station.mediaId) : undefined;
  const src = r?.variant.src || SOUFFLE;
  const cues = r?.variant.cues ?? [];
  const cue = cues.find((c) => t >= c.start && t < c.end);
  const recorded = !!(station && def && state.cases[def.id]?.grantedMedia.includes(station.mediaId));
  const recordings = albumItems(state, cases, 'Radio');

  useEffect(() => {
    try {
      localStorage.setItem('paraline.radio.freq', String(freq));
    } catch {
      /* préférence facultative */
    }
  }, [freq]);

  // Changement de station ou d'état : on recharge la source.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.volume = Math.min(1, Math.max(0, state.settings.volume)) * (station ? 1 : 0.35);
    el.muted = !state.settings.sound;
    if (on && visible) {
      if (!el.src.endsWith(src)) {
        el.src = src;
        lastT.current = 0;
        setT(0);
      }
      void el.play().catch(() => {});
    } else el.pause();
  }, [src, on, visible, station, state.settings.volume, state.settings.sound]);

  // Écouter une émission la « consulte » ; une ligne importante entendue jusqu'au bout est relevée.
  useEffect(() => {
    if (on && visible && station && def) dispatch({ type: 'media/view', caseId: def.id, mediaId: station.mediaId });
  }, [on, visible, station, def, dispatch]);
  const onTime = () => {
    const el = audio.current;
    if (!el) return;
    const now = el.currentTime;
    const prev = lastT.current;
    lastT.current = now;
    setT(now);
    if (!def || !station || now <= prev || now - prev > 1.5) return;
    const found = state.cases[def.id]?.foundObservations ?? [];
    for (const c of cues) {
      const end = el.duration ? Math.min(c.end, el.duration - 0.25) : c.end;
      if (c.observationId && !found.includes(c.observationId) && prev < end && now >= end) {
        dispatch({ type: 'observation/found', caseId: def.id, observationId: c.observationId });
        nav.showToast('Ligne relevée dans le dossier');
      }
    }
  };

  const tune = (f: number) => setFreq(Math.round(Math.min(MAX, Math.max(MIN, f)) * 10) / 10);
  const pct = ((freq - MIN) / (MAX - MIN)) * 100;

  return (
    <>
      <NavBar />
      <audio ref={audio} loop preload="auto" onTimeUpdate={onTime} />
      <div className="scroll">
        <h1 className="large-title">Radio</h1>
        <section className="radio-card" aria-label="Récepteur FM">
          <div className="radio-freq" aria-live="polite">
            <span className="radio-mhz">{fmt(freq)}</span> <span className="radio-unit">MHz</span>
          </div>
          <div className="radio-station">{on ? (station ? (station.name ?? 'Signal capté') : 'Souffle') : 'Éteinte'}</div>
          <div className="radio-scale" aria-hidden="true">
            {Array.from({ length: 21 }, (_, i) => (
              <i key={i} style={{ left: `${(i / 20) * 100}%` }} className={i % 5 === 0 ? 'major' : undefined} />
            ))}
            <b style={{ left: `${pct}%` }} />
            <span style={{ left: '0%' }}>88</span>
            <span style={{ left: `${((96 - MIN) / (MAX - MIN)) * 100}%` }}>96</span>
            <span style={{ left: `${((104 - MIN) / (MAX - MIN)) * 100}%` }}>104</span>
          </div>
          <input
            className="radio-range"
            type="range"
            min={MIN}
            max={MAX}
            step={0.1}
            value={freq}
            onChange={(e) => tune(Number(e.target.value))}
            aria-label="Fréquence"
            aria-valuetext={`${fmt(freq)} mégahertz`}
          />
          <div className="radio-controls">
            <button className="btn btn-secondary btn-sm" onClick={() => tune(freq - 0.1)} aria-label="Fréquence moins 0,1">
              <Icon.Minus size={18} /> 0,1
            </button>
            <button
              className={`btn btn-sm ${on ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                unlockAudio();
                setOn(!on);
              }}
            >
              {on ? <Icon.Pause size={18} /> : <Icon.Play size={18} />} {on ? 'Éteindre' : 'Allumer'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => tune(freq + 0.1)} aria-label="Fréquence plus 0,1">
              <Icon.Plus size={18} /> 0,1
            </button>
          </div>
          {on && station && def && (
            <>
              <p className="radio-live" aria-live="polite">{cue ? cue.text : '…'}</p>
              <button
                className="btn btn-secondary btn-sm btn-block"
                disabled={recorded}
                onClick={() => {
                  dispatch({ type: 'media/grant', caseId: def.id, mediaId: station.mediaId });
                  nav.showToast('Émission enregistrée');
                }}
              >
                <span className={`rec-dot${recorded ? ' done' : ''}`} aria-hidden="true" /> {recorded ? 'Émission enregistrée' : 'Enregistrer l’émission'}
              </button>
            </>
          )}
        </section>

        <h2 className="section-title">Enregistrements</h2>
        {recordings.length === 0 ? (
          <p className="radio-empty">Aucune émission enregistrée.</p>
        ) : (
          <div className="group">
            {recordings.map(({ def: d, r: rec }) => (
              <button key={rec.def.id} className="row" onClick={() => nav.openViewer({ kind: 'case', caseId: d.id, mediaId: rec.def.id })} aria-label={`Ouvrir ${rec.def.name}`}>
                <span className="row-ico">
                  <Icon.Audio size={22} />
                </span>
                <span className="row-main">
                  <div className="row-title">{rec.def.name}</div>
                  <div className="row-sub">{rec.def.durationLabel}</div>
                </span>
                <Icon.Chevron className="chev" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
