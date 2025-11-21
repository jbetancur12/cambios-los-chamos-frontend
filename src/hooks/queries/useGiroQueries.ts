import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro } from '@/types/api'

interface GirosListParams {
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export function useGirosList(params?: GirosListParams) {
  const queryString = params
    ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value)
          }
          return acc
        }, {} as Record<string, string>)
      ).toString()
    : ''

  return useQuery({
    queryKey: ['giros', params],
    queryFn: async () => {
      const response = await api.get<{ giros: Giro[]; pagination: any }>(
        `/giro/list${queryString ? `?${queryString}` : ''}`
      )
      return response.giros
    },
  })
}

export function useGiroDetail(giroId: string | null) {
  return useQuery({
    queryKey: ['giro', giroId],
    queryFn: async () => {
      if (!giroId) return null
      return await api.get<Giro>(`/giro/${giroId}`)
    },
    enabled: !!giroId,
  })
}

export function useRecentGiros(limit: number = 5) {
  return useQuery({
    queryKey: ['giros', 'recent'],
    queryFn: async () => {
      const response = await api.get<{ giros: Giro[] }>(
        `/dashboard/recent-giros?limit=${limit}`
      )
      return response.giros
    },
    staleTime: 1000 * 60, // 1 minuto
  })
}
