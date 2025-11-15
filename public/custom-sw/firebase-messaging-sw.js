/** Firebase SW - NO usar ES modules */

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js")

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

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
      body: payload.notification.body,
      icon: "/icons/icon-192x192.png"
    }

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  )
})
