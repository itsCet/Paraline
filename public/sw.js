/**
 * Paraline — jeu jouable hors ligne après la première visite.
 * - Page : réseau d'abord, copie en cache si le réseau manque.
 * - Code (/assets, noms versionnés) et médias (/media) : cache d'abord.
 * - L'application envoie la liste des médias à mettre en cache en arrière-plan.
 * Le cache porte la version du build (?v=…) : les anciens sont supprimés à l'activation.
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `paraline-${VERSION}`;
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/media/system/logo.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('paraline-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function rangeFromCache(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req.url, { ignoreSearch: true, ignoreVary: true });
  if (!hit) return fetch(req);
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const start = m && m[1] ? Number(m[1]) : 0;
  const end = m && m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': hit.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put('/', res.clone());
    return res;
  } catch {
    return (await cache.match("/", { ignoreVary: true })) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Lecture audio/vidéo par plages : servie depuis le fichier complet en cache s'il existe.
  if (req.headers.has('range')) {
    if (url.pathname.startsWith('/media/')) e.respondWith(rangeFromCache(req));
    return;
  }
  if (req.mode === 'navigate') return e.respondWith(networkFirst(req));
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/media/')) return e.respondWith(cacheFirst(req));
});

// Mise en cache des médias en arrière-plan, sur demande de l'application.
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const u of e.data.urls) {
        if (await cache.match(u, { ignoreVary: true })) continue;
        try {
          const res = await fetch(u);
          if (res.ok) await cache.put(u, res);
        } catch {
          /* hors ligne : on réessaiera à la prochaine visite */
        }
      }
    }),
  );
});
