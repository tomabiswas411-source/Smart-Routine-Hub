// Smart Routine Hub - Service Worker v3
// Enhanced with Sound, Badge, and Push Notifications

const CACHE_NAME = 'smart-routine-hub-v3';
const NOTIFICATION_CACHE = 'notifications-cache-v1';
const NOTIFICATION_SOUND = '/notification.mp3';

// Files to cache for offline use
const STATIC_CACHE_URLS = [
  '/',
  '/?view=master-calendar',
  '/?view=student',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-152x152.png',
  '/icons/badge-72x72.png',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/notification.mp3',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW v3] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v3] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW v3] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== NOTIFICATION_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests - always fetch fresh
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event - Enhanced with sound and badge
self.addEventListener('push', (event) => {
  console.log('[SW v3] Push notification received');
  
  let data = {
    title: 'Smart Routine Hub',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'routine-notification',
    requireInteraction: false,
    silent: false,
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Determine notification type for different behaviors
  const isUrgent = data.type === 'class_cancelled' || data.type === 'class_rescheduled';
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'routine-notification',
    vibrate: isUrgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
    requireInteraction: isUrgent || data.requireInteraction,
    silent: data.silent || false,
    renotify: true,
    timestamp: data.data?.timestamp || Date.now(),
    data: {
      ...data.data,
      soundEnabled: true
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Store notification for badge count
  storeNotificationForBadge(data);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        // Update app badge if supported
        if ('setAppBadge' in navigator) {
          updateBadgeCount();
        }
        
        // Notify all clients about new notification
        return self.clients.matchAll({ type: 'window' });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NEW_NOTIFICATION',
            data: data
          });
        });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v3] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    // Update badge count
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .then(() => {
        // Clear badge after viewing
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge();
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW v3] Notification closed');
  
  // Track notification dismissal
  event.waitUntil(
    caches.open(NOTIFICATION_CACHE).then((cache) => {
      return cache.put(
        new Request('notification-dismissed'),
        new Response(JSON.stringify({ timestamp: Date.now() }))
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW v3] Background sync event:', event.tag);
  
  if (event.tag === 'sync-schedules') {
    event.waitUntil(syncSchedules());
  }
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync schedules when back online
async function syncSchedules() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('sync-schedule')) {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW v3] Sync failed:', error);
  }
}

// Sync notifications
async function syncNotifications() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('pending-notification')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse?.json();
        
        if (data) {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW v3] Notification sync failed:', error);
  }
}

// Store notification for badge tracking
async function storeNotificationForBadge(data) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const badgeData = {
      id: data.tag || `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false
    };
    await cache.put(
      new Request(`badge-${badgeData.id}`),
      new Response(JSON.stringify(badgeData))
    );
  } catch (error) {
    console.error('[SW v3] Failed to store badge data:', error);
  }
}

// Update badge count
async function updateBadgeCount() {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    const requests = await cache.keys();
    const unreadCount = requests.filter(r => r.url.includes('badge-')).length;
    
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        await navigator.setAppBadge(unreadCount);
      } else {
        await navigator.clearAppBadge();
      }
    }
  } catch (error) {
    console.error('[SW v3] Failed to update badge:', error);
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW v3] Message received:', event.data.type);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'SUBSCRIBE_PUSH') {
    subscribeToPushNotifications(event.data.subscription);
  }
  
  if (event.data.type === 'PLAY_SOUND') {
    // Handle sound play request from app
    playNotificationSound();
  }
  
  if (event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }
  
  if (event.data.type === 'UPDATE_BADGE') {
    updateBadgeCount();
  }
  
  if (event.data.type === 'MARK_NOTIFICATIONS_READ') {
    markNotificationsRead(event.data.ids);
  }
});

// Subscribe to push notifications
async function subscribeToPushNotifications(subscription) {
  try {
    // Send subscription to server
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    if (response.ok) {
      console.log('[SW v3] Successfully subscribed to push notifications');
    }
  } catch (error) {
    console.error('[SW v3] Failed to subscribe:', error);
  }
}

// Play notification sound
async function playNotificationSound() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(NOTIFICATION_SOUND);
    
    if (response) {
      const audioContext = new (self.AudioContext || self.webkitAudioContext)();
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  } catch (error) {
    console.error('[SW v3] Failed to play sound:', error);
  }
}

// Mark notifications as read
async function markNotificationsRead(ids) {
  try {
    const cache = await caches.open(NOTIFICATION_CACHE);
    
    for (const id of ids) {
      const request = new Request(`badge-${id}`);
      const response = await cache.match(request);
      
      if (response) {
        const data = await response.json();
        data.read = true;
        await cache.put(request, new Response(JSON.stringify(data)));
      }
    }
    
    updateBadgeCount();
  } catch (error) {
    console.error('[SW v3] Failed to mark as read:', error);
  }
}

console.log('[SW v3] Service Worker loaded');
