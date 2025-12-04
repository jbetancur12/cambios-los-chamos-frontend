import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
      },

      // Archivos estáticos incluidos en precache
      includeAssets: [
        'firebase-messaging-sw/firebase-messaging-sw.js',
        'icons/icon-48x48.png',
        'icons/icon-72x72.png',
        'icons/icon-96x96.png',
        'icons/icon-128x128.png',
        'icons/icon-144x144.png',
        'icons/icon-152x152.png',
        'icons/icon-192x192.png',
        'icons/icon-256x256.png',
        'icons/icon-384x384.png',
        'icons/icon-512x512.png',
        'apple-touch-icon.png'
      ],

      // Manifest Web App
      manifest: {
        name: 'Cambios los Chamos',
        short_name: 'Chamos',
        description: 'PWA para gestionar giros y transferencias',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'fullscreen',
        start_url: '/',
        scope: '/',

        icons: [
          { src: '/icons/icon-48x48.png', sizes: '48x48', type: 'image/png' },
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      // --- CONFIGURACIÓN DE WORKBOX ---
      workbox: {
        disableDevLogs: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.port === '3000' || url.hostname === 'localhost',
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.origin.includes('firebase.googleapis.com'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.origin.includes('fcm.googleapis.com'),
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => url.origin.includes('googletagmanager.com'),
            handler: 'NetworkOnly'
          },
        ],
        globIgnores: ['firebase-messaging-sw/**'],
        navigateFallbackDenylist: [/firebase-messaging-sw/],
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com', 'cambiosloschamo.com', 'app.cambiosloschamo.com'],
    // allowedHosts: true
  },
})
