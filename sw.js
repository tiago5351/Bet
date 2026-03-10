const CACHE = ‘bettrack-v15’;
const ASSETS = [’./index.html’, ‘./manifest.json’];

self.addEventListener(‘install’, e => {
e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
self.skipWaiting();
});

self.addEventListener(‘activate’, e => {
e.waitUntil(caches.keys().then(keys =>
Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
));
self.clients.claim();
});

self.addEventListener(‘fetch’, e => {
e.respondWith(
caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match(’./index.html’)))
);
});

self.addEventListener(‘notificationclick’, e => {
e.notification.close();
e.waitUntil(clients.matchAll({type:‘window’}).then(cs => {
if (cs.length) { cs[0].focus(); }
else { clients.openWindow(’/Bet’); }
}));
});

self.addEventListener(‘message’, e => {
if (e.data && e.data.type === ‘SCHEDULE_NOTIFICATIONS’) {
scheduleNotifications(e.data.bets);
}
});

function scheduleNotifications(bets) {
if (!bets || !bets.length) return;
const now = Date.now();
bets.forEach(b => {
if (!b.date || !b.time || b.status !== ‘pending’) return;
const betTime = new Date(b.date + ‘T’ + b.time + ‘:00’).getTime();
const notifyAt = betTime - 15 * 60 * 1000;
const delay = notifyAt - now;
if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
setTimeout(() => {
self.registration.showNotification(‘🎯 Apuesta en 15 min’, {
body: b.title + (b.market ? ’ — ’ + b.market : ‘’),
icon: ‘./icon-192.png’,
badge: ‘./icon-192.png’,
tag: ‘bet-’ + b.id,
requireInteraction: true
});
}, delay);
}
});
}
