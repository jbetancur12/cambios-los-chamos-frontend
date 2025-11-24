# Performance Monitoring Guide - React Query

Este documento explica cómo implementar cada item del Performance Monitoring para optimizar la aplicación en producción.

---

## 1. Query Key Monitoring para detectar Overfetching

### ¿Qué es Overfetching?
Es cuando una query se ejecuta más veces de las necesarias o trae más datos de los que se necesita.

### Implementación - Crear un custom hook para monitorear queries

```typescript
// src/hooks/useQueryMonitor.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface QueryMetrics {
  queryKey: string
  callCount: number
  lastCallTime: Date
  fetchDuration: number
}

const queryMetrics = new Map<string, QueryMetrics>()

export function useQueryMonitor() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Escuchar cambios en el cache
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const queries = queryClient.getQueryCache().getAll()

      queries.forEach(query => {
        const keyString = JSON.stringify(query.queryKey)
        const existing = queryMetrics.get(keyString) || {
          queryKey: keyString,
          callCount: 0,
          lastCallTime: new Date(),
          fetchDuration: 0,
        }

        existing.callCount += 1
        existing.lastCallTime = new Date()

        queryMetrics.set(keyString, existing)

        // Log en desarrollo si se ejecuta muchas veces
        if (existing.callCount > 5 && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Query executed ${existing.callCount} times:`, keyString)
        }
      })
    })

    return () => unsubscribe()
  }, [queryClient])

  return {
    getMetrics: () => Array.from(queryMetrics.values()),
    resetMetrics: () => queryMetrics.clear(),
  }
}
```

### Usar el monitor en App.tsx

```typescript
// src/App.tsx
import { useQueryMonitor } from '@/hooks/useQueryMonitor'

function App() {
  useQueryMonitor() // Llamar una sola vez en App

  return (
    <>
      <QueryClientProvider client={queryClient}>
        {/* Tu app */}
      </QueryClientProvider>
    </>
  )
}
```

### Crear un DevTools panel para visualizar (Opcional)

```typescript
// src/components/QueryMetricsPanel.tsx
import { useQueryMonitor } from '@/hooks/useQueryMonitor'
import { useState } from 'react'

export function QueryMetricsPanel() {
  const { getMetrics } = useQueryMonitor()
  const [visible, setVisible] = useState(false)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          padding: '8px 16px',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        📊 Metrics
      </button>
    )
  }

  const metrics = getMetrics().sort((a, b) => b.callCount - a.callCount)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 10000,
        background: '#1a1a1a',
        color: '#00ff00',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        maxHeight: '400px',
        overflow: 'auto',
        width: '400px',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Query Execution Metrics</div>
      <button
        onClick={() => setVisible(false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ff4444',
          color: '#fff',
          border: 'none',
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      {metrics.map(metric => (
        <div key={metric.queryKey} style={{ marginBottom: '8px', fontSize: '12px' }}>
          <div>Calls: {metric.callCount}</div>
          <div style={{ wordBreak: 'break-all', fontSize: '10px' }}>
            {metric.queryKey.substring(0, 100)}...
          </div>
          <hr style={{ margin: '4px 0', borderColor: '#444' }} />
        </div>
      ))}
    </div>
  )
}
```

---

## 2. Optimizar Stale Times según patrones de uso

### Análisis actual de stale times

```typescript
// Actualizar src/hooks/queries/* con tiempos más inteligentes

// ACTUAL (Conservador):
// - Giros: 1 minuto
// - Exchange Rate: 1 minuto (actual), 5 minutos (history)
// - Bank Accounts: 5 minutos
// - Banks: 1 hora

