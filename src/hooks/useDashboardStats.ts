import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface DashboardStats {
  girosCount: number
  girosLabel: string
  usersCount?: number
  volume?: number
  earnings?: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.get<DashboardStats>('/api/dashboard/stats')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}
