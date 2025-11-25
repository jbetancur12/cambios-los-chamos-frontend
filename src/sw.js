/* eslint-disable no-undef */
// Este archivo es inyectado por vite-plugin-pwa

// Importar Workbox
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.js')

// Skip waiting and claim clients immediately when a new version is available
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Usar la estrategia de precachear que inyecta Workbox
if (workbox) {
  // Enable skipWaiting and clientsClaim for immediate updates
  workbox.core.skipWaiting()
  workbox.core.clientsClaim()

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

  // Configurar runtimes caching
  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('localhost:3000'),
    new workbox.strategies.NetworkOnly({ cacheName: 'api-cache' })
  )

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkOnly({ cacheName: 'api-cache' })
  )

  // Fallback para navegación
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
    })
  )
}