// OPTIMIZADO (basado en uso):
const STALE_TIMES = {
  // Datos que cambian RÁPIDO (usuario transacciona giros)
  GIROS_LIST: 30 * 1000, // 30 segundos
  GIRO_DETAIL: 20 * 1000, // 20 segundos

  // Datos que cambian LENTO (cotización cada hora aprox)
  EXCHANGE_RATE_CURRENT: 5 * 60 * 1000, // 5 minutos
  EXCHANGE_RATE_HISTORY: 30 * 60 * 1000, // 30 minutos

  // Datos que casi NO cambian
  BANKS_LIST: 24 * 60 * 60 * 1000, // 24 horas
  BANK_ACCOUNTS: 60 * 60 * 1000, // 1 hora

  // Datos de usuario (cambian muy lentamente)
  USER_PROFILE: 60 * 60 * 1000, // 1 hora
  MINORISTA_BALANCE: 2 * 60 * 1000, // 2 minutos
}

// Actualizar en cada hook:
export function useGirosList(params) {
  return useQuery({
    queryKey: ['giros', params],
    queryFn: fetchGiros,
    staleTime: STALE_TIMES.GIROS_LIST, // 30 seg en lugar de 1 min
  })
}
```

### Crear un dashboard para medir impacto

```typescript
// src/hooks/useStalTimePerformance.ts
interface PerformanceMetric {
  queryKey: string
  staleTimes: number // en ms
  cacheHits: number // cuántas veces sirvió cache
  networkCalls: number // cuántas veces fue a la red
  dataFreshness: 'hot' | 'warm' | 'cold' // categoría
}

export function useStalTimePerformance() {
  const queryClient = useQueryClient()
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])

  useEffect(() => {
    const updateMetrics = () => {
      const queries = queryClient.getQueryCache().getAll()
      const newMetrics = queries.map(query => ({
        queryKey: JSON.stringify(query.queryKey),
        staleTimes: query.getObserversCount(),
        cacheHits: query.state.dataUpdatedAt ? 1 : 0,
        networkCalls: 0, // Se puede mejorar con interceptor
        dataFreshness: 'warm' as const,
      }))
      setMetrics(newMetrics)
    }

    const interval = setInterval(updateMetrics, 5000) // Actualizar cada 5 seg
    return () => clearInterval(interval)
  }, [queryClient])

  return metrics
}
```

---

## 3. Implementar Pagination para listas grandes

### Actualmente: Sin paginación
- Giros: carga todos en una sola request
- Transacciones: carga todas en una sola request

### Después: Con paginación

```typescript
// src/hooks/queries/useGiroQueries.ts - ACTUALIZADO

interface PaginationParams {
  page: number
  pageSize: number
}

export function useGirosListPaginated(params: {
  status?: string
  dateFrom?: string
  dateTo?: string
  pagination: PaginationParams
}) {
  return useQuery({
    queryKey: ['giros', params],
    queryFn: async () => {
      const response = await api.get<{
        giros: Giro[]
        total: number
        page: number
        pageSize: number
      }>('/giros', {
        params: {
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page: params.pagination.page,
          limit: params.pagination.pageSize,
        },
      })
      return response
    },
    staleTime: STALE_TIMES.GIROS_LIST,
  })
}
```

### Usar en componente

```typescript
// src/pages/GirosPage.tsx - ACTUALIZADO

export function GirosPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20 // mostrar 20 por página

  const { data: result, isLoading } = useGirosListPaginated({
    status: selectedStatus,
    dateFrom,
    dateTo,
    pagination: { page, pageSize },
  })

  return (
    <div>
      {/* Lista de giros */}
      {result?.giros.map(giro => (
        <GiroCard key={giro.id} giro={giro} />
      ))}

      {/* Paginación */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>

        <span style={{ margin: '0 16px' }}>
          Página {page} de {Math.ceil((result?.total || 0) / pageSize)}
        </span>

        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!result || page >= Math.ceil(result.total / pageSize)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
```

### Backend: Agregar parámetros de paginación

```typescript
// backend/src/api/giros.ts - ACTUALIZAR

girosRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const status = req.query.status as string
  const dateFrom = req.query.dateFrom as string
  const dateTo = req.query.dateTo as string

  const skip = (page - 1) * limit

  // Filtrar y contar
  let query = Giro.find({
    ...(status && { status }),
    ...(dateFrom && { createdAt: { $gte: new Date(dateFrom) } }),
    ...(dateTo && { createdAt: { $lte: new Date(dateTo) } }),
  })

  const total = await query.countDocuments()

  const giros = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean()

  res.json(
    ApiResponse.success({
      giros,
      total,
      page,
      pageSize: limit,
    })
  )
})
```

---

## 4. Infinite Queries para Scroll-to-Load

### ¿Cuándo usar?
- Feed infinito de giros
- Transacciones con scroll infinito
- Cualquier lista donde el usuario "scroll hacia abajo para cargar más"

### Implementación

```typescript
// src/hooks/queries/useGiroQueries.ts - NUEVA FUNCIÓN

