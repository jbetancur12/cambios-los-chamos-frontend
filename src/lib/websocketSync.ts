import { QueryClient } from '@tanstack/react-query'
import { useGiroWebSocket } from '@/hooks/useGiroWebSocket'

/**
 * Sincroniza eventos de WebSocket con la invalidación de queries en React Query
 * Cuando un evento de giro ocurre, invalida automáticamente las queries relacionadas
 */
export function setupWebSocketSync(queryClient: QueryClient) {
  // Este hook se debe usar en un componente que esté en el nivel raíz de la app
  // Para evitar problemas de hooks, lo exportamos como configurador
  return {
    setupGiroSync: (subscribe: ReturnType<typeof useGiroWebSocket>['subscribe']) => {
      // Escuchar creación de giros
      const unsubCreated = subscribe('giro:created', () => {
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })

        // Invalidate minorista balance when giro is created
        queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })
      })

      // Escuchar actualización de giros
      const unsubUpdated = subscribe('giro:updated', (event) => {
        queryClient.invalidateQueries({ queryKey: ['giro', event.giro.id] })
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
      })

      // Escuchar giro marcado como procesando
      const unsubProcessing = subscribe('giro:processing', (event) => {
        queryClient.invalidateQueries({ queryKey: ['giro', event.giro.id] })
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
      })

      // Escuchar giro ejecutado
      const unsubExecuted = subscribe('giro:executed', (event) => {
        queryClient.invalidateQueries({ queryKey: ['giro', event.giro.id] })
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })

        // Invalidate transferencista bank accounts when giro is executed
        if (event.giro.transferencista?.id) {
          queryClient.invalidateQueries({
            queryKey: ['transferencista', event.giro.transferencista.id, 'bankAccounts'],
            exact: false,
          })
        }
      })

      // Escuchar giro devuelto
      const unsubReturned = subscribe('giro:returned', (event) => {
        queryClient.invalidateQueries({ queryKey: ['giro', event.giro.id] })
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })
      })

      // Escuchar giro eliminado
      const unsubDeleted = subscribe('giro:deleted', (event) => {
        queryClient.invalidateQueries({ queryKey: ['giro', event.giro.id] })
        queryClient.invalidateQueries({ queryKey: ['giros'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })

        // Invalidate minorista balance on delete (for refund)
        queryClient.invalidateQueries({ queryKey: ['minorista'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['bankAccounts'], exact: false })
      })

      // Retornar función para desuscribirse
      return () => {
        unsubCreated()
        unsubUpdated()
        unsubProcessing()
        unsubExecuted()
        unsubReturned()
        unsubDeleted()
      }
    },
  }
}
