# Phase 2.6+ Migration Roadmap

**Status:** Ready to Begin
**Target:** Migrate remaining 8 components to React Query
**Priority Levels:** High, Medium, Lower

---

## Overview

This document outlines the remaining React Query migrations for Phase 2.6 and beyond. All foundational infrastructure is in place, and pattern templates are available from completed Phase 2.1-2.5 migrations.

---

## High Priority Components (Complex, Multi-API)

### Phase 2.6 - ReportsPage.tsx ⭐ **High Priority**
**Status:** ✅ Query hooks created (useReportQueries.ts)
**Complexity:** High (4 different report types with conditional loading)
**Est. Effort:** 3-4 hours

**Current Implementation:**
- Manual state: activeTab, dateFrom, dateTo, loading, 5 report states
- 2 useEffect hooks: date initialization and report loading
- 4 conditional API calls based on activeTab
- No WebSocket sync needed (static reports)

**Migration Plan:**
1. Replace state variables with React Query hooks:
   - `useSystemProfitReport(dateFrom, dateTo)` → systemReport
   - `useSystemProfitTrendReport(dateFrom, dateTo)` → systemTrendReport
   - `useMinoristaProfitReport(dateFrom, dateTo)` → minoristaReport
   - `useBankTransactionReport(dateFrom, dateTo)` → bankReport
   - `useMinoristaTransactionReport(dateFrom, dateTo)` → minoristaTransactionReport

2. Remove useEffect hooks (React Query handles caching)
3. Update loading state to use combined query states
4. Update error handling to use query error states

**Query Keys Pattern:**
```typescript
['reports', 'system-profit', { dateFrom, dateTo }]
['reports', 'system-profit-trend', { dateFrom, dateTo }]
['reports', 'minorista-profit', { dateFrom, dateTo }]
['reports', 'bank-transactions', { dateFrom, dateTo }]
['reports', 'minorista-transactions', { dateFrom, dateTo }]
```

---

### Phase 2.7 - UsersPage.tsx ⭐ **High Priority**
**Status:** Query hooks needed
**Complexity:** High (3 different role-based API calls with filtering)
**Est. Effort:** 3-4 hours

**Current Implementation:**
- Manual state: users, loading, selectedRole, filters
- useEffect with Promise.all() for parallel fetches
- Conditional API calls based on selectedRole
- Multiple data transformations

**Data Fetched:**
- `/admin/users/all` - all users
- `/admin/transferencistas` - all transferencistas
- `/admin/minoristas` - all minoristas

**Migration Plan:**
1. Create query hooks file: `useUserQueries.ts`
2. Create hooks:
   - `useAllUsers()`
   - `useTransferencistas()`
   - `useMinoristas()`
   - Consider combined hook: `useUsersWithRole(selectedRole)`

3. Replace state with query hooks
4. Remove Promise.all() logic - React Query handles parallel requests
5. Update filtering logic to work with React Query data

**Stale Times:**
- User lists: 5 minutes (moderate volatility)
- Role-specific lists: 5 minutes

---

### Phase 2.8 - BankTransactionsPage.tsx ⭐ **High Priority**
**Status:** Query hooks needed
**Complexity:** High (pagination + date filtering + single account details)
**Est. Effort:** 4-5 hours

**Current Implementation:**
- Manual state: bankAccount, transactions, page, totalPages, dateRange, loading
- 2 useEffect hooks: account loading + transactions pagination
- Dependent queries (requires accountId to fetch transactions)
- Pagination logic

**Data Fetched:**
- `/bank-account/{accountId}` - single account details
- `/bank-account/{accountId}/transactions?page=X&dateFrom=Y&dateTo=Z`

**Migration Plan:**
1. Create query hooks file: `useBankAccountQueries.ts` (if not exists)
2. Create hooks:
   - `useBankAccountDetail(accountId)` - may already exist
   - `useBankAccountTransactions(accountId, page, dateRange)` - may already exist
   - Consider pagination strategy (offset-based vs cursor-based)

