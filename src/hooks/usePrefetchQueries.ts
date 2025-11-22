import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro } from '@/types/api'
import type { ExchangeRate } from '@/types/api'

/**
 * Hook para prefetch de queries
 * Carga datos antes de que sean necesarios para mejorar la percepción de velocidad
 *
 * Uso:
 * const { prefetchGiros, prefetchExchangeRate } = usePrefetchQueries()
 *
 * // En un link que lleva a GirosPage
 * <Link to="/giros" onMouseEnter={() => prefetchGiros()}>
 *   Ver Giros
 * </Link>
 */
export function usePrefetchQueries() {
  const queryClient = useQueryClient()

  return {
    /**
     * Prefetch lista de giros cuando el usuario está cerca de navegar
     */
    prefetchGiros: (params?: {
      status?: string
      dateFrom?: string
      dateTo?: string
      page?: number
      limit?: number
    }) => {
      queryClient.prefetchQuery({
        queryKey: ['giros', params],
        queryFn: async () => {
          const response = await api.get<{ giros: Giro[] }>('/giros', {
            params: {
              page: params?.page || 1,
              limit: params?.limit || 20,
              status: params?.status,
              dateFrom: params?.dateFrom,
              dateTo: params?.dateTo,
            },
          })
          return response.giros
        },
      })
    },

    /**
     * Prefetch detalle de un giro específico
     */
    prefetchGiroDetail: (giroId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['giro', giroId],
        queryFn: async () => {
          const response = await api.get<{ giro: Giro }>(`/giros/${giroId}`)
          return response.giro
        },
      })
    },

    /**
     * Prefetch tasa de cambio actual
     */
    prefetchCurrentExchangeRate: () => {
      queryClient.prefetchQuery({
        queryKey: ['exchangeRate', 'current'],
        queryFn: async () => {
          const response = await api.get<{ rate: ExchangeRate }>('/exchange-rate/current')
          return response.rate
        },
      })
    },

    /**
     * Prefetch historial de tasas de cambio
     */
    prefetchExchangeRateHistory: (limit: number = 20) => {
      queryClient.prefetchQuery({
        queryKey: ['exchangeRate', 'history', limit],
        queryFn: async () => {
          const response = await api.get<{ rates: ExchangeRate[] }>('/exchange-rate/history', {
            params: { limit },
          })
          return response.rates
        },
      })
    },

    /**
     * Prefetch todas las cuentas bancarias
     */
    prefetchBankAccounts: () => {
      queryClient.prefetchQuery({
        queryKey: ['bankAccounts', 'all'],
        queryFn: async () => {
          const response = await api.get<{
            bankAccounts: any[]
          }>('/bank-account/all')
          return response.bankAccounts
        },
      })
    },

    /**
     * Prefetch siguiente página de giros
     * Útil cuando el usuario está viendo la página 1 y probablemente verá la página 2
     */
    prefetchNextPage: (currentPage: number, params?: any) => {
      queryClient.prefetchQuery({
        queryKey: ['giros', { ...params, page: currentPage + 1 }],
        queryFn: async () => {
          const response = await api.get<{ giros: Giro[] }>('/giros', {
            params: {
              page: currentPage + 1,
              limit: 20,
              ...params,
            },
          })
          return response.giros
        },
      })
    },

    /**
     * Prefetch siguiente mes de giros
     * Anticipar cuando el usuario filtre por mes siguiente
     */
    prefetchNextMonth: () => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      queryClient.prefetchQuery({
        queryKey: [
          'giros',
          {
            dateFrom: nextMonth.toISOString().split('T')[0],
            dateTo: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).toISOString().split('T')[0],
          },
        ],
        queryFn: async () => {
          const response = await api.get<{ giros: Giro[] }>('/giros', {
            params: {
              dateFrom: nextMonth.toISOString().split('T')[0],
              dateTo: new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).toISOString().split('T')[0],
            },
          })
          return response.giros
        },
      })
    },

    /**
     * Prefetch "próximos giros" (para dashboard)
     */
    prefetchRecentGiros: (limit: number = 5) => {
      queryClient.prefetchQuery({
        queryKey: ['giros', 'recent', limit],
        queryFn: async () => {
          const response = await api.get<{ giros: Giro[] }>('/giros', {
            params: { limit, sort: '-createdAt' },
          })
          return response.giros
        },
      })
    },
  }
}

/**
 * Hook para prefetch automático cuando se acerca hover a un elemento
 *
 * Uso:
 * const prefetch = usePrefetchOnHover()
 * <Link
 *   to="/giros"
 *   onMouseEnter={() => prefetch.giros()}
 * >
 *   Giros
 * </Link>
 */
export function usePrefetchOnHover() {
  const { prefetchGiros, prefetchCurrentExchangeRate, prefetchBankAccounts, prefetchRecentGiros, prefetchGiroDetail } =
    usePrefetchQueries()

  return {
    giros: () => prefetchGiros(),
    exchangeRate: () => prefetchCurrentExchangeRate(),
    bankAccounts: () => prefetchBankAccounts(),
    giroDetail: (giroId: string) => prefetchGiroDetail(giroId),

    /**
     * Prefetch múltiples queries a la vez
     */
    prefetchDashboard: () => {
      prefetchCurrentExchangeRate()
      prefetchRecentGiros(5)
      prefetchBankAccounts()
    },
  }
}
