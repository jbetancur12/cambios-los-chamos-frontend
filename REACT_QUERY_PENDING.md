# React Query Implementation - Pending Tasks

## Overview

This document tracks the pending work for the React Query integration. **Phase 1 (Setup & Hooks)** has been completed and not yet committed. **Phase 2 (Component Migrations)** and beyond are pending.

---

## Phase 1 - COMPLETED ✅

### Infrastructure Setup
- [x] Install `@tanstack/react-query` package
- [x] Create `src/lib/queryClient.ts` with optimal configuration
- [x] Wrap `App.tsx` with QueryClientProvider
- [x] Set up TypeScript types for query/mutation hooks

### Query Hooks Created
- [x] `src/hooks/queries/useGiroQueries.ts`
  - `useGirosList(params)` - List giros with filters (status, dateFrom, dateTo)
  - `useGiroDetail(giroId)` - Single giro details
  - `useRecentGiros(limit)` - Recent giros for dashboard

- [x] `src/hooks/queries/useExchangeRateQueries.ts`
  - `useCurrentExchangeRate()` - Current rate (staleTime: 1 min)
  - `useExchangeRateHistory(limit)` - Rate history (staleTime: 5 min)

- [x] `src/hooks/queries/useBankQueries.ts`
  - `useBanksList()` - All banks (cached 1 hour)
  - `useBankAccountsList()` - Current user bank accounts
  - `useBankAccountDetail(accountId)` - Single account details
  - `useBankAccountTransactions(params)` - Account transactions with pagination

- [x] `src/hooks/queries/useDashboardQueries.ts`
  - `useDashboardStats()` - Dashboard statistics
  - `useMinoristaBalance()` - Minorista balance

### Mutation Hooks Created
- [x] `src/hooks/mutations/useGiroMutations.ts`
  - `useCreateGiro()` - Create new giro
  - `useExecuteGiro()` - Execute giro transfer
  - `useMarkGiroAsProcessing()` - Mark giro as processing
  - `useReturnGiro()` - Return giro
  - `useDeleteGiro()` - Delete giro

### WebSocket Integration
- [x] `src/lib/websocketSync.ts` - WebSocket cache synchronization
  - Listens to `giro:created`, `giro:updated`, `giro:executed`, `giro:returned`, `giro:deleted`
  - Automatically invalidates affected queries in React Query cache

### Verification
- [x] `npm run ts-check` - All TypeScript compiles cleanly

---

## Phase 2 - COMPONENT MIGRATIONS (Pending)

### GirosPage.tsx
**Status:** ✅ COMPLETED (Phase 2.3)
**Changes Made:**
- ✅ Replaced fetchGiros() with useGirosList() hook with dynamic parameters
- ✅ Removed manual loading state (React Query handles isLoading)
- ✅ Removed manual giros state (React Query handles caching)
- ✅ Removed useGiroWebSocket subscription (global setupWebSocketSync handles it)
- ✅ Filters (status, date range, custom dates) work with React Query parameters
- ✅ Removed 2 useEffect hooks and 40+ lines of WebSocket boilerplate
- ✅ Client-side pagination and search filtering still working
- ✅ All loading/error states use React Query
- ✅ TypeScript compiles cleanly

**Expected Changes:**
```typescript
// Before: Manual state + useEffect
const [giros, setGiros] = useState([])
const [loading, setLoading] = useState(false)
useEffect(() => {
  setLoading(true)
  api.getGiros().then(setGiros).finally(() => setLoading(false))
}, [status, dateRange])

// After: React Query hook
const { data: giros = [], isLoading } = useGirosList({ status, dateFrom, dateTo })
```

### GiroDetailSheet.tsx
**Status:** ✅ COMPLETED (Phase 2.1)
**Changes Made:**
- ✅ Replaced `useEffect` for giro detail with `useGiroDetail(giroId)`
- ✅ Replaced `useEffect` for bank accounts with `useBankAccountsList()`
- ✅ Added `useMinoristaTransaction(giroId)` for minorista transaction details
- ✅ Removed all manual loading/error states (React Query handles these)
- ✅ Created `useUpdateGiro()` and `useUpdateGiroRate()` mutation hooks
- ✅ Updated all mutation handlers to use React Query mutations
- ✅ Removed WebSocket listeners (handled by setupWebSocketSync)
- ✅ Removed 6 useEffect hooks and 40+ lines of boilerplate
- ✅ TypeScript compiles cleanly

