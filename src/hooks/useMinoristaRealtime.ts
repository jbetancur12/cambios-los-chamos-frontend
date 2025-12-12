import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGiroWebSocket } from './useGiroWebSocket'

export function useMinoristaRealtime(minoristaId?: string) {
  const queryClient = useQueryClient()
  const { subscribe } = useGiroWebSocket()

  useEffect(() => {
    // Escuchar actualizaciones de balance
    const unsubscribeBalance = subscribe('minorista:balance_updated', (event: any) => {
      // Verificar si el evento es para este minorista (si se especifica ID)
      if (minoristaId && event.minoristaId && event.minoristaId !== minoristaId) return

      // Invalidar cache de 'me' (balance en dashboard)
      queryClient.invalidateQueries({ queryKey: ['minorista', 'me'] })

      // Invalidar cache de lista de minoristas (para admins)
      queryClient.invalidateQueries({ queryKey: ['minoristas'] })
    })

    // Escuchar actualizaciones de transacciones
    const unsubscribeTransactions = subscribe('minorista:transaction_updated', (event: any) => {
      // Verificar ID si es necesario
      const t = event.transaction || event
      if (minoristaId && t.minorista && t.minorista.id !== minoristaId) return

      // Invalidar lista de transacciones
      queryClient.invalidateQueries({ queryKey: ['minoristaTransactions'] })

      // También invalidar el balance porque una transacción lo cambia
      queryClient.invalidateQueries({ queryKey: ['minorista', 'me'] })

      // Mostrar toast informativo? (Opcional, puede ser molesto si hay muchas)
      // toast.info('Nueva transacción registrada')
    })

    return () => {
      unsubscribeBalance()
      unsubscribeTransactions()
    }
  }, [subscribe, queryClient, minoristaId])
}
