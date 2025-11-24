import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro } from '@/types/api'

interface PaginationParams {
  page: number
  pageSize: number
}

interface GirosResponse {
  giros: Giro[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface GirosListParams {
  status?: string
  dateFrom?: string
  dateTo?: string
  pagination: PaginationParams
}

// Tiempos de actualización optimizados
const STALE_TIMES = {
  GIROS_LIST: 30 * 1000, // 30 segundos (datos que cambian rápido)
  GIRO_DETAIL: 20 * 1000, // 20 segundos
}

/**
 * Hook para obtener giros con paginación
 * Útil cuando tienes listas grandes (100+ elementos)
 *
 * Uso:
 * const { data, isLoading, hasNextPage } = useGirosListPaginated({
 *   status: 'pending',
 *   pagination: { page: 1, pageSize: 20 }
 * })
 */
export function useGirosListPaginated(params: GirosListParams) {
  return useQuery({
    queryKey: ['giros', 'paginated', params],
    queryFn: async () => {
      const response = await api.get<GirosResponse>('/giros', {
        params: {
          page: params.pagination.page,
          limit: params.pagination.pageSize,
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        },
      })
      return response
    },
    staleTime: STALE_TIMES.GIROS_LIST,
  })
}

/**
 * Hook para cargar giros infinitamente (scroll infinito)
 * Perfecta para implementar "load more" o scroll to load
 *
 * Uso:
 * const { data, isLoading, hasNextPage, fetchNextPage } = useGirosInfinite({
 *   status: 'completed'
 * })
 *
 * // En el JSX:
 * {data?.pages.flatMap(page => page.giros).map(giro => (...))}
 * {hasNextPage && <button onClick={() => fetchNextPage()}>Cargar más</button>}
 */
export function useGirosInfinite(params?: { status?: string; dateFrom?: string; dateTo?: string }) {
  return useInfiniteQuery({
    queryKey: ['giros', 'infinite', params],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await api.get<GirosResponse>('/giros', {
        params: {
          page: pageParam as number,
          limit: 20,
          status: params?.status,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      })
      return response
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.page ?? 0) + 1 : undefined),
    staleTime: STALE_TIMES.GIROS_LIST,
  })
}

/**
 * Hook alternativo a useGirosInfinite pero con mejor manejo de estado
 * Mantiene un contador de página interno
 */
export function useGirosInfiniteV2(params?: { status?: string; dateFrom?: string; dateTo?: string }) {
  return useInfiniteQuery({
    queryKey: ['giros', 'infinite-v2', params],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await api.get<GirosResponse>('/giros', {
        params: {
          page: (pageParam as number) + 1, // Convertir de 0-indexed a 1-indexed
          limit: 20,
          status: params?.status,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      })
      return response
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    staleTime: STALE_TIMES.GIROS_LIST,
  })
}
