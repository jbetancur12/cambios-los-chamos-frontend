/**
 * Cache Optimization Utilities
 *
 * Estrategias para optimizar el comportamiento del cache de React Query
 */

import { QueryClient, type InvalidateQueryFilters } from '@tanstack/react-query'

/**
 * Invalidate queries con patrón
 *
 * Util cuando necesitas invalidar múltiples queries similares
 *
 * Uso:
 * invalidateQueryByPattern(queryClient, ['giros'])
 * // Invalida: ['giros', { status: 'pending' }], ['giros', { page: 1 }], etc.
 */
export function invalidateQueryByPattern(
  queryClient: QueryClient,
  queryKey: (string | number)[]
) {
  return queryClient.invalidateQueries({
    queryKey,
    exact: false,
  } as InvalidateQueryFilters)
}

/**
 * Refetch solo si data está stale
 *
 * Útil para refetch selectivo sin bombardear con requests
 */
export function refetchIfStale(
  queryClient: QueryClient,
  queryKey: unknown[]
) {
  const query = queryClient.getQueryCache().find({ queryKey, exact: true })

  if (query && query.isStale()) {
    return queryClient.refetchQueries({ queryKey })
  }

  return Promise.resolve()
}

/**
 * Clear specific query data
 *
 * Elimina data de una query sin afectar otras
 */
export function clearQueryData(
  queryClient: QueryClient,
  queryKey: unknown[]
) {
  queryClient.setQueryData(queryKey, undefined)
}

/**
 * Clear all queries matching pattern
 *
 * Limpia múltiples queries
 */
export function clearQueryDataByPattern(
  queryClient: QueryClient,
  queryKeyPrefix: (string | number)[]
) {
  const cache = queryClient.getQueryCache()
  const queries = cache.findAll({ queryKey: queryKeyPrefix, exact: false })

  queries.forEach(query => {
    queryClient.setQueryData(query.queryKey, undefined)
  })
}

/**
 * Update query data optimistically
 *
 * Actualizar cache sin esperar a la respuesta del servidor
 *
 * Uso:
 * const updatedGiro = await updateGiroOptimistic(
 *   queryClient,
 *   ['giro', giroId],
 *   (old) => ({ ...old, status: 'completed' })
 * )
 */
export function updateQueryDataOptimistic<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (old: T | undefined) => T
): T {
  const oldData = queryClient.getQueryData<T>(queryKey)
  const newData = updater(oldData)
  queryClient.setQueryData(queryKey, newData)
  return newData
}

/**
 * Batch invalidations para evitar múltiples refetches
 *
 * Uso:
 * batchInvalidateQueries(queryClient, [
 *   ['giros'],
 *   ['dashboard'],
 *   ['exchange-rate']
 * ])
 *
 * Esto invalidará todas a la vez pero ejecutará
 * los refetches en paralelo
 */
export async function batchInvalidateQueries(
  queryClient: QueryClient,
  queryKeys: (unknown[])[]
) {
  const promises = queryKeys.map(queryKey =>
    invalidateQueryByPattern(queryClient, queryKey as any)
  )

  return Promise.all(promises)
}

/**
 * Garbage collection manual
 *
 * Limpiar cache viejo para liberar memoria
 * Útil si la app usa mucha memoria
 */
export function garbageCollectCache(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()

  let removed = 0

  queries.forEach(query => {
    // Remover queries sin observadores (no se están usando)
    if (query.getObserversCount() === 0) {
      const now = Date.now()
      const lastAccessTime = query.state.dataUpdatedAt

      // Si no se ha accedido en 5 minutos, remover
      if (now - lastAccessTime > 5 * 60 * 1000) {
        cache.remove(query)
        removed++
      }
    }
  })

  console.log(`🧹 Garbage collection: removed ${removed} queries`)
  return removed
}

/**
 * Cache persistence strategy
 *
 * Persiste cache en localStorage para offline support
 * o inicialización más rápida
 */
export class CacheStorage {
  private prefix = 'rq_cache_'

  save(queryKey: unknown[], data: unknown, ttl: number = 24 * 60 * 60 * 1000) {
    const key = this.prefix + JSON.stringify(queryKey)
    const expiry = Date.now() + ttl

    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          expiry,
        })
      )
    } catch (e) {
      console.warn('Failed to save cache to localStorage', e)
    }
  }

  load(queryKey: unknown[]): unknown | null {
    const key = this.prefix + JSON.stringify(queryKey)

    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const { data, expiry } = JSON.parse(item)

      // Check if expired
      if (Date.now() > expiry) {
        localStorage.removeItem(key)
        return null
      }

      return data
    } catch (e) {
      console.warn('Failed to load cache from localStorage', e)
      return null
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(this.prefix)
      )
      keys.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      console.warn('Failed to clear localStorage cache', e)
    }
  }
}

/**
 * Hook para usar cache storage
 *
 * Uso en un hook:
 * export function useGirosList(params) {
 *   const cacheStorage = new CacheStorage()
 *
 *   return useQuery({
 *     queryKey: ['giros', params],
 *     queryFn: async () => {
 *       // Intentar cargar del localStorage primero
 *       const cached = cacheStorage.load(['giros', params])
 *       if (cached) return cached
 *
 *       // Si no, hacer request
 *       const data = await api.get('/giros')
 *       cacheStorage.save(['giros', params], data)
 *       return data
 *     },
 *   })
 * }
 */
