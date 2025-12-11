/**
 * Query Invalidation Utilities
 *
 * Estrategias para invalidar queries de manera granular sin afectar todo el cache
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Invalida queries de un usuario específico
 * Útil en UsersPage cuando editas o eliminas un usuario
 *
 * Uso:
 * invalidateUserQueries(queryClient, userId)
 */
export function invalidateUserQueries(queryClient: QueryClient, userId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['user', userId],
    }),
    queryClient.invalidateQueries({
      queryKey: ['users', 'list'],
    }),
  ])
}

/**
 * Invalida queries de un giro específico
 * Útil cuando un giro es actualizado en el detalle
 */
export function invalidateGiroQueries(queryClient: QueryClient, giroId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['giro', giroId],
    }),
    // Invalidate list queries but keep previous data visible
    queryClient.invalidateQueries({
      queryKey: ['giros'],
    }),
  ])
}

/**
 * Invalida queries de una cuenta bancaria específica
 */
export function invalidateBankAccountQueries(queryClient: QueryClient, accountId: string) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['bankAccount', accountId],
    }),
    queryClient.invalidateQueries({
      queryKey: ['bankAccounts'],
    }),
  ])
}

/**
 * Invalida todas las queries de reportes
 * Útil cuando cambias el rango de fechas
 */
export function invalidateReportQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ['reports'],
  })
}

/**
 * Invalida dashboard pero mantiene datos previos
 * Útil después de crear un giro
 */
export function invalidateDashboardQueries(queryClient: QueryClient, keepPreviousData = true) {
  const opts = keepPreviousData ? {} : undefined

  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['dashboard'],
      ...opts,
    }),
    queryClient.invalidateQueries({
      queryKey: ['giros', 'recent'],
      ...opts,
    }),
  ])
}

/**
 * Invalida queries de minorista (cuando cambias de usuario)
 */
export function invalidateMinoristaQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['minorista'],
    }),
    queryClient.invalidateQueries({
      queryKey: ['minoristas'],
    }),
  ])
}

/**
 * Invalida todas las queries de exchange rate
 */
export function invalidateExchangeRateQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ['exchangeRate'],
  })
}

/**
 * Invalida una query específica
 * Con validación de parámetros básica
 */
export async function smartInvalidateQuery(queryClient: QueryClient, queryKey: unknown[]) {
  // Valida que queryKey no esté vacío
  if (!queryKey || queryKey.length === 0) {
    console.warn('smartInvalidateQuery: queryKey is empty')
    return
  }

  // Invalida la query
  return queryClient.invalidateQueries({ queryKey })
}

/**
 * Invalida múltiples queries con un patrón, útil para limpiar cache
 */
export function invalidateQueriesByPattern(queryClient: QueryClient, patterns: string[][]) {
  return Promise.all(
    patterns.map((pattern) =>
      queryClient.invalidateQueries({
        queryKey: pattern,
      })
    )
  )
}
