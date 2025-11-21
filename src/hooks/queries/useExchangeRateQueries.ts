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
    staleTime: 1000 * 60, // 1 minuto
  })
}

export function useExchangeRateHistory(limit: number = 20) {
  return useQuery({
    queryKey: ['exchangeRate', 'history', limit],
    queryFn: async () => {
      const response = await api.get<{
        rates: ExchangeRate[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`/exchange-rate/list?limit=${limit}`)
      return response.rates
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