3. Implement pagination with React Query:
   ```typescript
   useQuery({
     queryKey: ['bankAccount', accountId, 'transactions', { page, dateRange }],
     queryFn: () => fetchTransactions(accountId, page, dateRange),
   })
   ```

4. Remove manual pagination state
5. Update filtering logic for date ranges

**Pagination Approach:**
- Keep page number in component state (React Query caches per page)
- Each page number creates different cache entry
- Prefetch next page on user interaction

---

### Phase 2.9 - MinoristaTransactionsPage.tsx ⭐ **High Priority**
**Status:** Query hooks needed
**Complexity:** High (similar to BankTransactionsPage + minorista filtering)
**Est. Effort:** 3-4 hours

**Current Implementation:**
- Manual state: minorista, transactions, page, totalPages, dateRange, loading
- useCallback for data fetching functions
- 2 useEffect hooks
- Pagination logic

**Data Fetched:**
- `/minorista/me` or `/minorista/{minoristaId}`
- `/minorista/{minoristaId}/transactions?page=X&dateFrom=Y&dateTo=Z`

**Migration Plan:**
1. Use existing hooks:
   - `useMinoristaBalance()` - get current minorista
   - Create if missing: `useMinoristaTransactions(minoristaId, page, dateRange)`

2. Implement pagination similar to BankTransactionsPage
3. Remove useCallback functions (hooks handle it)
4. Remove manual pagination state
5. Refactor date range handling

---

## Medium Priority Components (Simpler, Single/Dual API)

### Phase 2.10 - BankAccountsPage.tsx ⭐ **Medium Priority**
**Status:** Query hook needed
**Complexity:** Medium (list + client-side filtering/search)
**Est. Effort:** 1-2 hours

**Current Implementation:**
- Manual state: accounts, filteredAccounts, loading, searchTerm
- Single useEffect: fetch all accounts
- Client-side filtering/searching

**Data Fetched:**
- `/bank-account/all` - all bank accounts

**Migration Plan:**
1. Create hook if missing: `useBankAccountsList()`
2. Replace state with query hook
3. Keep client-side filtering logic (React Query filters via query keys)
4. Remove useEffect

---

### Phase 2.11 - MinoristaReportsPage.tsx ⭐ **Medium Priority**
**Status:** Query hooks needed
**Complexity:** Medium (2 parallel API calls)
**Est. Effort:** 1-2 hours

**Current Implementation:**
- Manual state: dateFrom, dateTo, loading, report, trendReport
- useEffect with Promise.all() for parallel fetches
- Simple date range filtering

**Data Fetched:**
- `/reports/minorista/profit?dateFrom=X&dateTo=Y`
- `/reports/minorista/profit-trend?dateFrom=X&dateTo=Y`

**Migration Plan:**
1. Create hooks in `useReportQueries.ts`:
   - `useMinoristaReport(dateFrom, dateTo)`
   - `useMinoristaReportTrend(dateFrom, dateTo)`

2. Replace state with hooks
3. Remove Promise.all() - React Query handles parallelization
4. Update date filtering

---

### Phase 2.12 - CalculadoraPage.tsx ⭐ **Medium Priority**
**Status:** Query hook needed
**Complexity:** Low-Medium (single API call + lots of client-side calculations)
**Est. Effort:** 1 hour

**Current Implementation:**
- Manual state: rate, usdBCV, resultBCV, etc.
- useEffect: fetch current exchange rate
- Multiple useEffect hooks for calculations

**Data Fetched:**
- `/exchange-rate/current` - current rate (probably already have hook)

**Migration Plan:**
1. Use existing hook: `useCurrentExchangeRate()`
2. Remove useEffect for rate fetching
3. Keep calculation logic (not affected by React Query)
4. Simplify component state management

---

## Lower Priority Components (Wrapper/Config)

### Phase 2.13 - ConfigPage.tsx ⭐ **Lower Priority**
**Status:** Custom hook, unique pattern
**Complexity:** Medium (custom printer config hook)
**Est. Effort:** 2-3 hours

