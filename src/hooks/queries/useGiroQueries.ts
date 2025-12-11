import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { applyDedupConfig } from '@/lib/deduplication'
import type { Giro, MinoristaTransaction } from '@/types/api'

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
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value)
            }
            return acc
          },
          {} as Record<string, string>
        )
      ).toString()
    : ''

  return useQuery({
    queryKey: ['giros', params],
    queryFn: async () => {
      const response = await api.get<{
        giros: Giro[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`/giro/list${queryString ? `?${queryString}` : ''}`)
      return response.giros
    },
    ...applyDedupConfig('HIGH_PRIORITY'), // 30s - giros cambian rápido
  })
}

export function useGiroDetail(giroId: string | null) {
  return useQuery({
    queryKey: ['giro', giroId],
    queryFn: async () => {
      if (!giroId) return null
      const response = await api.get<{ giro: Giro } | Giro>(`/giro/${giroId}`)
      // The API returns the giro wrapped in a {giro: ...} object, so we unwrap it
      if (response && typeof response === 'object' && 'giro' in response) {
        return (response as { giro: Giro }).giro
      }
      return response as Giro
    },
    ...applyDedupConfig('HIGH_PRIORITY'), // 20s - detalles de giro
    enabled: !!giroId,
  })
}

export function useRecentGiros(limit: number = 5) {
  return useQuery({
    queryKey: ['giros', 'recent'],
    queryFn: async () => {
      const response = await api.get<{ giros: Giro[] }>(`/dashboard/recent-giros?limit=${limit}`)
      return response.giros
    },
    ...applyDedupConfig('HIGH_PRIORITY'), // 30s - giros recientes
  })
}

export function useMinoristaTransaction(giroId: string | null) {
  return useQuery({
    queryKey: ['giro', giroId, 'minorista-transaction'],
    queryFn: async () => {
      if (!giroId) return null
      return await api.get<MinoristaTransaction>(`/giro/${giroId}/minorista-transaction`)
    },
    enabled: !!giroId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
