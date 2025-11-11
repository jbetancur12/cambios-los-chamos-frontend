import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

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

  const fetchGiros = async () => {
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
  }

  useEffect(() => {
    fetchGiros()
  }, [limit])

  return { giros, loading, error, refetch: fetchGiros }
}
