import { useEffect, useState } from 'react'
import { Bell, BellRing, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  requestPermission,
  getPermissionState,
  subscribePermissionChanges,
  emitPermissionChanged,
} from '@/services/notificationService'
import { cn } from '@/lib/utils'

interface NotificationBellButtonProps {
  className?: string
}

export function NotificationBellButton({ className }: NotificationBellButtonProps) {
  const { user } = useAuth()
  const [permission, setPermission] = useState(getPermissionState())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return subscribePermissionChanges(() => setPermission(getPermissionState()))
  }, [])

  if (!user || permission === 'unsupported') return null

  const handleClick = async () => {
    if (permission === 'denied') {
      toast.error('Notificaciones bloqueadas. Habilítalas en la configuración del navegador.')
      return
    }

    if (permission === 'granted') {
      toast.info('Notificaciones activadas para este dispositivo.')
      return
    }

    setLoading(true)
    const result = await requestPermission(user.id)
    setLoading(false)
    emitPermissionChanged()

    if (result === 'granted') {
      toast.success('Notificaciones activadas')
    } else {
      toast.error('Permiso de notificaciones denegado')
    }
  }

  const isEnabled = permission === 'granted'
  const Icon = loading ? Loader2 : isEnabled ? BellRing : permission === 'denied' ? BellOff : Bell

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      title={
        isEnabled
          ? 'Notificaciones activadas'
          : permission === 'denied'
            ? 'Notificaciones bloqueadas'
            : 'Activar notificaciones'
      }
      className={cn(className)}
    >
      <Icon className={cn('h-5 w-5', loading && 'animate-spin')} />
    </Button>
  )
}
