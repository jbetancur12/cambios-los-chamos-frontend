# React Query Implementation Guide 📚

This guide explains how to use React Query in the Cambios Los Chamos frontend application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Query Hooks](#creating-query-hooks)
3. [Creating Mutation Hooks](#creating-mutation-hooks)
4. [Using Hooks in Components](#using-hooks-in-components)
5. [Cache Management](#cache-management)
6. [WebSocket Synchronization](#websocket-synchronization)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Query Hook Usage

```typescript
import { useGirosList } from '@/hooks/queries/useGiroQueries'

export function GirosPage() {
  // Fetch data with caching
  const { data: giros = [], isLoading, error } = useGirosList({
    status: 'PENDIENTE',
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31'
  })

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {giros.map(giro => (
        <GiroCard key={giro.id} giro={giro} />
      ))}
    </div>
  )
}
```

### Basic Mutation Hook Usage

```typescript
import { useCreateGiro } from '@/hooks/mutations/useGiroMutations'

export function CreateGiroForm() {
  const { mutate: createGiro, isPending } = useCreateGiro()

  const handleSubmit = (data) => {
    createGiro(data, {
      onSuccess: () => {
        toast.success('Giro creado exitosamente')
      },
      onError: (error) => {
        toast.error(error.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear'}
      </button>
    </form>
  )
}
```

---

## Creating Query Hooks

### File Structure

Query hooks are located in `src/hooks/queries/`:
```
src/hooks/queries/
├── useGiroQueries.ts           # Giro-related queries
├── useExchangeRateQueries.ts   # Exchange rate queries
├── useBankQueries.ts           # Bank and account queries
└── useDashboardQueries.ts      # Dashboard statistics
```

### Basic Query Hook Pattern

```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro } from '@/types/api'

interface GirosListParams {
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useGirosList(params?: GirosListParams) {
  return useQuery({
    queryKey: ['giros', params],  // Unique cache key
    queryFn: async () => {
      const response = await api.get<Giro[]>('/giro/list', { params })
      return response.data
    },
    staleTime: 1000 * 60,  // Cache for 1 minute
    gcTime: 1000 * 60 * 5, // Remove from memory after 5 minutes
  })
}
```

### Query Hook Best Practices

**1. Use Hierarchical Query Keys**
```typescript
// Good: Hierarchical structure
queryKey: ['giros', status, dateRange]  // ← Different caches for different filters

// Bad: Flat structure
queryKey: ['all-giros-with-filters']  // ← No automatic key differentiation
```

**2. Set Appropriate Stale Times**
```typescript
// Frequently changing data → shorter stale time
useQuery({
  queryKey: ['exchange-rate', 'current'],
  staleTime: 1000 * 60,  // 1 minute
})

// Static reference data → longer stale time
useQuery({
  queryKey: ['banks'],
  staleTime: 1000 * 60 * 60,  // 1 hour
})
```

**3. Handle Conditional Queries**
```typescript
// Don't fetch until condition is true
export function useGiroDetail(giroId: string | null) {
  return useQuery({
    queryKey: ['giro', giroId],
    queryFn: async () => api.get(`/giro/${giroId}`),
    enabled: !!giroId,  // ← Only fetch when giroId is provided
  })
}
```

---

## Creating Mutation Hooks

### File Structure

Mutation hooks are located in `src/hooks/mutations/`:
```
src/hooks/mutations/
├── useGiroMutations.ts         # Giro CRUD operations
└── useExchangeRateMutations.ts # Exchange rate creation
```

### Basic Mutation Hook Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Giro } from '@/types/api'

interface CreateGiroInput {
  beneficiaryName: string
  beneficiaryId: string
  // ... other fields
}

export function useCreateGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGiroInput) => {
      const response = await api.post<{ giro: Giro }>(
        '/giro/create',
        data
      )
      return response.giro
    },
    onSuccess: () => {
      // Invalidate related queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['giros'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    },
    onError: (error: any) => {
      console.error('Giro creation error:', error)
    },
  })
}
```

### Mutation Hook Best Practices

**1. Invalidate Related Queries**
```typescript
export function useDeleteGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (giroId: string) =>
      api.delete(`/giro/${giroId}`),
    onSuccess: () => {
      // Invalidate all giro-related caches
      queryClient.invalidateQueries({ queryKey: ['giros'] })
      queryClient.invalidateQueries({ queryKey: ['giro'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

**2. Pass Callbacks to Component**
```typescript
// In component:
createGiroMutation.mutate(data, {
  onSuccess: () => {
    resetForm()
    onClose()
  },
  onError: (error) => {
    toast.error(error.message)
  }
})
```

**3. Handle Optimistic Updates (Advanced)**
```typescript
// Pre-update UI before server confirmation
export function useUpdateGiro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => api.patch(`/giro/${data.giroId}`, data),
    // Pre-update cache optimistically
    onMutate: async (newData) => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: ['giro', newData.giroId] })

      // Snapshot old data
      const previousGiro = queryClient.getQueryData(['giro', newData.giroId])

      // Update cache optimistically
      queryClient.setQueryData(['giro', newData.giroId], (old: any) => ({
        ...old,
        ...newData.data
      }))

      return { previousGiro }  // Return context for rollback
    },
    // Rollback if error
    onError: (err, newData, context) => {
      if (context?.previousGiro) {
        queryClient.setQueryData(
          ['giro', newData.giroId],
          context.previousGiro
        )
      }
    },
    // Refetch to ensure consistency
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giro'] })
    },
  })
}
```

---

## Using Hooks in Components

### Simple Query Usage

```typescript
export function DashboardPage() {
  // Load data with automatic caching
  const { data: stats, isLoading } = useDashboardStats()
  const { data: giros = [] } = useRecentGiros(5)

  return (
    <div>
      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <StatCard stat={stats} />
          <GirosList giros={giros} />
        </>
      )}
    </div>
  )
}
```

### Query with Dynamic Parameters

```typescript
export function GirosPage() {
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDate, setFilterDate] = useState<DateFilterType>('TODO')

  // Query parameters change when filters change
  const { data: giros = [], isLoading } = useGirosList({
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
    dateFrom: getDateRange(filterDate).from,
    dateTo: getDateRange(filterDate).to,
  })

  return (
    <div>
      <FilterButtons
        status={filterStatus}
        onStatusChange={setFilterStatus}
      />
      {isLoading ? (
        <Skeleton />
      ) : (
        <GirosList giros={giros} />
      )}
    </div>
  )
}
```

### Mutation Usage

```typescript
export function CreateGiroSheet({ onSuccess, onOpenChange }: Props) {
  const { mutate: createGiro, isPending } = useCreateGiro()
  const { data: minoristaBalance } = useMinoristaBalance()

  const handleSubmit = (formData) => {
    // Validate
    if (!minoristaBalance?.balance) {
      toast.error('No balance available')
      return
    }

    // Call mutation
    createGiro(
      {
        beneficiaryName: formData.name,
        // ... other fields
      },
      {
        onSuccess: () => {
          toast.success('Giro creado exitosamente')
          onSuccess?.()
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Error creating giro')
        }
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear'}
      </button>
    </form>
  )
}
```

### Dependent Queries

```typescript
export function GiroDetailSheet({ giroId, open }: Props) {
  // Only fetch when sheet is open
  const { data: giro } = useGiroDetail(open ? giroId : null)

  // Only fetch when giro loads
  const { data: minoristaTransaction } = useMinoristaTransaction(
    open && giro ? giroId : null
  )

  return (
    <Sheet open={open}>
      {giro && (
        <div>
          <GiroBeneficiary giro={giro} />
          {minoristaTransaction && (
            <TransactionDetails transaction={minoristaTransaction} />
          )}
        </div>
      )}
    </Sheet>
  )
}
```

---

## Cache Management

### Query Key Patterns

```typescript
// Giro queries
['giros']                          // All giros
['giros', { status: 'PENDIENTE' }] // Giros with filters
['giro', giroId]                   // Single giro
['giro', giroId, 'transaction']    // Giro's transaction details

// Exchange rate queries
['exchangeRate', 'current']        // Current exchange rate
['exchangeRate', 'history']        // Exchange rate history

// Bank queries
['banks']                          // All banks
['bankAccounts']                   // Current user's accounts
['bankAccount', accountId]         // Single account details
['bankAccount', accountId, 'transactions']  // Account transactions

// Dashboard queries
['dashboard', 'stats']             // Dashboard statistics
['minorista', 'balance']           // Minorista balance
```

### Manual Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query'

export function MyComponent() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    // Invalidate specific query
    queryClient.invalidateQueries({
      queryKey: ['giros']
    })

    // Invalidate query prefix (all queries starting with 'giro')
    queryClient.invalidateQueries({
      queryKey: ['giro'],
      type: 'all'  // Matches all queries with this prefix
    })

    // Invalidate with specific filter
    queryClient.invalidateQueries({
      queryKey: ['giros', { status: 'PENDIENTE' }]
    })

    // Invalidate all queries
    queryClient.invalidateQueries()
  }

  return <button onClick={handleRefresh}>Refresh</button>
}
```

### Prefetching Data

```typescript
import { useQueryClient } from '@tanstack/react-query'

export function GirosList() {
  const queryClient = useQueryClient()

  const prefetchGiroDetail = (giroId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['giro', giroId],
      queryFn: () => api.get(`/giro/${giroId}`),
    })
  }

  return (
    <div>
      {giros.map(giro => (
        <GiroCard
          key={giro.id}
          giro={giro}
          onMouseEnter={() => prefetchGiroDetail(giro.id)}
        />
      ))}
    </div>
  )
}
```

---

## WebSocket Synchronization

### Overview

The application automatically syncs React Query cache with WebSocket events. **No manual WebSocket subscriptions needed in components.**

### How It Works

```typescript
// In App.tsx:
import { setupWebSocketSync } from '@/lib/websocketSync'
import { useQueryClient } from '@tanstack/react-query'

export function App() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Setup global WebSocket sync
    const cleanup = setupWebSocketSync(queryClient)

    return cleanup
  }, [queryClient])

  return <YourAppContent />
}
```

### Supported Events

The WebSocket listener automatically invalidates these queries on events:

```typescript
'giro:created'   → Invalidates ['giros']
'giro:updated'   → Invalidates ['giro', giroId]
'giro:executed'  → Invalidates ['giro', giroId], ['giros'], ['dashboard']
'giro:returned'  → Invalidates ['giro', giroId], ['giros']
'giro:deleted'   → Invalidates ['giros']
```

### Result

When a WebSocket event arrives:
1. Relevant queries are marked as stale
2. React Query refetches data in the background
3. Components automatically update with new data
4. **No component code needed** - it's all automatic!

---

## Error Handling

### Component-Level Error Handling

```typescript
export function GirosPage() {
  const { data: giros = [], error, isError } = useGirosList()

  if (isError) {
    return (
      <div className="error-container">
        <h2>Error loading giros</h2>
        <p>{error?.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return <GirosList giros={giros} />
}
```

### Mutation Error Handling

```typescript
const { mutate: createGiro } = useCreateGiro()

createGiro(data, {
  onError: (error: any) => {
    // Handle different error types
    if (error.response?.status === 400) {
      toast.error('Invalid data provided')
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to create giros')
    } else {
      toast.error('Error creating giro: ' + error.message)
    }
  }
})
```

### Error Recovery

```typescript
export function GiroDetailSheet({ giroId, open, onOpenChange }: Props) {
  const { data: giro, error, refetch } = useGiroDetail(
    open ? giroId : null
  )

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <div className="p-4">
          <h3>Error loading giro</h3>
          <button onClick={() => refetch()}>
            Retry
          </button>
          <button onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>
      </Sheet>
    )
  }

  return <GiroDetails giro={giro} />
}
```

---

## Best Practices

### ✅ Do

1. **Keep query keys consistent** across your app
   ```typescript
   // ✅ Good: same key structure everywhere
   queryKey: ['giros', params]
   ```

2. **Set appropriate stale times** for different data types
   ```typescript
   // Volatile data
   staleTime: 1000 * 60        // 1 minute

   // Stable data
   staleTime: 1000 * 60 * 60   // 1 hour
   ```

3. **Use conditional queries** for dependent data
   ```typescript
   const { data } = useQuery({
     enabled: !!parentId,  // Only fetch when parent exists
   })
   ```

4. **Invalidate related queries** on mutations
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['giros'] })
   }
   ```

5. **Use TypeScript types** for query inputs/outputs
   ```typescript
   export function useGirosList(params?: GirosListParams) {
     return useQuery<Giro[], ApiError>(...)
   }
   ```

### ❌ Don't

1. **Don't use useEffect for fetching**
   ```typescript
   // ❌ Bad
   useEffect(() => {
     fetchGiros().then(setGiros)
   }, [])

   // ✅ Good
   const { data: giros } = useGirosList()
   ```

2. **Don't create new filter objects in render**
   ```typescript
   // ❌ Bad: creates new object every render
   const { data } = useGirosList({ status: 'PENDIENTE' })

   // ✅ Good: memoize filter object
   const filters = useMemo(
     () => ({ status: 'PENDIENTE' }),
     []
   )
   const { data } = useGirosList(filters)
   ```

3. **Don't forget to invalidate cache on mutations**
   ```typescript
   // ❌ Bad: cache becomes stale
   createGiro(data)

   // ✅ Good: keep cache fresh
   mutate(data, {
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['giros'] })
     }
   })
   ```

4. **Don't mix manual state with React Query**
   ```typescript
   // ❌ Bad: duplicating state
   const [giros, setGiros] = useState([])
   const { data: queryGiros } = useGirosList()

   // ✅ Good: use React Query data directly
   const { data: giros = [] } = useGirosList()
   ```

---

## Troubleshooting

### Issue: Data Not Updating After Mutation

**Problem:** Mutation succeeds but UI doesn't update

**Solution:** Ensure mutation invalidates affected queries
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['giros']  // ← Add this!
  })
}
```

### Issue: Infinite Loading State

**Problem:** Component stuck in `isLoading = true`

**Causes & Solutions:**
```typescript
// 1. Query is disabled but component expects data
const { data, isLoading } = useQuery({
  enabled: !!userId,  // ← Check this is true
})

