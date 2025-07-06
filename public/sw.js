// Service Worker for Push Notifications
// JAOTHUI Farm Management System

const CACHE_NAME = 'jaothui-farm-v1'
const OFFLINE_URL = '/offline.html'

// Cache essential resources
const CACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell')
        return cache.addAll(CACHE_RESOURCES)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request)
      })
      .catch(() => {
        // Return a fallback response for failed requests
        return new Response(
          JSON.stringify({ error: 'Network unavailable' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        )
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  let notificationData = {
    title: 'JAOTHUI Farm Management',
    body: 'คุณมีการแจ้งเตือนใหม่',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'farm-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'ดูรายละเอียด',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'ปิด',
        icon: '/icon-192x192.png'
      }
    ]
  }

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        ...data,
        // Ensure required fields
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
      }
    } catch (error) {
      console.error('Failed to parse push data:', error)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {},
      timestamp: Date.now(),
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data || {}

  if (action === 'dismiss') {
    // Just close the notification
    return
  }

  // Handle click action (view or default click)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              // Send message to client about notification click
              if (notificationData.url || notificationData.path) {
                client.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  data: notificationData
                })
              }
            })
          }
        }

        // Open new window if no existing window found
        const urlToOpen = notificationData.url || 
                         (notificationData.path ? `${self.location.origin}${notificationData.path}` : self.location.origin)
        
        return clients.openWindow(urlToOpen)
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
  
  // Track notification dismissal
  const notificationData = event.notification.data || {}
  
  // Send analytics or tracking data if needed
  if (notificationData.trackingId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'dismissed',
        notificationId: notificationData.trackingId,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('Failed to track notification dismissal:', error)
    })
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any offline actions that need to be synced
      handleBackgroundSync()
    )
  }
})

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Check for any pending offline actions
    // This could include notification acknowledgments, user actions, etc.
    console.log('Handling background sync')
    
    // Example: sync pending notification reads
    const pendingReads = await getStoredPendingReads()
    if (pendingReads.length > 0) {
      await syncNotificationReads(pendingReads)
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper functions for offline storage
async function getStoredPendingReads() {
  // Implementation would read from IndexedDB or localStorage
  return []
}

async function syncNotificationReads(pendingReads) {
  // Implementation would sync with server
  for (const read of pendingReads) {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(read)
      })
    } catch (error) {
      console.error('Failed to sync notification read:', error)
    }
  }
}

console.log('Service Worker loaded: JAOTHUI Farm Management')