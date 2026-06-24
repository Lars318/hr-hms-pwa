/**
 * Custom Service Worker additions compiled by next-pwa.
 * Handles Web Push events and notification clicks.
 * This file is merged into the generated public/sw.js at build time.
 */

// Lar klienten be en ventende SW om å aktivere umiddelbart (auto-oppdatering).
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var payload = { title: "HR/HMS", body: "Du har et nytt varsel.", url: "/dashboard" };
  try {
    var data = event.data.json();
    payload = Object.assign(payload, data);
  } catch (_) {
    // Ignore malformed payload
  }

  var title = payload.title || "HR/HMS";
  var options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: payload.url || "/dashboard",
      notificationId: payload.notificationId,
    },
    tag: payload.notificationId || "hr-hms-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var targetPath = (event.notification.data && event.notification.data.url) || "/dashboard";
  // Construct absolute URL from the SW origin
  var targetUrl = self.location.origin + targetPath;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clients) {
        // Focus existing window/tab if already open
        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
