// TheCustomNest Service Worker for Push Notifications

// Cache name for offline support
const CACHE_NAME = 'thecustomnest-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let data = {
    title: 'TheCustomNest',
    body: 'You have a new notification',
    icon: '/Customnest pic.png',
    badge: '/Customnest pic.png',
    tag: 'customnest-notification',
    data: {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate,
    actions: getActionsForType(data.data?.type),
    // Sound - use default system sound
    // Renotify for new notifications of same tag
    renotify: true,
    // Use UTC timestamp for notifications
    timestamp: Date.now(),
  };

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      console.log('[SW] Notification shown:', data.title);
    }).catch((err) => {
      console.error('[SW] Error showing notification:', err);
    })
  );
});

// Get action buttons based on notification type
function getActionsForType(type) {
  switch (type) {
    case 'order':
      return [
        { action: 'view', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'custom-order':
      return [
        { action: 'view', title: 'View Request' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'review':
      return [
        { action: 'view', title: 'View Review' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'contact':
      return [
        { action: 'view', title: 'View Message' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [];
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.tag);

  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return;
  }

  // Default: open the admin dashboard
  const urlToOpen = '/admin';

  // Navigate based on notification type
  if (event.action === 'view' && event.notification.data) {
    const { type, orderId, requestId, reviewId, messageId } = event.notification.data;
    
    switch (type) {
      case 'order':
        urlToOpen = orderId ? `/admin/orders/${orderId}` : '/admin/orders';
        break;
      case 'custom-order':
        urlToOpen = requestId ? `/admin/custom-orders/${requestId}` : '/admin/custom-orders';
        break;
      case 'review':
        urlToOpen = '/admin/reviews';
        break;
      case 'contact':
        urlToOpen = '/admin/messages';
        break;
      default:
        urlToOpen = '/admin';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});