### DashboardPage.tsx
**Status:** ✅ COMPLETED (Phase 2.2)
**Changes Made:**
- ✅ Replaced all `useEffect` hooks with React Query query hooks
- ✅ Used `useDashboardStats()` for dashboard statistics (girosCount, volumes, earnings)
- ✅ Used `useMinoristaBalance()` for minorista balance and credit
- ✅ Used `useRecentGiros(5)` for recent giros with automatic caching
- ✅ Used `useBankAccountsList()` for transferencista bank accounts
- ✅ Removed all manual `fetchMinoristaBalance()` and `fetchBankAccounts()` functions
- ✅ Removed manual loading/error states (React Query handles these)
- ✅ Removed 2 useEffect hooks and 50+ lines of boilerplate
- ✅ TypeScript compiles cleanly
- ✅ Balance card now properly uses `minoristaBalanceData?.balance` and `minoristaBalanceData?.credit`

### ExchangeRatePage.tsx
**Status:** ✅ COMPLETED (Phase 2.4)
**Changes Made:**
- ✅ Created useCreateExchangeRate() mutation hook
- ✅ Replaced current rate fetch with useCurrentExchangeRate()
- ✅ Replaced history fetch with useExchangeRateHistory(20)
- ✅ Removed fetchRates() and fetchCurrentRate() functions
- ✅ Removed manual loading state (React Query handles isLoading)
- ✅ handleSubmit() now uses mutation.mutate()
- ✅ Form button disabled state uses mutation.isPending
- ✅ Mutation auto-invalidates current rate and history on success
- ✅ Kept image preview modal functionality unchanged
- ✅ TypeScript compiles cleanly

### CreateGiroSheet.tsx
**Status:** ⏳ Pending
**Current:** Uses `useBankAccountsList()` indirectly
**Migration Plan:**
- Ensure using `useBankAccountsList()` from React Query hooks
- Use `useCreateGiro()` mutation instead of direct API call
- Implement optimistic updates for better UX

### Other Pages/Components
**Status:** ⏳ Pending
**List:** ExchangeRateDetailPage, ReportsPage, AdminPanel, etc.
**Migration Plan:** Follow same pattern as above (identify data fetching, replace with React Query hooks)

---

## Phase 3 - TESTING & VALIDATION (Pending)

### Browser Testing
- [ ] Open DevTools React Query DevTools extension (when installed)
- [ ] Verify cache state for each query hook
- [ ] Test cache invalidation on mutations
- [ ] Verify stale time behavior (should refetch after stale)
- [ ] Test garbage collection (should remove cache after gcTime)

### WebSocket Testing
- [ ] Create giro → verify `giros` query auto-invalidates
- [ ] Update giro → verify specific giro detail auto-invalidates
- [ ] Execute giro → verify balance and list auto-update
- [ ] Delete giro → verify list auto-updates

### Component Testing
- [ ] Test GirosPage filters (status, date range) work with React Query
- [ ] Test GiroDetailSheet data loads correctly
- [ ] Test DashboardPage displays up-to-date stats
- [ ] Test CreateGiroSheet submits create giro mutation
- [ ] Test optimistic updates (if implemented)

### Mobile Testing
- [ ] Test Web Share API on iOS device
- [ ] Test Web Share API on Android device
- [ ] Test amount input formatting with NumericFormat
- [ ] Test keyboard behavior on mobile

### Edge Cases
- [ ] Test amount input with value `0.01`
- [ ] Test amount input with value `999999.99`
- [ ] Test giro list with no results
- [ ] Test giro detail with deleted giro (should handle error)
- [ ] Test network offline behavior (should serve cached data)

---

## Phase 4 - OPTIONAL OPTIMIZATIONS (Pending)

### React Query DevTools
- [ ] Install `@tanstack/react-query-devtools`
- [ ] Add DevTools component to App.tsx (dev only)
- [ ] Document how to use for debugging

### Zustand Integration
- [ ] Assess if Zustand needed (global UI state like modals, filters)
- [ ] Create `src/store/` if needed
- [ ] Only use for non-server state (UI preferences, filters, etc.)
- [ ] Keep React Query for all server state

### Performance Monitoring
- [ ] Add query key monitoring to detect overfetching
- [ ] Optimize stale times based on actual usage patterns
- [ ] Consider pagination for large lists (giros, transactions)
- [ ] Implement infinite queries for scroll-to-load if needed