import { useInfiniteQuery } from '@tanstack/react-query'

export function useGirosInfinite(params?: {
  status?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useInfiniteQuery({
    queryKey: ['giros', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<{
        giros: Giro[]
        total: number
        page: number
        pageSize: number
        hasMore: boolean
      }>('/giros', {
        params: {
          page: pageParam,
          limit: 20,
          status: params?.status,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      })
      return response
    },
    // Función para obtener la página siguiente
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    staleTime: STALE_TIMES.GIROS_LIST,
  })
}
```

### Usar en componente con Intersection Observer

```typescript
// src/pages/GirosPage.tsx - VERSIÓN INFINITE

import { useRef, useEffect } from 'react'

export function GirosPageInfinite() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGirosInfinite()

  const lastItemRef = useRef<HTMLDivElement>(null)

  // Lazy load cuando se ve el último elemento
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div>
      {data?.pages.flatMap(page => page.giros).map((giro, idx) => (
        <div key={giro.id} ref={idx === data.pages.flatMap(p => p.giros).length - 1 ? lastItemRef : null}>
          <GiroCard giro={giro} />
        </div>
      ))}

      {isFetchingNextPage && <div>Cargando más...</div>}
    </div>
  )
}
```

---

## 5. Query Prefetching para anticipar cambios

```typescript
// src/hooks/queries/usePrefetch.ts

import { useQueryClient } from '@tanstack/react-query'

export function usePrefetchGiros() {
  const queryClient = useQueryClient()

  return {
    // Prefetch cuando el usuario navega cerca del GirosPage
    prefetchGiros: (params: any) => {
      queryClient.prefetchQuery({
        queryKey: ['giros', params],
        queryFn: () => api.get('/giros', { params }),
      })
    },

    // Prefetch el siguiente mes cuando se ve giros del mes actual
    prefetchNextMonth: () => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      queryClient.prefetchQuery({
        queryKey: ['giros', { month: nextMonth.getMonth() }],
        queryFn: () => api.get('/giros', { params: { month: nextMonth } }),
      })
    },
  }
}
```

### Usar prefetch

```typescript
// En un link/button que lleva a GirosPage
<Link to="/giros" onMouseEnter={() => usePrefetchGiros().prefetchGiros({})}>
  Giros
</Link>
```

---

## Resumen de Implementación

| Item | Complejidad | Beneficio | Prioridad |
|------|-----------|----------|-----------|
| Query Monitoring | Baja | Identificar overfetching | Alta |
| Optimize Stale Times | Media | Reducir network calls 20-30% | Alta |
| Pagination | Alta | Cargar menos datos inicialmente | Media |
| Infinite Queries | Media | Mejor UX para listas | Baja |
| Prefetching | Baja | Percepción de rapidez | Baja |

---

## Checklist de Implementación

- [ ] Crear `useQueryMonitor.ts`
- [ ] Crear `QueryMetricsPanel.tsx`
- [ ] Optimizar stale times basado en patrones
- [ ] Implementar paginación en GirosPage
- [ ] Implementar paginación en transacciones
- [ ] Crear `useGirosInfinite` hook
- [ ] Actualizar componentes para usar infinite queries
- [ ] Crear `usePrefetch.ts`
- [ ] Agregar prefetch a links principales
- [ ] Medir impacto con Google Lighthouse
- [ ] Documentar resultados en commit

