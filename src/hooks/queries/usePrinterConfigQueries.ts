import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PrinterConfig {
  name: string
  type: 'thermal' | 'injection'
}

export function usePrinterConfig() {
  return useQuery({
    queryKey: ['printerConfig'],
    queryFn: async () => {
      const response = await api.get<{ config: PrinterConfig | null }>('/printer/config')
      return response.config
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSetPrinterConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: PrinterConfig) => {
      await api.post('/printer/config', {
        name: config.name,
        type: config.type,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printerConfig'] })
    },
  })
}

export function useClearPrinterConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete('/printer/config')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printerConfig'] })
    },
  })
}
