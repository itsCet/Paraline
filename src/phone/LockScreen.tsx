/**
 * Écran verrouillé : à l'ouverture du jeu, et au retour après une absence.
 * Heure, météo de la ville de l'enquête, notifications empilées (toucher : déverrouille et ouvre),
 * lampe torche (l'écran s'allume en blanc) et appareil photo (ouvre Photos).
 */
import { useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from './nav';
import { inbox } from '../game/selectors';
import { resolveEntry } from '../game/reducer';
import { character } from '../game/selectors';
import { availableNews } from '../content/news';
import { currentWeather, forecast, SKY_LABEL } from '../game/weather';
import { WeatherIcon } from '../components/WeatherIcon';
import { AppGlyph, Icon } from '../components/icons';
import type { PhoneTime } from '../game/clock';
import type { AppId, Id } from '../game/types';

interface LockNotice {
  id: string;
  app: AppId;
  title: string;
  body: string;
  at: number;
  target?: { caseId?: Id; mailId?: Id; threadId?: Id };
}

function useNotices(): LockNotice[] {
  const { state, cases } = useGame();
  const out: LockNotice[] = [];
  for (const def of cases.list) {
    const p = state.cases[def.id];
    if (!p) continue;
    for (const t of def.threads) {
      const entries = p.threads[t.id] ?? [];
      const unread = entries.length - (p.threadRead[t.id] ?? 0);
      if (unread <= 0) continue;
      // Dernier vrai message (pas un séparateur « Aujourd'hui »).
      const last = [...entries].reverse().find((e) => {
        const r = resolveEntry(def, e.messageId);
        return r && !r.system;
      });
      const m = last && resolveEntry(def, last.messageId);
      if (!last || !m) continue;
      out.push({
        id: `m:${def.id}:${t.id}`,
        app: 'messages',
        title: character(def, t.contact).name,
        body: `${unread > 1 ? `${unread} messages · ` : ''}${m.text ?? 'Pièce jointe'}`,
        at: last.at,
        target: { caseId: def.id, threadId: t.id },
      });
    }
  }
  inbox(state, cases)
    .filter((m) => !m.read && !m.locked)
    .slice(0, 2)
    .forEach((m, i) =>
      out.push({ id: `mail:${m.id}`, app: 'mail', title: m.fromName, body: m.subject, at: -1 - i, target: { mailId: m.id, caseId: m.caseId ?? undefined } }),
    );
  availableNews(state, cases)
    .filter((n) => !n.read)
    .forEach((n) => out.push({ id: `news:${n.id}`, app: 'news', title: n.source, body: n.title, at: n.at }));
  return out.sort((a, b) => b.at - a.at).slice(0, 4);
}

const hh = (at: number) => {
  if (at < 0) return '';
  const d = new Date(at);
  if (d.toDateString() !== new Date().toDateString()) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function LockScreen({ time, onUnlock }: { time: PhoneTime; onUnlock: () => void }) {
  const { state, cases } = useGame();
  const nav = useNav();
  const notices = useNotices();
  const w = currentWeather(state, cases);
  const hours = forecast(w, time.date);
  const [leaving, setLeaving] = useState(false);
  const [torch, setTorch] = useState(false);
  const startY = useRef<number | null>(null);

  const unlock = (then?: () => void) => {
    if (leaving) return;
    if (state.settings.reduceMotion) {
      onUnlock();
      then?.();
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      onUnlock();
      then?.();
    }, 260);
  };

  return (
    <div
      className={`lock${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-label="Écran verrouillé"
      onPointerDown={(e) => (startY.current = e.clientY)}
      onPointerUp={(e) => {
        if (startY.current !== null && startY.current - e.clientY > 70) unlock();
        startY.current = null;
      }}
    >
      <div className="lock-clock">
        <div className="lock-date">{time.dayLabel}</div>
        <div className="lock-time">{time.hhmm}</div>
      </div>

      <section className="lock-weather glass" aria-label={`Météo à ${w.city}`}>
        <div className="lock-weather-head">
          <div>
            <div className="lock-weather-city">{w.city}</div>
            <div className="lock-weather-sky">{SKY_LABEL[w.sky]}</div>
          </div>
          <div className="lock-weather-temp">{w.temp}°</div>
        </div>
        <div className="lock-hours">
          {hours.map((h, i) => (
            <div key={i} className="lock-hour">
              <span>{i === 0 ? 'Maint.' : `${String(h.hour).padStart(2, '0')} h`}</span>
              <WeatherIcon sky={w.sky} night={h.night} size={20} />
              <span>{h.temp}°</span>
            </div>
          ))}
        </div>
      </section>

      <div className="lock-notices" aria-label="Notifications">
        {notices.map((n) => (
          <button
            key={n.id}
            className="lock-notice glass"
            onClick={() => unlock(() => nav.open(n.app, n.target))}
            aria-label={`${n.title} : ${n.body}. Déverrouiller et ouvrir`}
          >
            <span className="lock-notice-icon">
              <AppGlyph app={n.app} />
            </span>
            <span className="lock-notice-body">
              <span className="lock-notice-head">
                <b>{n.title}</b>
                <small>{hh(n.at)}</small>
              </span>
              <span className="lock-notice-text">{n.body}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="lock-bottom">
        <button className={`lock-round${torch ? ' on' : ''}`} aria-label={torch ? 'Éteindre la lampe torche' : 'Lampe torche'} aria-pressed={torch} onClick={() => setTorch((t) => !t)}>
          <Icon.Torch size={24} />
        </button>
        <button className="lock-unlock" onClick={() => unlock()}>
          <Icon.Up size={18} />
          Balayez vers le haut pour déverrouiller
        </button>
        <button className="lock-round" aria-label="Appareil photo" onClick={() => unlock(() => nav.open('photos'))}>
          <Icon.Camera size={24} />
        </button>
      </div>
      {torch && (
        <button className="torch-light" aria-label="Éteindre la lampe torche" onClick={() => setTorch(false)}>
          <span>Touchez pour éteindre</span>
        </button>
      )}
    </div>
  );
}
