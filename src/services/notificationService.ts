// services/notificationService.ts — Servicio central de notificaciones PWA (FCM)
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'
import { firebaseConfig } from '@/firebase/firebase-config'
import { api } from '@/lib/api'

const VAPID_KEY = 'BI_FEgdPPC_vjcRTYCK7tSJVM9wF7m9KN8pBR2FlNgpYnN1SbM7r2j6UEe5q6W1Ornf5ZkrlKtztmCu9A8j0iuQ'

export interface NotificationPayload {
  title?: string
  body?: string
  data?: Record<string, string>
}

let messaging: Messaging | null = null

export function isNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && window.isSecureContext
  )
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

async function getMessagingInstance(): Promise<Messaging> {
  if (!messaging) {
    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
  }
  return messaging
}

async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/custom-sw/firebase-messaging-sw.js')
}

async function saveTokenToBackend(userId: string, token: string): Promise<void> {
  try {
    await api.post('/notifications/save-token', { userId, token })
    console.log(`[FCM] Token guardado en la DB para usuario: ${userId}`)
  } catch (error) {
    console.error('[FCM] Error en saveTokenToBackend:', error)
  }
}

/**
 * Pide permiso de notificación (opt-in) y guarda el token FCM del usuario.
 * Devuelve 'granted' | 'denied'.
 */
export async function requestPermission(userId: string): Promise<'granted' | 'denied'> {
  if (!isNotificationSupported()) {
    console.warn('[FCM] Notificaciones no soportadas en este contexto')
    return 'denied'
  }

  try {
    console.log('[FCM] Solicitando permiso de notificaciones...')
    const instance = await getMessagingInstance()
    const registration = await registerFcmServiceWorker()

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Permiso de notificaciones denegado')
      return 'denied'
    }

    console.log('[FCM] Permiso concedido. Obteniendo token...')
    const token = await getToken(instance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[FCM] Token FCM obtenido')
      await saveTokenToBackend(userId, token)
    } else {
      console.warn('[FCM] No se pudo obtener el token.')
      return 'denied'
    }

    return 'granted'
  } catch (error) {
    console.error('[FCM] Error obteniendo token:', error)
    return 'denied'
  }
}

/**
 * Re-obtiene y re-guarda el token por sesión.
 * FCM v12 modular no expone onTokenRefresh; refrescar en cada sesión
 * cubre la rotación de token entre sesiones.
 */
export async function refreshToken(userId: string): Promise<void> {
  if (getPermissionState() !== 'granted') return

  try {
    const instance = await getMessagingInstance()
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(instance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (token) {
      await saveTokenToBackend(userId, token)
    }
  } catch (error) {
    console.error('[FCM] Error refrescando token:', error)
  }
}

/**
 * Escucha mensajes en primer plano (app abierta). Devuelve unsubscribe.
 */
export async function listenForegroundMessages(handler: (payload: NotificationPayload) => void): Promise<() => void> {
  if (!isNotificationSupported()) return () => {}

  try {
    const instance = await getMessagingInstance()
    await registerFcmServiceWorker().catch(() => {})
    return onMessage(instance, handler)
  } catch (error) {
    console.error('[FCM] Error configurando listener de foreground:', error)
    return () => {}
  }
}

// --- Pub/sub de cambios de permiso (para re-renderizar UI) ---
const permissionChangeListeners = new Set<() => void>()

export function subscribePermissionChanges(listener: () => void): () => void {
  permissionChangeListeners.add(listener)
  return () => {
    permissionChangeListeners.delete(listener)
  }
}

export function emitPermissionChanged(): void {
  permissionChangeListeners.forEach((listener) => listener())
}
