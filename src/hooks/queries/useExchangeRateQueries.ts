import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExchangeRate } from '@/types/api'

export function useCurrentExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate', 'current'],
    queryFn: async () => {
      const response = await api.get<{ rate: ExchangeRate }>('/exchange-rate/current')
      return response.rate
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useExchangeRateHistory(limit?: number) {
  return useQuery({
    queryKey: ['exchangeRate', 'history', { limit }],
    queryFn: async () => {
      let url = '/exchange-rate/history'
      if (limit) {
        url += `?limit=${limit}`
      }
      const response = await api.get<{ rates: ExchangeRate[] }>(url)
      return response.rates
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
