import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { applyDedupConfig } from '@/lib/deduplication'
import type { ExchangeRate } from '@/types/api'

export function useCurrentExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate', 'current'],
    queryFn: async () => {
      const response = await api.get<{ rate: ExchangeRate }>('/exchange-rate/current')
      return response.rate
    },
    ...applyDedupConfig('NORMAL'), // 5 min - tasa cambia regularmente
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
    ...applyDedupConfig('LOW_PRIORITY'), // 24 horas - historial casi no cambia
  })
}
