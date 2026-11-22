import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, LogoMark } from './icons';
import type { MediaDef, MediaVariant } from '../game/types';
import { thumbOf } from '../game/selectors';

export function NavBar({ back, onBack, title, right }: { back?: string; onBack?: () => void; title?: ReactNode; right?: ReactNode }) {
  if (!onBack && !title && !right) return <div style={{ height: 8, flex: 'none' }} />;
  return (
    <header className="navbar">
      {onBack ? (
        <button className="navbar-back" onClick={onBack} aria-label={back ? `Retour : ${back}` : 'Retour'}>
          <Icon.Back size={24} />
          {back && <span>{back}</span>}
        </button>
      ) : (
        <span className="navbar-side" />
      )}
      {title ? <div className="navbar-title">{title}</div> : <span />}
      <div className="navbar-side">{right}</div>
    </header>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" aria-hidden="true" />
    </span>
  );
}

export function Avatar({ initials, color, small }: { initials: string; color?: string; small?: boolean }) {
  return (
    <span className={`avatar${small ? ' sm' : ''}`} style={color ? { background: color } : undefined} aria-hidden="true">
      {initials}
    </span>
  );
}

/** État vide : par défaut, le motif de la porte de Paraline (signature du jeu). */
export function Empty({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="empty" role="status">
      {icon ?? <span className="door" aria-hidden="true"><LogoMark size={44} /></span>}
      <p>{children}</p>
    </div>
  );
}

/** Feuille en bas d'écran. Ferme sur Échap ou toucher hors de la feuille. */
export function Sheet({ onClose, label, children }: { onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        {children}
      </div>
    </div>
  );
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

const KIND_LABEL: Record<MediaDef['kind'], string> = { image: 'Image', video: 'Vidéo', audio: 'Audio', document: 'Document' };

export function KindIcon({ kind, size = 18 }: { kind: MediaDef['kind']; size?: number }) {
  if (kind === 'video') return <Icon.Video size={size} />;
  if (kind === 'audio') return <Icon.Audio size={size} />;
  if (kind === 'document') return <Icon.Doc size={size} />;
  return <Icon.Image size={size} />;
}

/** Pièce jointe en ligne : vignette, nom, type. Aucun bouton lecture sur une image fixe. */
export function AttachmentCard({ media, variant, onOpen }: { media: MediaDef; variant: MediaVariant; onOpen: () => void }) {
  const thumb = thumbOf(variant, media.kind);
  const meta = [KIND_LABEL[media.kind], media.durationLabel, media.sizeLabel].filter(Boolean).join(' · ');
  return (
    <button className="attachment" onClick={onOpen} aria-label={`Ouvrir ${media.name}, ${KIND_LABEL[media.kind].toLowerCase()}`}>
      <span className="attachment-thumb">
        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <KindIcon kind={media.kind} size={28} />}
        {(media.kind === 'video' || media.kind === 'audio') && (
          <span className="play" aria-hidden="true">
            <Icon.Play size={14} />
          </span>
        )}
      </span>
      <span className="attachment-info">
        <span className="attachment-name" style={{ display: 'block' }}>{media.name}</span>
        <span className="attachment-size">{meta}</span>
      </span>
      <Icon.Chevron className="chev" size={20} />
    </button>
  );
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return '00:00';
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
