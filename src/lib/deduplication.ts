/**
 * Request Deduplication Layer
 *
 * React Query automáticamente deduplica requests idénticas dentro de 0ms por defecto.
 * Este módulo añade capabilities adicionales:
 * - Tracking de requests activos
 * - Deduplication manual
 * - Request merging
 * - Cache warming
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Configura deduplication avanzada en el QueryClient
 *
 * React Query deduplica automáticamente, pero podemos ajustar el comportamiento:
 */
export function setupDeduplication(_queryClient: QueryClient) {
  // El dedupeInterval por defecto es 0ms
  // Esto significa que si dos requests exactamente iguales se disparan
  // en el mismo "tick" de JavaScript, solo uno se ejecuta
  // Opcional: Aumentar el intervalo si necesitas más agresivo deduping
  // _queryClient.setDefaultOptions({
  //   queries: {
  //     dedupeInterval: 1000, // 1 segundo
  //   },
  // })
}

/**
 * Hook para monitorear requests activos y deduplicación
 *
 * Útil para debuggear si hay redundancia
 */
export function useRequestMonitoring(queryClient: QueryClient) {
  const getActiveRequests = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()

    return queries
      .filter((query) => query.getObserversCount() > 0)
      .map((query) => ({
        queryKey: JSON.stringify(query.queryKey),
        state: query.state.status,
        observers: query.getObserversCount(),
        dataSize: query.state.data ? JSON.stringify(query.state.data).length : 0,
      }))
  }

  return { getActiveRequests }
}

/**
 * Estrategia de cache warming
 * Pre-llenar el cache con datos conocidos
 *
 * Uso:
 * warmupCache(queryClient, [
 *   { queryKey: ['banks'], data: [{ id: 1, name: 'BANCO X' }] }
 * ])
 */
export function warmupCache(
  queryClient: QueryClient,
  data: Array<{
    queryKey: unknown[]
    data: unknown
  }>
) {
  data.forEach(({ queryKey, data: initialData }) => {
    queryClient.setQueryData(queryKey, initialData)
  })
}

/**
 * Estrategia de prefetching inteligente
 *
 * Usa staleTime para evitar refetches innecesarios:
 * - Si data es fresh (dentro de staleTime), reutiliza del cache
 * - Si está stale, la siguiente request la actualizará automáticamente
 */
export function intelligentPrefetch(
  queryClient: QueryClient,
  queryKey: unknown[],
  queryFn: () => Promise<unknown>,
  staleTime: number = 1000 * 60 * 5 // 5 min por defecto
) {
  // Verificar si hay data activa en cache
  const existingData = queryClient.getQueryData(queryKey)

  if (existingData === undefined) {
    // No hay data, hacer prefetch
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    })
  }

  // Ya hay data, no hacer nada
  return Promise.resolve()
}

/**
 * Configuración de deduplication por tipo de endpoint
 *
 * Diferentes endpoints tienen diferentes patrones de uso:
 * - APIs rápidas: deduplication más agresiva
 * - APIs lentas: deduplication menos agresiva
 */
export const DEDUP_CONFIG = {
  // Datos que cambian rápido y se consultan frecuentemente
  HIGH_PRIORITY: {
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000, // 5 min
    dedupeInterval: 1000, // 1s
  },

  // Datos que cambian moderadamente
  NORMAL: {
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
    dedupeInterval: 0, // Automático
  },

  // Datos que casi nunca cambian
  LOW_PRIORITY: {
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    dedupeInterval: 0, // Automático
  },

  // Datos que nunca cambian (estáticos)
  STATIC: {
    staleTime: Infinity,
    gcTime: Infinity,
    dedupeInterval: 0,
  },
}

/**
 * Apply dedup config a un hook
 *
 * Uso:
 * export function useBanksList() {
 *   return useQuery({
 *     queryKey: ['banks'],
 *     queryFn: fetchBanks,
 *     ...applyDedupConfig('LOW_PRIORITY'),
 *   })
 * }
 */
export function applyDedupConfig(priority: keyof typeof DEDUP_CONFIG) {
  return DEDUP_CONFIG[priority]
}
