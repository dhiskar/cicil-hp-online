/* ============================================================
   Service worker Cicilan HP Online
   - Menyimpan "shell" aplikasi agar bisa dibuka saat offline.
   - Menyimpan modul Firebase dari gstatic agar SDK tetap
     tersedia offline setelah satu kali login online.
   - Data tetap disinkronkan lewat Firestore (bukan lewat SW).
   ============================================================ */
'use strict';

var CACHE = 'cicilan-hp-v2.0-1';
var BASE = new URL('./', self.location.href);
function u(p) { return new URL(p, BASE).href; }
var SHELL = [
  u('./'),
  u('index.html'),
  u('manifest.webmanifest'),
  u('firebase-config.js'),
  u('icon-180.png'),
  u('icon-192.png'),
  u('icon-512.png'),
  u('icon-512-maskable.png')
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE && k.indexOf('cicilan-hp-') === 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Modul Firebase dari CDN: cache-first, lalu simpan. */
  if (url.origin === 'https://www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  /* Hanya tangani request same-origin. API Firebase (googleapis)
     dibiarkan lewat langsung ke jaringan. */
  if (url.origin !== self.location.origin) return;

  /* Konfigurasi: ambil versi terbaru, fallback ke cache saat offline. */
  if (url.pathname.slice(-'/firebase-config.js'.length) === '/firebase-config.js') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  /* Halaman: coba internet dulu supaya update langsung terlihat,
     kalau offline pakai salinan terakhir. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(u('index.html'), copy); });
        return res;
      }).catch(function () {
        return caches.match(u('index.html')).then(function (r) {
          return r || caches.match(u('./'));
        });
      })
    );
    return;
  }

  /* File pendukung (ikon/manifest): pakai cache dulu, lalu simpan yang baru. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    }).catch(function () {
      return caches.match(u('index.html'));
    })
  );
});
