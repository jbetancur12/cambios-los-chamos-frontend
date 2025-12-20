import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registrado:', swUrl)

      // Check for updates every hour
      if (registration) {
        setInterval(
          () => {
            registration.update().catch((err) => {
              console.error('Error checking for SW updates:', err)
            })
          },
          60 * 60 * 1000
        )
      }
    },
    onRegisterError(error) {
      console.error('Error al registrar Service Worker:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true)

      // Show persistent toast with update button
      toast(
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-sm">Nueva versión disponible</p>
              <p className="text-xs text-muted-foreground">Actualiza para ver los últimos cambios</p>
            </div>
          </div>
          <Button size="sm" onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
            Actualizar
          </Button>
        </div>,
        {
          duration: Infinity, // Persistent toast
          id: 'pwa-update',
          position: 'bottom-center',
          closeButton: false,
        }
      )
    }
  }, [needRefresh])

  const handleUpdate = () => {
    setShowPrompt(false)
    toast.dismiss('pwa-update')
    updateServiceWorker(true)
  }

  // Floating update button (optional - only shows if user dismissed the toast)
  if (showPrompt && !needRefresh) {
    return (
      <div className="fixed bottom-20 right-4 z-50 animate-bounce">
        <Button
          onClick={handleUpdate}
          className="rounded-full h-12 w-12 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          title="Actualizar aplicación"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return null
}
