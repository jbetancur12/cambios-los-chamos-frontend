import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

declare const process: { env: { NODE_ENV: string } }

interface QueryMetrics {
  queryKey: string
  callCount: number
  lastCallTime: Date
  dataSize?: number
  executionTime?: number
}

const queryMetrics = new Map<string, QueryMetrics>()

/**
 * Hook para monitorear queries y detectar overfetching
 * Uso: En App.tsx, llamar una sola vez:
 *
 * export function App() {
 *   useQueryMonitor()
 *   return <QueryClientProvider>...</QueryClientProvider>
 * }
 */
export function useQueryMonitor() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Escuchar cambios en el cache, pero SOLO cuando una query termina
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Solo contar cuando la query se completa exitosamente
      if (event.type !== 'updated') {
        return
      }

      const query = event.query
      const keyString = JSON.stringify(query.queryKey)

      // Solo contar si la query tiene datos (completada)
      if (!query.state.data) {
        return
      }

      const existing = queryMetrics.get(keyString) || {
        queryKey: keyString,
        callCount: 0,
        lastCallTime: new Date(),
        dataSize: 0,
        executionTime: 0,
      }

      existing.callCount += 1
      existing.lastCallTime = new Date()

      // Calcular tamaño aproximado de datos
      existing.dataSize = JSON.stringify(query.state.data).length

      queryMetrics.set(keyString, existing)

      // Log en desarrollo si se ejecuta muchas veces
      if (existing.callCount > 5 && process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ Query executed ${existing.callCount} times:`,
          keyString,
          `(${(existing.dataSize || 0) / 1024}KB)`
        )
      }
    })

    return () => unsubscribe()
  }, [queryClient])

  return {
    getMetrics: () => Array.from(queryMetrics.values()).sort((a, b) => b.callCount - a.callCount),
    resetMetrics: () => queryMetrics.clear(),
    getOverfetchedQueries: () => Array.from(queryMetrics.values()).filter((m) => m.callCount > 5),
  }
}
