// firebase/messaging.ts — API legacy que delega en notificationService
import { requestPermission } from '@/services/notificationService'

/**
 * Solicita permiso de notificaciones y guarda el token FCM del usuario.
 * Mantiene el nombre original para compatibilidad (PushInitializer en App.tsx).
 */
export async function requestNotifyPermission(userId: string): Promise<'granted' | 'denied'> {
  return requestPermission(userId)
}
