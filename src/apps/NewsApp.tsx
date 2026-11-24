/**
 * Le Fil : actualités du monde de Paraline (toujours sur l'accueil).
 * Les articles et leurs conditions de parution sont dans `src/content/news.ts`.
 */
import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { availableNews, type NewsItem } from '../content/news';
import { Empty, NavBar } from '../components/ui';
import { Icon } from '../components/icons';

const day = (at: number) => {
  const d = new Date(at);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `Aujourd’hui, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const published = (at: number) => {
  const d = new Date(at);
  if (d.toDateString() === new Date().toDateString())
    return `Publié aujourd’hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return `Publié le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
};

export function NewsApp() {
  const { state, dispatch, cases } = useGame();
  const nav = useNav();
  const items = availableNews(state, cases);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = items.find((n) => n.id === openId);
  const visible = nav.app === 'news';

  // Une notification ouvre le Fil sur l'article le plus récent.
  useIntent('news', (i) => setOpenId(i.page ?? items[0]?.id ?? null));

  // Quitter Le Fil le ramène à la une (un nouvel article ne reste pas caché derrière l'ancien).
  useEffect(() => {
    if (!visible) setOpenId(null);
  }, [visible]);

  useEffect(() => {
    nav.setScreen('news', current ? 'article' : 'list');
    if (current && visible) dispatch({ type: 'news/read', articleId: current.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, visible]);

  if (current) return <Article item={current} onBack={() => setOpenId(null)} />;

  const [first, ...rest] = items;
  return (
    <>
      <NavBar />
      <div className="scroll">
        <h1 className="large-title news-brand">Le Fil</h1>
        {!first ? (
          <Empty>Aucun article pour le moment.</Empty>
        ) : (
          <>
            <button className="news-hero" onClick={() => setOpenId(first.id)}>
              {first.image && (
                <img src={first.image.src} alt="" style={{ objectPosition: first.image.position }} />
              )}
              <span className="news-hero-body">
                <span className="news-kicker">
                  {!first.read && <span className="dot" aria-label="Non lu" />}
                  {first.kicker}
                </span>
                <span className="news-title">{first.title}</span>
                <span className="news-meta">
                  {first.source} · {day(first.at)}
                </span>
              </span>
            </button>
            {rest.length > 0 && (
              <ul className="list news-list">
                {rest.map((n) => (
                  <li key={n.id}>
                    <button className="news-row" onClick={() => setOpenId(n.id)}>
                      <span className="news-row-text">
                        <span className="news-kicker">
                          {!n.read && <span className="dot" aria-label="Non lu" />}
                          {n.kicker}
                        </span>
                        <span className="news-row-title">{n.title}</span>
                        <span className="news-meta">
                          {n.source} · {day(n.at)}
                        </span>
                      </span>
                      {n.image && <img src={n.image.src} alt="" style={{ objectPosition: n.image.position }} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Article({ item, onBack }: { item: NewsItem; onBack: () => void }) {
  const { state, cases } = useGame();
  const nav = useNav();
  const mailId = item.caseId ? cases.byId.get(item.caseId)?.initialMail.id : undefined;
  const solved = item.caseId ? state.cases[item.caseId]?.status === 'solved' : false;
  return (
    <>
      <NavBar back="Le Fil" onBack={onBack} />
      <div className="scroll">
        <article className="news-article">
          <div className="news-source">{item.source}</div>
          <div className="news-kicker">{item.kicker}</div>
          <h1>{item.title}</h1>
          <div className="news-meta">{published(item.at)}</div>
          {item.image && (
            <figure>
              <img src={item.image.src} alt={item.image.alt} style={{ objectPosition: item.image.position }} />
              {item.image.caption && <figcaption>{item.image.caption}</figcaption>}
            </figure>
          )}
          <p className="news-lead">{item.lead}</p>
          {item.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {item.open && item.caseId && (
            <button
              className="btn btn-primary news-open"
              disabled={item.locked}
              onClick={() => mailId && nav.open('mail', { mailId, caseId: item.caseId })}
            >
              <Icon.Folder size={20} /> {item.locked ? 'Dossier réservé (code d’accès)' : solved ? 'Revoir le dossier' : 'Ouvrir le dossier'}
            </button>
          )}
        </article>
      </div>
    </>
  );
}
