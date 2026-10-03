/** Firebase SW - NO usar ES modules */

importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyAD5-bN73tC0LMFMQXbEAlMP9-TIA3_ApM",
  authDomain: "cambios-los-chamos.firebaseapp.com",
  projectId: "cambios-los-chamos",
  storageBucket: "cambios-los-chamos.firebasestorage.app",
  messagingSenderId: "450827172534",
  appId: "1:450827172534:web:678ab3460dc2de6877c417",
  measurementId: "G-4BQCZ0EW53"
})

const messaging = firebase.messaging()
console.log("[firebase-messaging-sw.js] Firebase Messaging Service Worker Initialized")

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload)

  const notificationTitle = payload.notification?.title || "Nueva notificación"
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: payload.data?.giro_id || "giro-notification",
    data: {
      giro_id: payload.data?.giro_id || "",
      tipo: payload.data?.tipo || ""
    }
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const giroId = event.notification.data?.giro_id
  const url = giroId ? `/giros?giroId=${giroId}` : "/giros"

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus()
          return
        }
      }
      try {
        await clients.openWindow(url)
      } catch (error) {
        console.warn("[firebase-messaging-sw.js] openWindow fuera de scope:", error)
      }
    })()
  )
})