**Current Implementation:**
- Uses custom hook: `usePrinterConfigAPI()`
- Manual loading/error states
- useEffect to load config on mount

**Consideration:**
- May need to convert `usePrinterConfigAPI()` to React Query pattern
- OR keep as-is if it's a simple wrapper

**Migration Plan (if needed):**
1. Refactor `usePrinterConfigAPI()` to use React Query
2. Update component to use refactored hook
3. Remove manual loading state

---

## Implementation Template

Each migration should follow this pattern:

### 1. Create Query Hooks (if needed)
```typescript
// src/hooks/queries/use[Type]Queries.ts
export function use[Data](params) {
  return useQuery({
    queryKey: ['[type]', params],
    queryFn: async () => api.get(`/endpoint`, { params }),
    enabled: !!params.requiredValue,
    staleTime: 1000 * 60 * 5,
  })
}
```

### 2. Update Component Imports
```typescript
// Remove
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

// Add
import { use[Data] } from '@/hooks/queries/use[Type]Queries'
```

### 3. Replace State + useEffect
```typescript
// Before
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
useEffect(() => {
  api.get('/endpoint').then(setData)
}, [])

// After
const { data, isLoading: loading } = use[Data]()
```

### 4. Update Loading/Error States
```typescript
// Use query states directly
const { isLoading, error, data } = use[Data]()
```

### 5. Run TypeScript Check
```bash
npm run ts-check
```

---

## Dependency Map

Some components depend on hooks from others:

```
useReportQueries ← ReportsPage (Phase 2.6)
useBankAccountQueries ← BankTransactionsPage (Phase 2.8)
useUserQueries ← UsersPage (Phase 2.7)
useExchangeRateQueries ← CalculadoraPage (already exists - Phase 2.12)
useMinoristaBalance ← MinoristaReportsPage (already exists - Phase 2.11)
```

---

## Testing Strategy for Phase 2.6+

### For Each Component:
1. **Load Test**: Verify component loads without errors
2. **Data Display**: Verify data displays correctly from React Query cache
3. **Filter Test**: Verify dynamic parameters trigger new queries
4. **Error Handling**: Verify graceful error display
5. **TypeScript**: Run `npm run ts-check` - must pass

### Manual Testing:
1. Navigate to component page
2. Verify data loads
3. Change filters (if applicable)
4. Verify data updates
5. Open DevTools Network tab - should see fewer XHR calls (cached data)

---

## Estimated Total Timeline

- **Phase 2.6**: 3-4 hours (ReportsPage)
- **Phase 2.7**: 3-4 hours (UsersPage)
- **Phase 2.8**: 4-5 hours (BankTransactionsPage)
- **Phase 2.9**: 3-4 hours (MinoristaTransactionsPage)
- **Phase 2.10-2.11**: 2-3 hours combined
- **Phase 2.12**: 1 hour (CalculadoraPage)
- **Phase 2.13**: 0-3 hours (ConfigPage, if needed)

**Total Estimated Effort:** 19-28 hours (roughly 5-7 days at 4 hrs/day)

---

## Completion Criteria

Each phase is complete when:
1. ✅ Query hooks created and typed
2. ✅ Component refactored to use React Query
3. ✅ All useEffect hooks removed (except for side effects)
4. ✅ Manual state variables replaced
5. ✅ TypeScript validation passes (`npm run ts-check`)
6. ✅ Component loads without errors in browser
7. ✅ Data displays correctly
8. ✅ Filters/pagination work correctly
9. ✅ Git commit created with clear message

---

## Notes

- All infrastructure is in place (QueryClient, hooks, WebSocket sync)
- Use patterns from Phase 2.1-2.5 as templates
- Document any new patterns or edge cases
- Create dedicated test results after completing Phase 2.6+

---

## Next Steps

1. Start Phase 2.6 (ReportsPage) using template above
2. Test thoroughly before moving to Phase 2.7
3. Complete all high-priority components before medium-priority
4. Update progress tracking after each phase
5. Create new test document when Phase 2.6+ complete

**Ready to begin! Let me know when you want to start Phase 2.6** 🚀
