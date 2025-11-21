import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Minorista, MinoristaTransaction } from '@/types/api'

export interface MinoristaTransactionsParams {
  minoristaId?: string
  page?: number
  limit?: number
  startDate?: string | null
  endDate?: string | null
}

export interface MinoristaTransactionsResponse {
  transactions: MinoristaTransaction[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Hook for fetching current minorista (uses /minorista/me endpoint)
export function useMinoristaBalance(userRole?: string) {
  return useQuery({
    queryKey: ['minorista', 'me'],
    queryFn: async () => {
      const response = await api.get<{ minorista: Minorista }>('/minorista/me')
      return response.minorista
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: userRole === 'MINORISTA',
  })
}

// Hook for fetching minorista transactions with pagination
export function useMinoristaTransactions(params: MinoristaTransactionsParams) {
  const { minoristaId = '', page = 1, limit = 50, startDate = null, endDate = null } = params

  return useQuery({
    queryKey: ['minoristaTransactions', minoristaId, page, limit, startDate, endDate],
    queryFn: async () => {
      if (!minoristaId) return { transactions: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }

      let url = `/minorista/${minoristaId}/transactions?page=${page}&limit=${limit}`

      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }

      const response = await api.get<MinoristaTransactionsResponse>(url)
      return response
    },
    enabled: !!minoristaId,
  })
}
