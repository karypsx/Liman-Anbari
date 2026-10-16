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
