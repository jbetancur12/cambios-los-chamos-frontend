import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Todas las queries del módulo usan el prefijo 'cobranza-'. Tras pagar/crear/editar se refrescan todas
// porque el estado "en mora", saldos y totales cambian en varias pantallas.
export function useCobranzasInvalidate() {
  const queryClient = useQueryClient()
  return useCallback(
    () =>
      queryClient.invalidateQueries({
        predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('cobranza-'),
      }),
    [queryClient]
  )
}
