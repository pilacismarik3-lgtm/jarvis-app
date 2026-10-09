// Pass-through worker (never caches, so updates always arrive) + push notifications for reminders.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 }))); });

function idbGet(k) { return new Promise(res => { const o = indexedDB.open('jarvis-sw', 1); o.onupgradeneeded = () => o.result.createObjectStore('kv'); o.onerror = () => res(null); o.onsuccess = () => { const r = o.result.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }; }); }

self.addEventListener('push', e => e.waitUntil((async () => {
  let titles = [];
  try {
    const cfg = await idbGet('cfg');
    if (cfg) { const r = await fetch(cfg.url + '/pending', { headers: { Authorization: 'Bearer ' + cfg.token } }); titles = (await r.json()).pending || []; }
  } catch {}
  if (!titles.length) titles = ['You have a reminder due'];
  for (const t of titles.slice(0, 5)) await self.registration.showNotification('Jarvis', { body: t, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'jarvis-' + t });
})()));

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
