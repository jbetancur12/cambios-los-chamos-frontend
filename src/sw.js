/* eslint-disable no-undef */
// Este archivo es inyectado por vite-plugin-pwa

// Importar Workbox
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.js')

// Usar la estrategia de precachear que inyecta Workbox
if (workbox) {
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
