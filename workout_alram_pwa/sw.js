/* workOut_alram service worker */
const CACHE = 'workout-alram-v12';
const SHELL = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './fallback-thumb.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 앱 셸: 캐시 우선 / 그 외(oEmbed·썸네일): 네트워크 우선 */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
});

/* 알림 클릭 → 유튜브 실행 + 열려있는 앱에 스누즈 중단 알리기 (F-05 · F-06) */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'alarm-clicked', alarmId: data.alarmId }));
    if (data.url) await self.clients.openWindow(data.url);
  })());
});
