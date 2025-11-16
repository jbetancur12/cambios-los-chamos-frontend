import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useGiroWebSocket } from './useGiroWebSocket'

export interface RecentGiro {
  id: string
  beneficiaryName: string
  amountBs: number
  amountInput?: number
  currencyInput?: string
  status: string
  createdAt: string
  minoristaName?: string
  transferencistaNombre?: string
  bankName?: string
  earnings?: number
}

export function useRecentGiros(limit = 5) {
  const [giros, setGiros] = useState<RecentGiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useGiroWebSocket()

  const fetchGiros = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<{ giros: RecentGiro[] }>(`/api/dashboard/recent-giros?limit=${limit}`)
      setGiros(data.giros)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar giros recientes')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchGiros()
  }, [fetchGiros])

  // Subscribe to giro deleted events
  useEffect(() => {
    const unsubscribe = subscribe('giro:deleted', (event) => {
      setGiros((prevGiros) => prevGiros.filter((giro) => giro.id !== event.giro.id))
    })

    return unsubscribe
  }, [subscribe])

  // Subscribe to giro created events
  useEffect(() => {
    const unsubscribe = subscribe('giro:created', () => {
      // Refetch to get the complete list with the new giro
      fetchGiros()
    })

    return unsubscribe
  }, [subscribe, fetchGiros])

  // Subscribe to giro updated events
  useEffect(() => {
    const unsubscribe = subscribe('giro:updated', (event) => {
      setGiros((prevGiros) =>
        prevGiros.map((giro) =>
          giro.id === event.giro.id
            ? {
                ...giro,
                status: event.giro.status,
                amountBs: event.giro.amountBs,
              }
            : giro
        )
      )
    })

    return unsubscribe
  }, [subscribe])

  return { giros, loading, error, refetch: fetchGiros }
}
