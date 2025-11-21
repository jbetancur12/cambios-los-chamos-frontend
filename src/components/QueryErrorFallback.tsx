import { AlertCircle, RefreshCw } from 'lucide-react'
import './QueryErrorFallback.css'

interface QueryErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  isLoading?: boolean
}

/**
 * Componente para mostrar errores de queries
 * Uso en componentes:
 *
 * const { data, error, refetch, isLoading } = useGirosList()
 *
 * if (error) {
 *   return <QueryErrorFallback error={error} onRetry={refetch} isLoading={isLoading} />
 * }
 */
export function QueryErrorFallback({
  error,
  onRetry,
  isLoading,
}: QueryErrorFallbackProps) {
  return (
    <div className="query-error-fallback">
      <div className="query-error-content">
        <AlertCircle className="query-error-icon" />

        <h3>Error en la carga de datos</h3>
        <p>{error?.message || 'Ocurrió un error inesperado'}</p>

        <button
          onClick={onRetry}
          disabled={isLoading}
          className="query-error-retry-btn"
        >
          <RefreshCw size={16} />
          {isLoading ? 'Reintentando...' : 'Reintentar'}
        </button>
      </div>
    </div>
  )
}

/**
 * Componente para mostrar error en contexto de página
 */
export function PageErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null
  onRetry: () => void
}) {
  return (
    <div className="page-error-fallback">
      <div className="page-error-content">
        <AlertCircle className="page-error-icon" />

        <h2>No pudimos cargar esta página</h2>
        <p className="page-error-message">
          {error?.message ||
            'Parece que hay un problema. Intenta recargar la página.'}
        </p>

        <button onClick={onRetry} className="page-error-retry-btn">
          <RefreshCw size={18} />
          Recargar página
        </button>
      </div>
    </div>
  )
}
