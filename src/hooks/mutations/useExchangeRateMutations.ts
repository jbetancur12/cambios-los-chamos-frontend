import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ExchangeRate } from '@/types/api'

interface CreateExchangeRateInput {
  buyRate: number
  sellRate: number
  usd: number
  bcv: number
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateExchangeRateInput) => {
      const response = await api.post<{ data: ExchangeRate; message: string }>(
        '/exchange-rate/create',
        data
      )
      return { rate: response.data, message: response.message }
    },
    onSuccess: () => {
      // Invalidate both current rate and history
      queryClient.invalidateQueries({ queryKey: ['exchangeRate', 'current'] })
      queryClient.invalidateQueries({ queryKey: ['exchangeRate', 'history'] })
    },
  })
}
