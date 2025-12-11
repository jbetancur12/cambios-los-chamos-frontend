import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

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
  // Esto es útil para entornos donde el frontend y el backend están en el mismo dominio
  // o detrás de un proxy que maneja el enrutamiento.
  // Para desarrollo local, si el frontend está en 5173 y el backend en 3000,
  // se puede usar una URL absoluta con el puerto 3000.
  const hostname = window.location.hostname
  const protocol = window.location.protocol

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // En desarrollo local, asumir que el backend está en el puerto 3000
    return `${protocol}//${hostname}:3000`
  }

  // Para otros entornos (incluyendo devtunnels.ms o producción),
  // usar el mismo origen. Esto asume que el backend está disponible
  // en el mismo dominio/puerto que el frontend, posiblemente a través de un proxy.
  return window.location.origin
}

export function useGiroWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef<Map<string, Set<GiroEventListener>>>(new Map())

  // Inicializar la conexión al WebSocket
  useEffect(() => {
    try {
      const backendUrl = getBackendUrl()

      const socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      socket.on('connect', () => {
        // Notificar al servidor que el usuario se conectó
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.id) {
          const payload = {
            userId: user.id,
            role: user.role,
            minoristaId: user.minoristaId,
            transferencistaId: user.transferencistaId,
          }
          socket.emit('user:connected', payload)
        }
      })

      socket.on('disconnect', () => {})

      socket.on('connect_error', () => {})

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

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    } catch (error) {
      console.error('[WS] ❌ Error crítico al inicializar socket.io:', error)
    }
  }, [])

  // Función para emitir eventos locales
  const emitEvent = useCallback((eventType: string, event: GiroEvent) => {
    const listeners = listenersRef.current.get(eventType)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }, [])

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
