/* Ohmee PWA Service Worker - 支持 Web Push */
const CACHE_NAME = 'ohmee-v1'
const STATIC_ASSETS = ['/', '/mobile/login', '/index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((r) => r || new Response('Offline'))
      )
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

/* Web Push: 收到推送时显示通知 */
self.addEventListener('push', (event) => {
  let data = { title: 'Ohmee', body: '您有新的消息' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }
  const options = {
    body: data.body || '您有新的消息',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: data.tag || 'ohmee-notification',
    data: { url: data.url || '/mobile/home' },
    requireInteraction: !!data.requireInteraction,
    vibrate: [200, 100, 200],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ohmee', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/mobile/home'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.location.origin + (url.startsWith('/') ? url : '/' + url))
      }
    })
  )
})
