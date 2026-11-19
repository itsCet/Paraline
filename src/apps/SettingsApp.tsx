import { useEffect, useState, type ReactNode } from 'react';
import { useGame } from '../game/store';
import { useIntent, useNav } from '../phone/nav';
import { usePhoneTime } from '../game/clock';
import { Dialog, NavBar, Switch } from '../components/ui';
import { Icon } from '../components/icons';
import type { Settings } from '../game/types';

type Page = 'root' | 'datetime' | 'sound' | 'a11y' | 'help' | 'apps' | 'save';

const TITLES: Record<Page, string> = {
  root: 'Réglages',
  datetime: 'Date et heure',
  sound: 'Audio',
  a11y: 'Accessibilité',
  help: 'Aide',
  apps: 'Les applications',
  save: 'Sauvegarde',
};

function SettingsIcon({ children }: { bg?: string; children: ReactNode }) {
  return (
    <span className="row-ico" aria-hidden="true">
      {children}
    </span>
  );
}

export function SettingsApp() {
  const { state, dispatch } = useGame();
  const nav = useNav();
  const [page, setPage] = useState<Page>('root');
  useIntent('settings', (i) => i.page && setPage(i.page as Page));
  useEffect(() => {
    nav.setScreen('settings', page);
  }, [page, nav]);
  const s = state.settings;
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings/update', patch });
  const back = page === 'apps' ? 'help' : 'root';

  const Row = ({ to, icon, label, value }: { to: Page; icon: ReactNode; label: string; value?: string }) => (
    <button className="row" onClick={() => setPage(to)}>
      {icon}
      <span className="row-main">
        <div className="row-title">{label}</div>
      </span>
      {value && <span className="row-value">{value}</span>}
      <Icon.Chevron className="chev" size={18} />
    </button>
  );

  return (
    <>
      <NavBar back={page === 'root' ? undefined : TITLES[back]} onBack={page === 'root' ? undefined : () => setPage(back)} title={page === 'root' ? undefined : TITLES[page]} />
      <div className="scroll">
        {page === 'root' && (
          <>
            <h1 className="large-title">Réglages</h1>
            <div className="group">
              <div className="row">
                <SettingsIcon>
                  <Icon.Plane size={24} />
                </SettingsIcon>
                <span className="row-main">
                  <div className="row-title">Mode avion</div>
                </span>
                <Switch label="Mode avion" checked={s.airplane} onChange={(v) => set({ airplane: v })} />
              </div>
            </div>
            {state.overrides.ghostSetting && (
              <div className="group" style={{ marginTop: 10 }}>
                <div className="row">
                  <span className="row-main">
                    <div className="row-title">{state.overrides.ghostSetting.value.split('::')[0]}</div>
                  </span>
                  <Switch label={state.overrides.ghostSetting.value.split('::')[0]} checked={false} onChange={() => dispatch({ type: 'ghost/activate' })} />
                </div>
              </div>
            )}
            <p className="footnote">
              {s.airplane ? 'Échanges suspendus. L’historique et les fichiers restent consultables.' : 'Ces réglages concernent uniquement le téléphone du jeu.'}
            </p>
            <div className="group" style={{ marginTop: 20 }}>
              <Row to="datetime" icon={<SettingsIcon><Icon.Calendar size={26} /></SettingsIcon>} label="Date et heure" value={s.clockAuto ? 'Automatique' : `${s.manualTime} (manuel)`} />
              <Row to="sound" icon={<SettingsIcon><Icon.Sound size={26} /></SettingsIcon>} label="Audio" value={s.sound ? 'Activé' : 'Désactivé'} />
              <Row to="a11y" icon={<SettingsIcon><Icon.Bolt size={26} /></SettingsIcon>} label="Accessibilité" />
              <Row to="help" icon={<SettingsIcon><Icon.Help size={26} /></SettingsIcon>} label="Aide" />
              <Row to="save" icon={<SettingsIcon><Icon.Gear size={26} /></SettingsIcon>} label="Sauvegarde" />
            </div>
            <p className="footnote">Aucune autorisation de votre appareil n’est demandée.</p>
          </>
        )}
        {page === 'datetime' && <DateTimePage />}
        {page === 'sound' && (
          <>
            <div className="group" style={{ marginTop: 8 }}>
              <div className="row">
                <span className="row-main">
                  <div className="row-title">Sons du jeu</div>
                </span>
                <Switch label="Sons du jeu" checked={s.sound} onChange={(v) => set({ sound: v })} />
              </div>
              <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label htmlFor="vol" className="row-title">
                  Volume du jeu : {Math.round(s.volume * 100)} %
                </label>
                <input id="vol" className="volume" type="range" min={0} max={1} step={0.05} value={s.volume} disabled={!s.sound} onChange={(e) => set({ volume: Number(e.target.value) })} />
              </div>
            </div>
            <p className="footnote">Aucun son n’est joué avant votre première interaction. Le son est conseillé mais jamais indispensable : toute information sonore a un équivalent écrit.</p>
          </>
        )}
        {page === 'a11y' && (
          <>
            <div className="group" style={{ marginTop: 8 }}>
              {(
                [
                  ['reduceMotion', 'Réduire les animations', 'Transitions quasi instantanées.'],
                  ['reduceFlashes', 'Atténuer les effets brusques', 'Les apparitions soudaines et clignotements des enquêtes sont adoucis.'],
                  ['largeText', 'Texte plus grand', 'Augmente la taille des textes principaux.'],
                ] as const
              ).map(([k, label, sub]) => (
                <div className="row" key={k}>
                  <span className="row-main">
                    <div className="row-title">{label}</div>
                    <div className="row-sub">{sub}</div>
                  </span>
                  <Switch label={label} checked={s[k]} onChange={(v) => set({ [k]: v })} />
                </div>
              ))}
            </div>
            <p className="footnote">Aucune information n’est transmise uniquement par la couleur ou le son.</p>
          </>
        )}
        {page === 'help' && (
          <div className="group" style={{ marginTop: 8 }}>
            <button
              className="row"
              onClick={() => {
                nav.home();
                dispatch({ type: 'intro/replay' });
              }}
            >
              <span className="row-main">
                <div className="row-title">Revoir l’introduction</div>
              </span>
              <Icon.Chevron className="chev" size={18} />
            </button>
            <button
              className="row"
              onClick={() => {
                const resume = state.tutorial.status === 'dismissed' && state.tutorial.step !== 'openMail';
                dispatch({ type: 'tutorial/start' });
                nav.home();
                nav.showToast(resume ? 'Exercice repris là où vous l’aviez laissé' : 'Exercice lancé : suivez le guide en haut de l’écran');
              }}
            >
              <span className="row-main">
                <div className="row-title">{state.tutorial.status === 'dismissed' && state.tutorial.step !== 'openMail' ? 'Reprendre l’exercice' : 'Refaire l’exercice de prise en main'}</div>
                <div className="row-sub">Un exemple, sans lien avec les enquêtes.</div>
              </span>
              <Icon.Chevron className="chev" size={18} />
            </button>
            <Row to="apps" icon={null} label="Les applications" />
            <Row to="save" icon={null} label="La sauvegarde" />
          </div>
        )}
        {page === 'apps' && (
          <div className="help-text">
            <h3>Mail</h3>
            <p>Les demandes d’enquête arrivent ici. Les pièces jointes sont consultables avant d’accepter. « Accepter l’enquête » ouvre l’affaire ; « Garder pour plus tard » la conserve sans rien déclencher.</p>
            <h3>Messages</h3>
            <p>Vos échanges avec les clients. Choisissez parmi les réponses proposées : de nouvelles questions apparaissent selon vos découvertes.</p>
            <h3>Photos</h3>
            <p>Les images et vidéos reçues, et les copies que vous avez conservées. Pincez, utilisez la molette ou les boutons pour agrandir. Touchez un détail pour l’examiner.</p>
            <h3>Dossiers</h3>
            <p>Un dossier par enquête acceptée : objectif, observations, pièces, historique et aide en trois niveaux.</p>
            <h3>Notes</h3>
            <p>Un carnet libre. Vos notes ne sont jamais interprétées comme des réponses.</p>
            <h3>Réglages</h3>
            <p>Date, heure, mode avion, son et accessibilité du téléphone du jeu. Ils n’affectent pas votre appareil réel.</p>
            <h3>Revenir à l’accueil</h3>
            <p>Touchez la barre en bas de l’écran (ou balayez-la vers le haut). Chaque application garde votre position.</p>
          </div>
        )}
        {page === 'save' && <SavePage />}
      </div>
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

function Wheel({ value, max, label, onChange }: { value: number; max: number; label: string; onChange: (v: number) => void }) {
  const wrap = (v: number) => (v + max) % max;
  return (
    <div
      className="wheel-col"
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max - 1}
      aria-valuetext={pad(value)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') (e.preventDefault(), onChange(wrap(value + 1)));
        if (e.key === 'ArrowDown') (e.preventDefault(), onChange(wrap(value - 1)));
        if (e.key === 'PageUp') (e.preventDefault(), onChange(wrap(value + 10)));
        if (e.key === 'PageDown') (e.preventDefault(), onChange(wrap(value - 10)));
      }}
    >
      <button className="arrow" tabIndex={-1} onClick={() => onChange(wrap(value - 1))} aria-label={`${label} : moins un`}>
        <Icon.Up size={18} />
      </button>
      <button className="near" tabIndex={-1} onClick={() => onChange(wrap(value - 1))} aria-hidden="true">
        {pad(wrap(value - 1))}
      </button>
      <div className="current">{pad(value)}</div>
      <button className="near" tabIndex={-1} onClick={() => onChange(wrap(value + 1))} aria-hidden="true">
        {pad(wrap(value + 1))}
      </button>
      <button className="arrow" tabIndex={-1} onClick={() => onChange(wrap(value + 1))} aria-label={`${label} : plus un`}>
        <Icon.Down size={18} />
      </button>
    </div>
  );
}

