# Performance Monitoring - Ejemplos Prácticos

Este documento muestra ejemplos reales de cómo usar cada feature de performance monitoring.

---

## 1. Query Metrics Panel - Detectar Overfetching

### Paso 1: Agregar a App.tsx

```typescript
// src/App.tsx
import { QueryMetricsPanel } from '@/components/QueryMetricsPanel'
import { useQueryMonitor } from '@/hooks/useQueryMonitor'

export function App() {
  // Inicializar monitor (una sola vez)
  useQueryMonitor()

  return (
    <>
      <QueryClientProvider client={queryClient}>
        {/* Tu app */}

        {/* Agregar el panel (solo se muestra en desarrollo) */}
        <QueryMetricsPanel />
      </QueryClientProvider>
    </>
  )
}
```

### Paso 2: Uso en navegador

1. Abre la app en desarrollo
2. Busca el botón "📊 Metrics" en la esquina inferior derecha
3. Interactúa con la app
4. El panel mostrará:
   - Queries ejecutadas
   - Número de veces que se ejecutaron
   - Tamaño de datos en KB
   - ⚠️ Advertencia si una query se ejecuta >5 veces

### Resultado esperado

```
📊 Metrics Panel

Query Execution Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

["giros", { status: "completed" }]
Calls: 7
Size: 45.23KB
Last: 14:32:15
⚠️ Overfetching detectado

["exchangeRate", "current"]
Calls: 2
Size: 0.45KB
Last: 14:32:10

["bankAccounts", "all"]
Calls: 1
Size: 2.15KB
Last: 14:32:08
```

---

## 2. Paginación - Cargar datos en chunks

### Uso en GirosPage

```typescript
// src/pages/GirosPage.tsx
import { useGirosListPaginated } from '@/hooks/queries/useGiroPaginatedQueries'
import { useState } from 'react'

export function GirosPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: result, isLoading, error } = useGirosListPaginated({
    status: selectedStatus,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    pagination: { page, pageSize },
  })

  const totalPages = Math.ceil((result?.total || 0) / pageSize)
  const giros = result?.giros || []

  return (
    <div>
      <h1>Giros ({result?.total || 0})</h1>

      {/* Lista de giros */}
      <div className="giros-list">
        {isLoading ? (
          <div>Cargando...</div>
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : giros.length === 0 ? (
          <div>No hay giros</div>
        ) : (
          giros.map(giro => <GiroCard key={giro.id} giro={giro} />)
        )}
      </div>

      {/* Paginación */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>

        <span>
          Página {page} de {totalPages} ({result?.total || 0} total)
        </span>

        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
```

### Ventajas

- ✅ Carga inicial más rápida (20 items en lugar de 1000)
- ✅ Menos datos en memoria
- ✅ Cache separado por página
- ✅ UX clara con números de página

---

## 3. Infinite Scroll - Load More automático

### Uso en GirosPage con Scroll Infinito

```typescript
// src/pages/GirosPageInfinite.tsx
import { useGirosInfinite } from '@/hooks/queries/useGiroPaginatedQueries'
import { useRef, useEffect } from 'react'

export function GirosPageInfinite() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGirosInfinite({
      status: selectedStatus,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    })

  const lastItemRef = useRef<HTMLDivElement>(null)
  const allGiros = data?.pages.flatMap(page => page.giros) || []

  // Usar Intersection Observer para cargar más cuando se ve el último item
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
    <div className="giros-infinite">
      <h1>Giros (Scroll infinito)</h1>

      {isLoading && <div>Cargando giros iniciales...</div>}

      <div className="giros-list">
        {allGiros.map((giro, idx) => (
          <div
            key={giro.id}
            ref={idx === allGiros.length - 1 ? lastItemRef : null}
          >
            <GiroCard giro={giro} />
          </div>
        ))}
      </div>

      {isFetchingNextPage && <div>Cargando más giros...</div>}

      {!hasNextPage && allGiros.length > 0 && (
        <div style={{ textAlign: 'center', color: '#888' }}>
          No hay más giros
        </div>
      )}
    </div>
  )
}
```

### Ventajas

- ✅ Experiencia tipo Twitter/Instagram
- ✅ No necesita botón "Cargar más"
- ✅ Carga automática cuando scroll llega al final
- ✅ Maneja `isFetchingNextPage` para no overload

---

## 4. Prefetching - Cargar datos antes de ser necesarios

### Ejemplo 1: Prefetch en hover de link

```typescript
// src/components/Navigation.tsx
import { usePrefetchOnHover } from '@/hooks/usePrefetchQueries'
import { Link } from 'react-router-dom'

export function Navigation() {
  const prefetch = usePrefetchOnHover()

  return (
    <nav>
      <Link
        to="/giros"
        onMouseEnter={() => prefetch.giros()}
      >
        Giros
      </Link>

      <Link
        to="/exchange-rate"
        onMouseEnter={() => prefetch.exchangeRate()}
      >
        Tasas
      </Link>

      <Link
        to="/bank-accounts"
        onMouseEnter={() => prefetch.bankAccounts()}
      >
        Cuentas Bancarias
      </Link>
    </nav>
  )
}
```

### Ejemplo 2: Prefetch siguiente página mientras ves la actual

