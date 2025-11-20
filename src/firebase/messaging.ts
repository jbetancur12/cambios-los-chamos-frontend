// firebase/messaging.ts
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { firebaseConfig } from './firebase-config'
import { api } from '@/lib/api'

let messaging: ReturnType<typeof getMessaging> | null = null

async function loadMessaging() {
  if (!messaging) {
    // 🔥 Asegurar que el SW esté registrado ANTES
    const registration = await navigator.serviceWorker.register('/custom-sw/firebase-messaging-sw.js')

    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)

    return { messaging, registration }
  }

  // Si ya estaba cargado
  const registration = await navigator.serviceWorker.ready
  return { messaging, registration }
}

async function saveTokenToBackend(userId: string, token: string): Promise<void> {
  try {
    await api.post('/api/notifications/save-token', { userId, token })
    console.log('Token guardado en la DB con éxito.')
  } catch (error) {
    console.error('Error en saveTokenToBackend:', error)
  }
}

export async function requestNotifyPermission(userId: string) {
  try {
    const { messaging, registration } = await loadMessaging()
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado')
      return
    }

    const token = await getToken(messaging, {
      vapidKey: 'BI_FEgdPPC_vjcRTYCK7tSJVM9wF7m9KN8pBR2FlNgpYnN1SbM7r2j6UEe5q6W1Ornf5ZkrlKtztmCu9A8j0iuQ',
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('TOKEN FCM:', token)
      await saveTokenToBackend(userId, token)
    }
  } catch (error) {
    console.error('Error obteniendo token:', error)
  }
}

// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import {getMessaging } from "firebase/messaging"
// import { firebaseConfig } from "./firebase-config";

// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// export const messaging = getMessaging(app);
