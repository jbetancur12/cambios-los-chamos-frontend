import { QueryClient } from '@tanstack/react-query'

interface AxiosErrorResponse {
  response?: {
    status: number
    data?: { message?: string }
  }
  message: string
}

/**
 * Configuración central de React Query
 * Define comportamiento de cache, retry, y otras opciones globales
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo antes de que una query se considere "stale" (desactualizada)
      staleTime: 1000 * 60 * 5, // 5 minutos por defecto

      // Tiempo antes de que el cache se limpie si no hay subscriptores
      gcTime: 1000 * 60 * 10, // 10 minutos (antiguo: cacheTime)

      // No refetch automáticamente al montar
      refetchOnMount: false,

      // No refetch al volver a la ventana
      refetchOnWindowFocus: false,

      // No refetch al reconectar
      refetchOnReconnect: false,

      // Retry con exponential backoff automático
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as AxiosErrorResponse
          const status = axiosError.response?.status ?? 0
          // No reintentar en errores 4xx excepto 429 (rate limit)
          if (status >= 400 && status < 500 && status !== 429) {
            return false
          }
        }

        // Reintentar máximo 3 veces
        return failureCount < 3
      },

      // Delay entre reintentos: 1s, 2s, 4s
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    mutations: {
      // Retry con exponential backoff para mutations
      retry: (failureCount, error: unknown) => {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as AxiosErrorResponse
          const status = axiosError.response?.status ?? 0
          // No reintentar en errores 4xx excepto 429
          if (status >= 400 && status < 500 && status !== 429) {
            return false
          }
        }

        // Reintentar máximo 2 veces para mutations
        return failureCount < 2
      },

      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
