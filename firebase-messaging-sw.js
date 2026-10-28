importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyD3ihduuP6neOrQzU4i33jYV9Cup_PkPGQ",
    authDomain: "limananbari.firebaseapp.com",
    projectId: "limananbari",
    storageBucket: "limananbari.firebasestorage.app",
    messagingSenderId: "17127953994",
    appId: "1:17127953994:web:b63b5774f42d894df938b3"
});

const messaging = firebase.messaging();

// Offline PWA shell. This is the same worker used by Firebase notifications.
const LIMAN_CACHE_NAME = "liman-app-shell-v7";
const LIMAN_APP_BASE = self.registration.scope;
const LIMAN_APP_FILES = [
    "./",
    "index.html",
    "style.css?v=151",
    "app-config.js?v=9",
    "script.js?v=78",
    "english-words.js?v=2",
    "manifest.json",
    "images/liman-logo-splash.png",
    "images/app-mark.png",
    "images/ikon-192.png",
    "images/ikon-512.png",
    "images/ikoon-192.png",
    "images/ikoon-512.png",
    "images/menu-home.png",
    "images/word-shuffle-icon.png",
    "images/appointment.png",
    "images/menu-journal.png",
    "images/menu-area.png",
    "images/menu-area2.png",
    "images/menu-reminders.png",
    "images/menu-about.png",
    "images/scan-icon.png",
    "images/mal-ver-icon.png",
    "images/liman-xerite-xetler.png",
    "vendor/jszip.min.js"
].map(path => new URL(path, LIMAN_APP_BASE).href);

// Static CDN libraries are cached for offline startup; token-bearing Google
// Apps Script requests and Firebase data requests are deliberately excluded.
const LIMAN_STATIC_CDN_HOSTS = new Set([
    "www.gstatic.com",
    "unpkg.com",
    "cdnjs.cloudflare.com",
    "cdn.sheetjs.com"
]);
const LIMAN_CDN_FILES = [
    "https://unpkg.com/html5-qrcode",
    "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js",
    "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-compat.js",
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(LIMAN_CACHE_NAME);
        await cache.addAll(LIMAN_APP_FILES);
        await Promise.allSettled(LIMAN_CDN_FILES.map(async url => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 7000);
            try {
                const response = await fetch(url, { mode: "cors", signal: controller.signal });
                if (response.ok) await cache.put(url, response);
            } catch (_) {
                // CDN assets can be added later by the runtime cache strategy.
            } finally {
                clearTimeout(timeout);
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter(name => name.startsWith("liman-app-shell-") && name !== LIMAN_CACHE_NAME)
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    const isLocal = url.origin === self.location.origin;
    const isStaticCdn = LIMAN_STATIC_CDN_HOSTS.has(url.hostname);
    if (!isLocal && !isStaticCdn) return;

    event.respondWith((async () => {
        const cache = await caches.open(LIMAN_CACHE_NAME);
        const cached = await cache.match(request)
            || (isLocal ? await cache.match(request, { ignoreSearch: true }) : null);

        if (request.mode === "navigate") {
            try {
                const response = await fetch(request);
                if (response.ok) await cache.put(request, response.clone());
                return response;
            } catch (_) {
                return cached || await cache.match(LIMAN_APP_BASE)
                    || await cache.match(new URL("index.html", LIMAN_APP_BASE).href)
                    || Response.error();
            }
        }

        if (cached) {
            if (isStaticCdn) {
                event.waitUntil(fetch(request).then(response => {
                    if (response.ok) return cache.put(request, response.clone());
                }).catch(() => {}));
            }
            return cached;
        }

        try {
            const response = await fetch(request);
            if (response.ok) await cache.put(request, response.clone());
            return response;
        } catch (_) {
            return Response.error();
        }
    })());
});

messaging.onBackgroundMessage(payload => {
    // FCM displays notification-payload messages automatically while the app is closed.
    // Avoid showing the same message a second time here. Data-only messages use this handler.
    if (payload.notification) return;

    const data = payload.data || {};
    const title = data.title || payload.notification?.title || "Liman Anbarı · Xatırlatma";
    const body = data.body || payload.notification?.body || "Xatırlatma vaxtınız yaxınlaşır.";
    const appPath = "/Liman-Anbari/";

    return self.registration.showNotification(title, {
        body,
        icon: `${appPath}images/ikoon-192.png`,
        badge: `${appPath}images/ikoon-192.png`,
        tag: data.tag || `liman-reminder-${data.reminderId || Date.now()}-${data.slot || "notice"}`,
        renotify: false,
        data: { url: appPath }
    });
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "/Liman-Anbari/", self.location.origin).href;
    event.waitUntil((async () => {
        const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of windows) {
            if (client.url.startsWith(self.location.origin) && "focus" in client) {
                await client.focus();
                return;
            }
        }
        if (clients.openWindow) await clients.openWindow(targetUrl);
    })());
});