### Documentation
- [ ] Create `REACT_QUERY_GUIDE.md` with:
  - How to create new query hooks
  - How to create new mutation hooks
  - Best practices for query invalidation
  - WebSocket sync patterns
  - Examples for each hook type

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│ (GirosPage, DashboardPage, CreateGiroSheet, etc.)       │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────────┐   ┌───────────────────┐
   │Query Hooks  │   │ Mutation Hooks    │
   │ (useGiro*)  │   │ (useGiro*Mutation)│
   └──────┬──────┘   └─────────┬─────────┘
          │                    │
          └────────┬───────────┘
                   │
          ┌────────▼────────┐
          │  React Query    │
          │ QueryClient     │
          │ (Cache Layer)   │
          └────────┬────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌──────────────┐   ┌──────────────┐
   │  REST API    │   │  WebSocket   │
   │ (axios)      │   │ (auto-sync)  │
   └──────────────┘   └──────────────┘
```

---

## How to Use Query/Mutation Hooks

### Basic Query Usage

```typescript
import { useGirosList } from '@/hooks/queries/useGiroQueries'

export function GirosPage() {
  const { data: giros = [], isLoading, error } = useGirosList({
    status: 'pending',
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

### Mutation Usage with Optimistic Updates

```typescript
import { useCreateGiro } from '@/hooks/mutations/useGiroMutations'
import { useGirosList } from '@/hooks/queries/useGiroQueries'

export function CreateGiroForm() {
  const { mutate: createGiro, isPending } = useCreateGiro()
  const queryClient = useQueryClient()

  const handleSubmit = async (data) => {
    createGiro(data, {
      onSuccess: (newGiro) => {
        // Already invalidated in hook, but can add custom logic
        console.log('Giro created:', newGiro)
      },
      onError: (error) => {
        console.error('Failed to create giro:', error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### WebSocket Synchronization

```typescript
import { useEffect } from 'react'
import { setupWebSocketSync } from '@/lib/websocketSync'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocketStore } from '@/store/websocket'

export function AppWithWebSocket() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocketStore()

  useEffect(() => {
    const cleanup = setupWebSocketSync(queryClient)
    // This will auto-invalidate queries based on WebSocket events

    return cleanup
  }, [queryClient])

  return <App />
}
```

---

## Checklist for Phase 2 Migration

Each component migration should follow this checklist:

- [x] **GiroDetailSheet.tsx (DONE)**
  - [x] Identify all `useEffect` hooks used for data fetching
  - [x] Replace with appropriate React Query hooks
  - [x] Remove manual `useState` for data/loading/error
  - [x] Update TypeScript types if needed
  - [x] Run `npm run ts-check`

- [x] **DashboardPage.tsx (DONE)**
  - [x] Identify all `useEffect` hooks used for data fetching
  - [x] Replace with appropriate React Query hooks
  - [x] Remove manual `useState` for data/loading/error
  - [x] Update TypeScript types if needed
  - [x] Run `npm run ts-check`

- [x] **GirosPage.tsx (DONE)**
  - [x] Replace fetchGiros() with useGirosList() hook
  - [x] Remove manual loading state
  - [x] Update filter state to work with React Query
  - [x] Remove WebSocket subscription (global handler)
  - [x] Run `npm run ts-check`

- [x] **ExchangeRatePage.tsx (DONE)**
  - [x] Create useCreateExchangeRate() mutation hook
  - [x] Replace current rate fetch with useCurrentExchangeRate()
  - [x] Replace history fetch with useExchangeRateHistory()
  - [x] Update form submission to use mutation
  - [x] Run `npm run ts-check`

- [ ] **CreateGiroSheet.tsx (NEXT)**
- [ ] **Other components**

---

## Priority Order (Recommended)

1. **✅ COMPLETED (Phase 2.1)** - GiroDetailSheet.tsx
2. **✅ COMPLETED (Phase 2.2)** - DashboardPage.tsx
3. **✅ COMPLETED (Phase 2.3)** - GirosPage.tsx
4. **✅ COMPLETED (Phase 2.4)** - ExchangeRatePage.tsx
5. **CreateGiroSheet.tsx (Phase 2.5)** - Mutation testing
6. **Other components** - Following same pattern

---

## Notes

- **Not Committed:** Phase 1 work is complete but not committed. Review before proceeding with Phase 2.
- **TypeScript Clean:** All hooks have full TypeScript support, `npm run ts-check` passes.
- **No Breaking Changes:** Phase 1 adds infrastructure only, no component changes yet.
- **WebSocket Ready:** WebSocket sync is implemented and ready to use.
- **Stale Times:** Configured conservatively (1-5 min for frequently changing data, 1 hour for static data like banks).

---

## Questions/Clarifications Needed

Before continuing with Phase 2, consider:

1. Should we commit Phase 1 before starting migrations?
2. Any specific components you want to migrate first?
3. Are the stale times (1-5 minutes) appropriate for your use case?
4. Should we add React Query DevTools for debugging?
5. Do we need Zustand for global UI state (filters, modals)?
