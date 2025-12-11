// firebase/messaging.ts
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { firebaseConfig } from './firebase-config'
import { api } from '@/lib/api'

let messaging: ReturnType<typeof getMessaging> | null = null

async function loadMessaging() {
  if (!messaging) {
    console.log('[FCM] Registrando Service Worker...')
    // 🔥 Asegurar que el SW esté registrado ANTES
    const registration = await navigator.serviceWorker.register('/custom-sw/firebase-messaging-sw.js')
    console.log('[FCM] Service Worker registrado:', registration)

    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
    console.log('[FCM] Firebase Messaging inicializado.')

    return { messaging, registration }
  }

  // Si ya estaba cargado
  const registration = await navigator.serviceWorker.ready
  console.log('[FCM] Reutilizando Service Worker existente.')
  return { messaging, registration }
}

async function saveTokenToBackend(userId: string, token: string): Promise<void> {
  try {
    await api.post('/notifications/save-token', { userId, token })
    console.log(`[FCM] Token guardado en la DB con éxito para usuario: ${userId}`)
  } catch (error) {
    console.error('[FCM] Error en saveTokenToBackend:', error)
  }
}

export async function requestNotifyPermission(userId: string) {
  try {
    console.log('[FCM] Solicitando permiso de notificaciones...')
    const { messaging, registration } = await loadMessaging()
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.warn('[FCM] Permiso de notificaciones denegado')
      return
    }

    console.log('[FCM] Permiso concedido. Obteniendo token...')

    const token = await getToken(messaging, {
      vapidKey: 'BI_FEgdPPC_vjcRTYCK7tSJVM9wF7m9KN8pBR2FlNgpYnN1SbM7r2j6UEe5q6W1Ornf5ZkrlKtztmCu9A8j0iuQ',
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[FCM] Token FCM obtenido:', token)
      await saveTokenToBackend(userId, token)
    } else {
      console.warn('[FCM] No se pudo obtener el token.')
    }
  } catch (error) {
    console.error('[FCM] Error obteniendo token:', error)
  }
}

// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import {getMessaging } from "firebase/messaging"
// import { firebaseConfig } from "./firebase-config";

// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// export const messaging = getMessaging(app);