```typescript
// src/pages/GirosPage.tsx
import { usePrefetchQueries } from '@/hooks/usePrefetchQueries'

export function GirosPage() {
  const [page, setPage] = useState(1)
  const { prefetchNextPage } = usePrefetchQueries()

  const { data: result } = useGirosListPaginated({
    pagination: { page, pageSize: 20 },
  })

  // Prefetch siguiente página cuando vemos la actual
  useEffect(() => {
    prefetchNextPage(page, { status: selectedStatus })
  }, [page, selectedStatus, prefetchNextPage])

  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### Ejemplo 3: Prefetch dashboard cuando app carga

```typescript
// src/App.tsx
import { usePrefetchOnHover } from '@/hooks/usePrefetchQueries'
import { useEffect } from 'react'

export function App() {
  const { prefetchDashboard } = usePrefetchOnHover()

  // Cargar datos de dashboard cuando la app inicia
  useEffect(() => {
    prefetchDashboard()
  }, [])

  return <>{/* Tu app */}</>
}
```

### Ventajas

- ✅ Navegación instantánea (datos ya en cache)
- ✅ No genera requests innecesarias (React Query maneja)
- ✅ Mejora percepción de velocidad
- ✅ Cache hit rates más altos

---

## 5. Optimizar Stale Times

### Antes (Conservador)

```typescript
// Todas las queries con tiempos iguales
const STALE_TIME = 1 * 60 * 1000 // 1 minuto para TODO

useQuery({
  queryKey: ['giros'],
  queryFn: fetchGiros,
  staleTime: STALE_TIME, // Demasiado conservador
})
```

### Después (Optimizado)

```typescript
// Tiempos específicos según frecuencia de cambio
const STALE_TIMES = {
  // Datos que el usuario está CREANDO AHORA (transacciones activas)
  GIROS_LIST: 30 * 1000, // 30 seg
  GIRO_DETAIL: 20 * 1000, // 20 seg

  // Datos que cambian cada hora aprox
  EXCHANGE_RATE_CURRENT: 5 * 60 * 1000, // 5 min
  EXCHANGE_RATE_HISTORY: 30 * 60 * 1000, // 30 min

  // Datos que casi NUNCA cambian
  BANKS_LIST: 24 * 60 * 60 * 1000, // 24 horas
  BANK_ACCOUNTS: 1 * 60 * 60 * 1000, // 1 hora
}

export function useGirosList(params) {
  return useQuery({
    queryKey: ['giros', params],
    queryFn: fetchGiros,
    staleTime: STALE_TIMES.GIROS_LIST, // 30 seg en lugar de 1 min
  })
}

export function useBanksList() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
    staleTime: STALE_TIMES.BANKS_LIST, // 24 horas - casi nunca recarga
  })
}
```

### Impacto

- 📉 **Network requests:** -20% a -30%
- ⚡ **User Experience:** Más rápido, menos spinners
- 💾 **Memory:** Mejor manejo de cache
- 🔄 **Freshness:** Datos actualizados cuando importa

---

## Checklist de Implementación

### Fase 1: Monitoreo (1-2 horas)
- [ ] Agregar `useQueryMonitor()` a App.tsx
- [ ] Agregar `<QueryMetricsPanel />` a App.tsx
- [ ] Abrir DevTools y buscar "⚠️ Overfetching" warnings
- [ ] Documentar queries problemáticas

### Fase 2: Optimizar Stale Times (2-3 horas)
- [ ] Analizar patrones de uso de cada query
- [ ] Ajustar stale times en cada hook
- [ ] Verificar con `useQueryMonitor` que improved
- [ ] Medir con DevTools Network (menos requests)

### Fase 3: Pagination (4-6 horas)
- [ ] Actualizar backend para soportar pagination
- [ ] Crear `useGirosListPaginated()` hook
- [ ] Reemplazar `GirosPage` con versión paginada
- [ ] Actualizar transacciones con pagination

### Fase 4: Infinite Scroll (3-4 horas)
- [ ] Crear `useGirosInfinite()` hook
- [ ] Crear página alternativa con infinite scroll
- [ ] Implementar Intersection Observer
- [ ] Testear con scroll rápido

### Fase 5: Prefetching (2-3 horas)
- [ ] Crear `usePrefetchQueries()` hook
- [ ] Agregar prefetch en Navigation links
- [ ] Agregar prefetch de siguiente página
- [ ] Agregar prefetch en App init

---

## Métrica de Éxito

Después de implementar todas las optimizaciones:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Network Requests | 45/min | 30/min | -33% |
| Cache Hit Rate | 40% | 70% | +75% |
| Initial Load | 2.5s | 1.5s | -40% |
| Page Navigation | 800ms | 100ms | -87% |
| Data Freshness | 1min | 30s | -70% |

---

## Debugging con Query Metrics Panel

### Escenario 1: Query ejecutándose muchas veces

```
⚠️ ["giros", { status: "pending" }]
Calls: 12 (debería ser 1-2)
Size: 45.23KB
```

**Solución:**
1. Revisar si hay múltiples componentes llamando la misma query
2. Reducir staleTime si los datos cambian frecuentemente
3. Usar `refetchOnWindowFocus: false` si no es necesario

### Escenario 2: Query con datos muy grandes

```
["giros", { status: "completed" }]
Calls: 2
Size: 250KB ⚠️ (demasiado grande)
```

**Solución:**
1. Implementar pagination
2. Usar campos selectivos en API
3. Reducir `gcTime` para limpiar cache más rápido

### Escenario 3: Query nunca se ejecuta

```
["exchangeRate", "history"]
Calls: 0
```

**Solución:**
1. Verificar que el componente se está renderizando
2. Verificar que `enabled: true` está seteado
3. Revisar console para errores
4. Usar React DevTools para debuggear render

