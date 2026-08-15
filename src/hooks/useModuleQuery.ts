import { useQuery, type UseQueryOptions, type UseQueryResult, type QueryKey } from '@tanstack/react-query'

// Wrapper del módulo cobranzas: fuerza refetch al montar la página
// (el queryClient global tiene refetchOnMount: false)
export function useModuleQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...options,
    refetchOnMount: true,
  })
}