function DateTimePage() {
  const { state, dispatch } = useGame();
  const s = state.settings;
  const time = usePhoneTime(s);
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings/update', patch });
  const [hh, mm] = s.manualTime.split(':').map(Number);
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return (
    <>
      <div className="group" style={{ marginTop: 8 }}>
        <div className="row">
          <span className="row-main">
            <div className="row-title">Réglage automatique</div>
          </span>
          <Switch
            label="Réglage automatique"
            checked={s.clockAuto}
            onChange={(v) =>
              // En passant en manuel, on part de l'heure affichée.
              set(v ? { clockAuto: true } : { clockAuto: false, manualDate: iso(time.date), manualTime: time.hhmm })
            }
          />
        </div>
      </div>
      <p className="footnote">Les réglages concernent uniquement le téléphone du jeu. En manuel, la date et l’heure restent fixes.</p>
      <div className="group" style={{ marginTop: 16, opacity: s.clockAuto ? 0.5 : 1 }}>
        <label className="row">
          <span className="row-main">
            <div className="row-title">Date</div>
          </span>
          <input
            className="date-input"
            type="date"
            disabled={s.clockAuto}
            value={s.clockAuto ? iso(time.date) : s.manualDate}
            min="1990-01-01"
            max="2099-12-31"
            onChange={(e) => e.target.value && set({ manualDate: e.target.value })}
          />
        </label>
        <div className="row">
          <span className="row-main">
            <div className="row-title">Heure</div>
          </span>
          <span className="row-value amber">{time.hhmm}</span>
        </div>
        {!s.clockAuto && (
          <div className="wheel">
            <Wheel label="Heures" value={hh} max={24} onChange={(v) => set({ manualTime: `${pad(v)}:${pad(mm)}` })} />
            <Wheel label="Minutes" value={mm} max={60} onChange={(v) => set({ manualTime: `${pad(hh)}:${pad(v)}` })} />
          </div>
        )}
      </div>
      <div className="big-time" aria-live="polite">
        <small>Heure du téléphone</small>
        <div>{time.hhmm}</div>
        <small>{time.fullDate}</small>
      </div>
    </>
  );
}

function SavePage() {
  const { dispatch } = useGame();
  const nav = useNav();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="note-box" style={{ marginTop: 8 }}>
        La progression est enregistrée dans ce navigateur. Effacer les données du site peut supprimer votre partie.
      </div>
      <p className="footnote">Sont conservés : introduction, exercice, enquêtes, conversations, observations, notes, copies et réglages. Aucun compte n’est nécessaire.</p>
      <div className="group" style={{ marginTop: 20 }}>
        <button className="row" onClick={() => setConfirm(true)} style={{ color: 'var(--red)' }}>
          <Icon.Trash size={20} />
          <span className="row-main">
            <div className="row-title">Réinitialiser la partie…</div>
          </span>
        </button>
      </div>
      {confirm && (
        <Dialog title="Effacer toute la progression ?" onClose={() => setConfirm(false)}>
          <p>Enquêtes, notes, copies et réglages seront supprimés de ce navigateur. Cette action est définitive.</p>
          <div className="stack">
            <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Annuler
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirm(false);
                nav.home();
                dispatch({ type: 'reset' });
              }}
            >
              Tout effacer
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
