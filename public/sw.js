const CACHE_NAME = 'bioattend-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline attendance
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

// Push notifications for manual clock-in requests
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New attendance notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'approve',
        title: 'Approve',
        icon: '/icons/approve.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BioAttend', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'approve') {
    // Handle approve action
    event.waitUntil(
      clients.openWindow('/faculty/attendance')
    );
  } else if (event.action === 'dismiss') {
    // Handle dismiss action
    console.log('Notification dismissed');
  } else {
    // Handle default click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline attendance data when connection is restored
async function syncAttendanceData() {
  try {
    // Get offline attendance data from IndexedDB
    const offlineData = await getOfflineAttendanceData();
    
    if (offlineData.length > 0) {
      // Send to server
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceData: offlineData })
      });

      if (response.ok) {
        // Clear offline data after successful sync
        await clearOfflineAttendanceData();
        console.log('Attendance data synced successfully');
      }
    }
  } catch (error) {
    console.error('Failed to sync attendance data:', error);
  }
}

// Helper functions for IndexedDB operations
async function getOfflineAttendanceData() {
  // Implementation would depend on your IndexedDB setup
  return [];
}

async function clearOfflineAttendanceData() {
  // Implementation would depend on your IndexedDB setup
  console.log('Offline attendance data cleared');
}
