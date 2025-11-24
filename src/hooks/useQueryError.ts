import { type UseQueryResult, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { toast } from 'sonner'

interface AxiosErrorResponse {
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
  message: string
}

/**
 * Hook para manejar errores de queries de manera consistente
 *
 * Uso:
 * const { data, isError, errorMessage } = useQueryWithErrorHandling(useGirosList())
 */
export function useQueryError<T>(query: UseQueryResult<T> | UseInfiniteQueryResult<T>) {
  const isError = 'isError' in query ? query.isError : false
  const error = 'error' in query ? query.error : null

  let errorMessage = ''
  let errorStatus: number | undefined

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosErrorResponse
    errorStatus = axiosError.response?.status
    errorMessage = axiosError.response?.data?.message || axiosError.message || 'Error en la solicitud'
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = 'Error desconocido'
  }

  return {
    isError,
    error,
    errorMessage,
    errorStatus,
    isNetworkError: errorStatus === undefined,
    isNotFound: errorStatus === 404,
    isUnauthorized: errorStatus === 401,
    isForbidden: errorStatus === 403,
    isServerError: (errorStatus ?? 0) >= 500,
  }
}

/**
 * Hook para mostrar errores de queries en toasts
 *
 * Uso:
 * const query = useGirosList()
 * useQueryErrorNotification(query)
 */
export function useQueryErrorNotification<T>(
  query: UseQueryResult<T> | UseInfiniteQueryResult<T>,
  customMessages?: Record<number, string>
) {
  const { isError, error, errorMessage, errorStatus } = useQueryError(query)

  if (isError && error) {
    const customMessage = errorStatus ? customMessages?.[errorStatus] : undefined

    const message = customMessage || getDefaultErrorMessage(errorStatus, errorMessage)

    // Evitar mostrar múltiples toasts del mismo error
    const errorKey = `${errorStatus}-${errorMessage}`
    if (!window.__notifiedErrors) {
      window.__notifiedErrors = new Set()
    }

    if (!window.__notifiedErrors.has(errorKey)) {
      toast.error(message)
      window.__notifiedErrors.add(errorKey)

      // Limpiar después de 5 segundos
      setTimeout(() => {
        window.__notifiedErrors?.delete(errorKey)
      }, 5000)
    }
  }
}

/**
 * Mensajes de error por defecto según status HTTP
 */
function getDefaultErrorMessage(status: number | undefined, fallback: string): string {
  const messages: Record<number, string> = {
    400: '❌ Datos inválidos. Revisa los campos y vuelve a intentar.',
    401: '🔐 Sesión expirada. Por favor inicia sesión nuevamente.',
    403: '🚫 No tienes permiso para acceder a esto.',
    404: '🔍 No encontrado. Este recurso no existe.',
    429: '⏱️ Demasiadas solicitudes. Intenta más tarde.',
    500: '⚠️ Error en el servidor. Intenta más tarde.',
    503: '🔧 Servicio no disponible. Estamos haciendo mantenimiento.',
  }

  return messages[status || 0] || fallback || '❌ Error en la solicitud'
}

/**
 * Hook para retry automático con exponential backoff
 *
 * Uso en hook de query:
 * const { retry: shouldRetry } = useRetryConfig()
 * return useQuery({
 *   queryFn: fetchGiros,
 *   retry: shouldRetry,
 * })
 */
export function useRetryConfig() {
  return {
    retry: (failureCount: number, error: unknown) => {
      // No reintentar en estos casos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosErrorResponse
        const status = axiosError.response?.status ?? 0
        // No reintentar en errores de cliente (4xx) excepto 429
        if (status >= 400 && status < 500 && status !== 429) {
          return false
        }
      }

      // Reintentar máximo 3 veces
      return failureCount < 3
    },

    // Delay con exponential backoff: 1s, 2s, 4s
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
}

// Type augmentation para poder usar window.__notifiedErrors
declare global {
  interface Window {
    __notifiedErrors?: Set<string>
  }
}
