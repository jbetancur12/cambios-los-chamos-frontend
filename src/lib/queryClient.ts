import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

/**
 * Queries are retried only for transient failures: the request never got a response
 * (network error, unparseable body) or the server answered 5xx / 429. Other 4xx errors
 * (401, 403, 404, 422...) will not change by retrying, so they fail immediately.
 */
const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false
  if (error instanceof ApiError && error.status !== undefined) {
    return error.status >= 500 || error.status === 429
  }
  return true
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

      // Refetch al reconectar red (socket revive y necesita snapshot fresco)
      refetchOnReconnect: true,

      // Solo reintenta fallos transitorios (red, 5xx, 429), máximo 2 veces
      retry: shouldRetryQuery,

      // Delay entre reintentos: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },

    mutations: {
      // Never retry mutations automatically: a POST that reached the server but failed on the way
      // back would be sent twice and could duplicate giros or recharges.
      retry: false,
    },
  },
})
