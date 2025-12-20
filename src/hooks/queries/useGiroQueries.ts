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
  showAllTraffic?: boolean
  search?: string
  transferencistaId?: string
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

  // Determinar staleTime dinámico
  const isVolatile =
    params?.status &&
    (params.status.includes('ASIGNADO') || params.status.includes('PROCESANDO') || params.status.includes('PENDIENTE'))

  // Si es volátil (ASIGNADO/PROCESANDO), caché corto (2s) para ver cambios rápidos
  // Si es histórico (COMPLETADO/ALL), mantenemos HIGH_PRIORITY (30s) para performance
  const dedupConfig = isVolatile
    ? { staleTime: 2000, gcTime: 1000 * 60, dedupeInterval: 500 }
    : applyDedupConfig('HIGH_PRIORITY')

  return useQuery({
    queryKey: ['giros', 'list', params], // Updated query key to distinct from 'totals'
    queryFn: async () => {
      const response = await api.get<{
        giros: Giro[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
        totals: {
          count: number
          cop: number
          bs: number
          minoristaProfit: number
          systemProfit: number
          bankCommission: number
        }
      }>(`/giro/list${queryString ? `?${queryString}` : ''}`)
      return response
    },
    ...dedupConfig,
  })
}

export function useGirosTotals(params?: GirosListParams) {
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
    queryKey: ['giros', 'totals', params],
    queryFn: async () => {
      const response = await api.get<{
        count: number
        cop: number
        bs: number
        minoristaProfit: number
        systemProfit: number
        bankCommission: number
      }>(`/giro/totals${queryString ? `?${queryString}` : ''}`)
      return response
    },
    // Keep totals slightly less volatile than the list, but still responsive
    staleTime: 5000,
    gcTime: 1000 * 60 * 5,
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
