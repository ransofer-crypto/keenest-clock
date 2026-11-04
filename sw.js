/* Keenest clock service worker: keeps the app shell for offline starts; always asks the server first. */
const CACHE = "kclock-v9";
const SHELL = ["./", "index.html", "supabase.js", "manifest.webmanifest", "icons/clock-192.png", "icons/clock-apple-180.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-store" }).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || "שעון נוכחות", { body: d.body || "", icon: "icons/clock-192.png", badge: "icons/clock-192.png", lang: "he", dir: "rtl", data: { url: "./" } }));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.matchAll({ type: "window" }).then((cs) => cs.length ? cs[0].focus() : clients.openWindow("./"))); });
