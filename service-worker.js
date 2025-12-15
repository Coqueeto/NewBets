// Service Worker for AI Betting System
// Enables background sync and scheduled tasks

const CACHE_NAME = 'ai-betting-v5.2.1';
const urlsToCache = [
  '/NewBets/ai-betting-system.html',
  '/NewBets/'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch with cache fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background Sync for scheduled tasks
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered');
  if (event.tag === 'daily-analysis') {
    event.waitUntil(triggerDailyAnalysis());
  } else if (event.tag === 'daily-settlement') {
    event.waitUntil(triggerDailySettlement());
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Service Worker: Periodic sync triggered');
  if (event.tag === 'daily-betting-tasks') {
    event.waitUntil(checkAndRunScheduledTasks());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push notification received');
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🤖 AI Betting System';
  const options = {
    body: data.body || 'New betting analysis available',
    icon: '/NewBets/icon.png',
    badge: '/NewBets/badge.png',
    tag: 'ai-betting-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://coqueeto.github.io/NewBets/ai-betting-system.html')
  );
});

// Helper functions for scheduled tasks
async function triggerDailyAnalysis() {
  console.log('🌅 Service Worker: Triggering daily analysis at 6am CT');
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({ type: 'RUN_ANALYSIS' });
  } else {
    // Open the app if no clients
    await self.clients.openWindow('https://coqueeto.github.io/NewBets/ai-betting-system.html?auto=analyze');
  }
}

async function triggerDailySettlement() {
  console.log('🌙 Service Worker: Triggering daily settlement at 11pm CT');
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({ type: 'RUN_SETTLEMENT' });
  } else {
    // Open the app if no clients
    await self.clients.openWindow('https://coqueeto.github.io/NewBets/ai-betting-system.html?auto=settle');
  }
}

async function checkAndRunScheduledTasks() {
  const now = new Date();
  const ctTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = ctTime.getHours();
  
  // 6am CT - Analysis
  if (hour === 6) {
    await triggerDailyAnalysis();
  }
  // 11pm CT - Settlement
  else if (hour === 23) {
    await triggerDailySettlement();
  }
}
