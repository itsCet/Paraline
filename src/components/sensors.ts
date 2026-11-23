/**
 * Capteurs du téléphone (orientation, boussole). Sur iPhone, l'accès doit être demandé pendant un geste
 * du joueur ; sur Android et ailleurs, il est accordé d'office quand le capteur existe.
 */

type PermissionApi = { requestPermission?: () => Promise<string> };

/** Demande l'accès à l'orientation (et au mouvement). À appeler dans un gestionnaire de toucher. */
export function askOrientation(): Promise<boolean> {
  const DO = (window as unknown as { DeviceOrientationEvent?: PermissionApi }).DeviceOrientationEvent;
  const DM = (window as unknown as { DeviceMotionEvent?: PermissionApi }).DeviceMotionEvent;
  if (!DO) return Promise.resolve(false);
  const asks: Promise<string>[] = [];
  if (typeof DO.requestPermission === 'function') asks.push(DO.requestPermission());
  if (DM && typeof DM.requestPermission === 'function') asks.push(DM.requestPermission());
  if (!asks.length) return Promise.resolve(true);
  // Seul un refus explicite arrête : certains navigateurs répondent « prompt » et envoient quand même les mesures.
  return Promise.all(asks)
    .then((r) => r[0] !== 'denied')
    .catch(() => false);
}

/** Cap boussole (0 = nord, sens horaire) à partir d'un événement d'orientation, ou `null`. */
export function headingOf(e: DeviceOrientationEvent): number | null {
  const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
  if (typeof ios === 'number' && !Number.isNaN(ios)) return (ios + 360) % 360;
  if (e.absolute && typeof e.alpha === 'number') return (360 - e.alpha + 360) % 360;
  return null;
}

/** Écoute le cap boussole. Renvoie la fonction d'arrêt. */
export function watchHeading(cb: (deg: number) => void): () => void {
  const on = (e: Event) => {
    const h = headingOf(e as DeviceOrientationEvent);
    if (h !== null) cb(h);
  };
  window.addEventListener('deviceorientationabsolute', on);
  window.addEventListener('deviceorientation', on);
  return () => {
    window.removeEventListener('deviceorientationabsolute', on);
    window.removeEventListener('deviceorientation', on);
  };
}

/** Écart angulaire signé le plus court, en degrés (−180 à 180). */
export function angleDiff(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}
