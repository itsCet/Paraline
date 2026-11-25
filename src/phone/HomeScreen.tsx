import { useLayoutEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from './nav';
import { inbox, pendingReplyThreads, unreadMessages } from '../game/selectors';
import { unreadNews } from '../content/news';
import { albumItems } from '../apps/VoiceApp';
import { APP_LABELS, AppGlyph, Icon, LogoMark } from '../components/icons';
import type { PhoneTime } from '../game/clock';
import type { AppId } from '../game/types';

export function HomeScreen({ hidden, time }: { hidden: boolean; time: PhoneTime }) {
  // L'accueil ne défile jamais : s'il manque de place, l'horloge se resserre (sinon elle était coupée en haut).
  const ref = useRef<HTMLDivElement>(null);
  const [tight, setTight] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || hidden) return;
    el.scrollTop = 0;
    const check = () => {
      if (!el.classList.contains('tight') && el.scrollHeight > el.clientHeight + 1) setTight(true);
      // Assez de place pour l'horloge normale (le mode serré gagne environ 80 px) : on la rend.
      else if (el.classList.contains('tight') && el.scrollHeight + 90 < el.clientHeight) setTight(false);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  });
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const mails = inbox(state, cases);
  const unreadMail = mails.filter((m) => !m.read);
  // Dernier message utile : le plus récent non lu, sinon aucune nouvelle demande.
  const latest = unreadMail[0];
  const badges: Partial<Record<AppId, number>> = {
    mail: unreadMail.length,
    messages: unreadMessages(state) + pendingReplyThreads(state, cases),
    news: unreadNews(state, cases),
    phone: albumItems(state, cases, 'Messagerie').filter((i) => !i.viewed).length,
  };
  const t = state.tutorial;
  const coachTarget: AppId | null =
    t.status === 'active' ? (t.step === 'openMail' || t.step === 'openMessage' ? 'mail' : t.step === 'openFiles' ? 'files' : null) : null;

  const icon = (id: AppId, inDock = false) => (
    <button
      key={id}
      className={`app-icon${coachTarget === id ? ' pulse' : ''}`}
      onClick={() => {
        if (id === 'mail') dispatch({ type: 'tutorial/step', step: 'openMessage' });
        nav.open(id);
      }}
      aria-label={`${APP_LABELS[id]}${badges[id] ? `, ${badges[id]} non lu${badges[id]! > 1 ? 's' : ''}` : ''}`}
    >
      <span className="app-glyph">
        <AppGlyph app={id} />
      </span>
      {badges[id] ? <span className="badge" aria-hidden="true">{badges[id]}</span> : null}
      <span className={inDock ? 'label sr-only' : 'label'}>{APP_LABELS[id]}</span>
    </button>
  );

  return (
    <div ref={ref} className={`home${state.introDone && t.status === 'pending' ? ' has-offer' : ''}${tight ? ' tight' : ''}`} hidden={hidden}>
      <div className="home-clock">
        <div className="home-time">{time.hhmm}</div>
        <div className="home-date">{time.dayLabel}</div>
        {state.overrides.homeMessage && <div className="home-note">{state.overrides.homeMessage.value}</div>}
      </div>

      <button
        className="widget glass"
        onClick={() => nav.open('mail', latest ? { mailId: latest.id, caseId: latest.caseId ?? undefined } : undefined)}
        aria-label={latest ? `Mail : nouveau message de ${latest.fromName}, ${latest.subject}` : 'Mail : aucune nouvelle demande'}
      >
        <span className="widget-icon">
          <AppGlyph app="mail" />
        </span>
        <span className="widget-body">
          {latest ? (
            <>
              <span className="widget-meta">Nouveau message · {latest.fromName}</span>
              <div className="widget-title widget-line">{latest.subject}</div>
              <div className="widget-line widget-muted">{latest.preview}</div>
            </>
          ) : (
            <>
              <div className="widget-meta">Mail</div>
              <div className="widget-title">Aucune nouvelle demande</div>
            </>
          )}
        </span>
        <Icon.Chevron className="chev" size={22} />
      </button>

      <nav className="grid" aria-label="Applications">
        {(['mail', 'messages', 'news', 'photos', 'files', 'notes', 'settings'] as AppId[]).map((id) => icon(id))}
        {state.overrides.extraApp?.value === 'dictaphone' && icon('voice')}
        {state.overrides.extraApp?.value === 'telephone' && icon('phone')}
        {state.overrides.extraApp?.value === 'localiser' && icon('locate')}
        {state.overrides.extraApp?.value === 'radio' && icon('radio')}
        {state.overrides.extraApp?.value === 'boussole' && icon('compass')}
      </nav>
      {state.introDone && t.status === 'pending' && (
        <section className="offer glass" aria-label="Exercice de prise en main">
          <h2>
            <LogoMark size={22} /> Une minute pour prendre vos marques
          </h2>
          <p>Ouvrez un message, examinez une pièce jointe et enregistrez votre première observation.</p>
          <div className="offer-actions">
            <button className="btn btn-primary btn-sm" style={{ minHeight: 40 }} onClick={() => dispatch({ type: 'tutorial/start' })}>
              Faire l’essai
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'tutorial/dismiss' })}>
              Plus tard
            </button>
          </div>
        </section>
      )}

      <div className="home-spacer" />
      <nav className="dock glass" aria-label="Dock">
        {icon('mail', true)}
        {icon('messages', true)}
        {icon('files', true)}
      </nav>
    </div>
  );
}

