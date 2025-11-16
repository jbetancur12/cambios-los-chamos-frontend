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

  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // Si está en DevTunnel, usa el mismo dominio sin puerto
  if (hostname.includes('devtunnels.ms')) {
    return `${protocol}//${hostname}`
  }

  // Si accedes desde localhost, usa localhost:3000
  // Si accedes desde una IP (ej: 192.168.40.15), usa esa IP:3000
  return `http://${hostname}:3000`
}

export function useGiroWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef<Map<string, Set<GiroEventListener>>>(new Map())

  // Inicializar la conexión al WebSocket
  useEffect(() => {
    try {
      const backendUrl = getBackendUrl()
      console.log('[WS] Conectando a:', backendUrl)
      const socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      socket.on('connect', () => {
        console.log('[WS] Conectado:', socket.id)

        // Notificar al servidor que el usuario se conectó
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.id) {
          socket.emit('user:connected', {
            userId: user.id,
            role: user.role,
            minoristaId: user.minoristaId,
            transferencistaId: user.transferencistaId,
          })
        }
      })

      socket.on('disconnect', () => {
        console.log('[WS] Desconectado')
      })

      socket.on('connect_error', (error) => {
        console.error('[WS] Error de conexión:', error)
      })

      // Registrar listeners para eventos de giro
      socket.on('giro:created', (event: GiroEvent) => {
        console.log('[WS] Giro creado:', event.giro.id)
        emitEvent('giro:created', event)
      })

      socket.on('giro:updated', (event: GiroEvent) => {
        console.log('[WS] Giro actualizado:', event.giro.id, 'Tipo:', event.changeType)
        emitEvent('giro:updated', event)
      })

      socket.on('giro:processing', (event: GiroEvent) => {
        console.log('[WS] Giro procesando:', event.giro.id)
        emitEvent('giro:processing', event)
      })

      socket.on('giro:executed', (event: GiroEvent) => {
        console.log('[WS] Giro ejecutado:', event.giro.id)
        emitEvent('giro:executed', event)
      })

      socket.on('giro:returned', (event: GiroEvent) => {
        console.log('[WS] Giro devuelto:', event.giro.id, 'Razón:', event.reason)
        emitEvent('giro:returned', event)
      })

      socket.on('giro:deleted', (data: { giroId: string; timestamp: string }) => {
        console.log('[WS] Giro eliminado:', data.giroId)
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
      console.error('[WS] Error al conectar:', error)
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