// 2. Network error - check error state
if (isError) {
  console.error('Query error:', error)
}

// 3. Missing or invalid query key
queryKey: ['giros']  // ← Ensure consistent
```

### Issue: Stale Data Appearing

**Problem:** Seeing old data after update

**Solution:** Reduce stale time for volatile data
```typescript
staleTime: 1000 * 60  // ← Reduce from 5 minutes to 1 minute
```

Or manually refetch:
```typescript
const { refetch } = useGirosList()
refetch()  // Force immediate refetch
```

### Issue: Memory Leak / High Memory Usage

**Problem:** React Query cache growing too large

**Solution:** Adjust garbage collection time
```typescript
useQuery({
  queryKey: ['largeLists'],
  gcTime: 1000 * 60,  // ← Reduce from 5 min to 1 min
})
```

### Issue: Queries Refetching Too Often

**Problem:** Components re-rendering frequently

**Causes & Solutions:**
```typescript
// 1. Stale time too short
staleTime: 1000 * 60  // ← Increase to 5 minutes

// 2. Query key changing unnecessarily
const filters = useMemo(
  () => ({ status }),  // ← Memoize to prevent key changes
  [status]
)

// 3. Manual refetch being called too often
// ← Review onSuccess callbacks
```

---

## Additional Resources

- **Official Docs:** https://tanstack.com/query/latest
- **React Query DevTools:** `npm install @tanstack/react-query-devtools`
- **Examples in Codebase:** See `src/hooks/queries/` and `src/hooks/mutations/`

---

## Questions?

For questions about React Query implementation:
1. Check this guide first
2. Review similar components in codebase
3. Refer to official React Query documentation
4. Check the REACT_QUERY_TESTING_RESULTS.md for test cases

**Last Updated:** November 20, 2025
**Status:** ✅ Production Ready
