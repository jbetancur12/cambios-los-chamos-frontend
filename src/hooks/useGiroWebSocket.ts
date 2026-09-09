import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'

export interface GiroUpdate {
  id: string
  beneficiaryName: string
  beneficiaryId: string
  bankName: string
  accountNumber: string
  phone: string
  amountInput: number
  currencyInput: string
  amountBs: number
  bcvValueApplied: number
  commission: number
  systemProfit: number
  minoristaProfit: number
  status: string
  executionType: string
  returnReason?: string
  proofUrl?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  minorista?: { id: string }
  transferencista?: {
    id: string
    user?: {
      id: string
      fullName: string
    }
  }
  rateApplied?: {
    id: string
    buyRate: number
    sellRate: number
    usd: number
    bcv: number
    isCustom: boolean
  }
  createdBy?: {
    id: string
    fullName: string
  }
}

export interface GiroEvent {
  giro: GiroUpdate
  timestamp: string
  changeType?: 'rate' | 'status' | 'beneficiary' | 'other'
  reason?: string
}

type GiroEventListener = (event: GiroEvent) => void

// Obtener URL del backend usando la misma lógica que el cliente API
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Si no hay VITE_API_URL, intentar usar una URL relativa o el mismo origen
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const port = window.location.port

  // En desarrollo local (localhost o 127.0.0.1) o LAN (192.168.x.x, etc)
  // Si estamos corriendo en puertos típicos de Vite (5173, 5174, etc),
  // asumimos que el backend está en el puerto 3000
  if (port === '5173' || port === '5174' || (port && parseInt(port) >= 5170 && parseInt(port) <= 5180)) {
    return `${protocol}//${hostname}:3000`
  }

  // Para otros entornos (producción, o si el puerto no es de dev frontend),
  // usar el mismo origen. Esto asume que el backend está disponible
  // en el mismo dominio/puerto que el frontend, posiblemente a través de un proxy.
  return window.location.origin
}

export function useGiroWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef<Map<string, Set<GiroEventListener>>>(new Map())

  // Función para emitir eventos locales
  const emitEvent = useCallback((eventType: string, event: GiroEvent) => {
    const listeners = listenersRef.current.get(eventType)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }, [])

  // Inicializar la conexión al WebSocket
  useEffect(() => {
    try {
      const backendUrl = getBackendUrl()

      const socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      })

      socket.on('connect', () => {
        // Notificar al servidor que el usuario se conectó
        // Usamos el usuario del contexto si está disponible, o localStorage como fallback
        // PERO lo crucial es re-emitir cuando el usuario cambia (ver efecto abajo)
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        if (storedUser.id) {
          const payload = {
            userId: storedUser.id,
            role: storedUser.role,
            minoristaId: storedUser.minoristaId, // Ahora guardado en localStorage
            transferencistaId: storedUser.transferencistaId,
          }
          socket.emit('user:connected', payload)
        }

        // Avisar a la capa de sync para refrescar estado al conectar/reconectar
        // (cubre giros que llegaron mientras la app estuvo en background)
        emitEvent('realtime:connected', {
          giro: {} as GiroUpdate,
          timestamp: new Date().toISOString(),
        })
      })

      socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          console.warn('[WS] Socket desconectado:', reason)
        }
      })

      socket.on('connect_error', (error) => {
        console.warn('[WS] Error de conexión del socket:', error.message)
      })

      // Registrar listeners para eventos de giro
      socket.on('giro:created', (event: GiroEvent) => {
        emitEvent('giro:created', event)
      })

      socket.on('giro:updated', (event: GiroEvent) => {
        emitEvent('giro:updated', event)
      })

      socket.on('giro:processing', (event: GiroEvent) => {
        emitEvent('giro:processing', event)
      })

      socket.on('giro:executed', (event: GiroEvent) => {
        emitEvent('giro:executed', event)
      })

      socket.on('giro:returned', (event: GiroEvent) => {
        emitEvent('giro:returned', event)
      })

      socket.on('giro:deleted', (data: { giroId: string; timestamp: string }) => {
        emitEvent('giro:deleted', {
          giro: { id: data.giroId } as GiroUpdate,
          timestamp: data.timestamp,
        })
      })

      socket.on('giro:assigned', (event: GiroEvent) => {
        emitEvent('giro:assigned', event)
      })

      // Eventos de Minorista
      socket.on('minorista:balance_updated', (payload: any) => {
        emitEvent('minorista:balance_updated', { ...payload, timestamp: new Date().toISOString() })
      })

      socket.on('minorista:transaction_updated', (payload: any) => {
        emitEvent('minorista:transaction_updated', { ...payload, timestamp: new Date().toISOString() })
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    } catch (error) {
      console.error('[WS] ❌ Error crítico al inicializar socket.io:', error)
    }
  }, [emitEvent])

  // Efecto para re-conectar cuando la app vuelve de background o recobra el foco
  // (el SO móvil suspende timers y el socket queda muerto al regresar)
  useEffect(() => {
    const tryReconnect = () => {
      const socket = socketRef.current
      if (!socket || socket.connected || socket.active) return
      console.warn('[WS] Reconectando socket tras volver a la app...')
      socket.connect()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tryReconnect()
      }
    }

    const onPageShow = (event: PageTransitionEvent) => {
      // Restauración desde bfcache: la página no se remonta, hay que revivir el socket
      if (event.persisted) {
        tryReconnect()
      }
    }

    const onOnline = () => tryReconnect()
    const onFocus = () => tryReconnect()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('online', onOnline)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Efecto para actualizar la identidad del socket cuando el usuario carga/cambia
  const { user } = useAuth()
  useEffect(() => {
    if (socketRef.current && user) {
      const payload = {
        userId: user.id,
        role: user.role,
        minoristaId: user.minoristaId,
        transferencistaId: user.transferencistaId,
      }
      // Re-emitir identidad para unirse a las rooms correctas
      socketRef.current.emit('user:connected', payload)
    }
  }, [user])

  // Suscribirse a eventos
  const subscribe = useCallback((eventType: string, listener: GiroEventListener) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)!.add(listener)

    // Retornar función para desuscribirse
    return () => {
      const listeners = listenersRef.current.get(eventType)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }, [])

  return {
    subscribe,
    isConnected: socketRef.current?.connected ?? false,
  }
}
